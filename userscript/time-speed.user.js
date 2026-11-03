// ==UserScript==
// @name         Upgtree 时间倍速 + 自动购买
// @namespace    local.upgtree.speed
// @version      1.1.1
// @description  给 Upgrade Land / upgtree 加时间倍速（预设 0.1×~100×，支持减速 + 自定义）和自动购买；游戏内自动化接管后脚本自动让位
// @author       local
// @match        *://andyyim175.github.io/upgtree/*
// @match        *://*.github.io/*upgtree*
// @match        file:///*upgtree*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * 倍速原理（看源码得出的）：
 *   主循环 gameLoop() 每帧算 dt = min(50, timestamp - lastTime)，累加到 gameTickAccumulator，
 *   凑够 GAME_TICK_MS(100ms) 就调用一次 tickGame(100)。
 *   而 tickGame(dtMs) 完全由参数驱动 —— 里面没有任何 Date.now() 依赖核心经济结算。
 *   所以只要把 tickGame 包一层、每次调用多跑几次，时间就按倍数前进；
 *   渲染（canvas / 货币栏）仍在主循环里正常节奏走，不跟着放大。
 *
 * 自动购买：
 *   复用游戏接口 isNodeUnlocked / getCost / buyUpgrade(id, true, false)（照常扣钱），
 *   每 400ms 买一遍所有已解锁且买得起的升级。
 *   一旦检测到游戏内自动化（节点等级>0 且效果含 type:'automation'，或观察到 isFree=true 的
 *   buyUpgrade 调用），脚本的自动购买会自动关闭，避免两边抢同一批节点。
 *
 * 已知边界：
 *   游戏自带自动化有 `performance.now() - lastAutomationTime >= 200` 的真实时间闸门，
 *   所以倍速不会加速它（它每次照样买到当前买得起的量，结果不变）。
 *   这个闸门在闭包里，外部改不了，属于预期行为。
 */

(function () {
  'use strict';

  const STORE_KEY = 'upgtree.speed';
  const MIN_SPEED = 0.1;
  const MAX_SPEED = 1000;
  const PRESETS = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100];

  let speed = loadSpeed();
  let enabled = true;
  let rawTick = null;
  let carry = 0;              // 小数倍速的余数
  let tickCount = 0;          // 统计用：最近一秒的原始 tick 次数
  let lastTickSample = performance.now();
  let tickRate = 0;

  function loadSpeed() {
    const v = parseFloat(localStorage.getItem(STORE_KEY) || '1');
    return clampSpeed(isFinite(v) ? v : 1);
  }

  function clampSpeed(v) {
    if (!isFinite(v)) return 1;
    return Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(v * 100) / 100));
  }

  function saveSpeed() {
    try { localStorage.setItem(STORE_KEY, String(speed)); } catch (e) { /* ignore */ }
  }

  /* ---------------- 核心：包装 tickGame ---------------- */

  function install() {
    if (typeof window.tickGame !== 'function') return false;
    if (window.tickGame.__speedPatched) return true;

    rawTick = window.tickGame;

    const wrapped = function (dtMs) {
      if (!enabled) return rawTick.call(this, dtMs);

      // 游戏自己暂停时，tickGame 内部会直接 return，没必要空转 N 次
      try {
        if (typeof gameState !== 'undefined' && gameState && gameState.paused) {
          return rawTick.call(this, dtMs);
        }
      } catch (e) { /* gameState 拿不到就照常跑 */ }

      // 小数倍速：攒够整数再执行，保证 1.5x 长期平均准确
      carry += speed;
      let n = Math.floor(carry);
      carry -= n;
      if (n <= 0) return;
      if (n > 200) n = 200;   // 单次上限，避免一帧跑太久

      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        rawTick.call(this, dtMs);
        tickCount++;
        // 单次调用超过 14ms 就提前收手，宁可这帧少跑几次也别把页面卡死
        if (performance.now() - t0 > 14) break;
      }
    };

    wrapped.__speedPatched = true;
    wrapped.__raw = rawTick;
    window.tickGame = wrapped;
    return true;
  }

  /* ---------------- 自动购买 ---------------- */
  /*
   * 直接复用游戏自己的接口，不模拟点击：
   *   isNodeUnlocked(node) → 判断是否已解锁
   *   getCost(node)        → 当前升一级的价格（自动处理 maxLevel / bulkFinalCost）
   *   buyUpgrade(id, true, false)
   *     第二个参数 isAutomated=true：能买多少买多少（和游戏内自动化一致）
   *     第三个参数 isFree=false：照常扣钱（游戏内自动化传的是 true，即免费）
   *
   * 关闭条件：游戏里已经拿到「自动化」升级（节点等级 > 0 且效果里有 type==='automation'），
   * 此时上游的 checkAutomation() 会自己买，脚本这边就必须让位，否则两边抢同一批节点。
   */

  const AB_STORE_KEY = 'upgtree.autobuy';
  const AB_INTERVAL_MS = 400;      // 扫描节奏：比游戏 tick 慢，但足够跟上手动点击
  const AB_SCAN_MS = 1500;         // 多久重新判定一次「游戏自动化是否生效」

  let autoBuyOn = false;
  let gameAuto = false;            // 游戏内自动化当前是否生效
  let gameAutoByHook = false;      // 由「观察到的免费购买」确认，静态扫描不可推翻
  let abOverride = false;          // 明知游戏已接管仍手动开启
  let lastGameScan = 0;
  let boughtWindow = [];           // 最近一秒的购买次数，用于显示速率
  let abTimer = null;

  try { autoBuyOn = localStorage.getItem(AB_STORE_KEY) === '1'; } catch (e) { /* ignore */ }

  function eachUpgrade(fn) {
    try {
      if (typeof NODE_MAP !== 'undefined' && NODE_MAP && typeof NODE_MAP.forEach === 'function') {
        NODE_MAP.forEach((node) => { if (node && node.type === 'upgrade') fn(node); });
        return;
      }
    } catch (e) { /* 退回到 TREE_NODES */ }
    try {
      if (typeof TREE_NODES !== 'undefined' && TREE_NODES) {
        for (let i = 0; i < TREE_NODES.length; i++) {
          const node = TREE_NODES[i];
          if (node && node.type === 'upgrade') fn(node);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // 游戏内自动化是否已生效：任意已购买的升级带有 automation 效果
  function detectGameAutomation() {
    let active = false;
    eachUpgrade((node) => {
      if (active) return;
      if (!node.effects || !node.effects.length) return;
      let lvl = 0;
      try { lvl = getLevel(node.id); } catch (e) { return; }
      if (!(lvl > 0)) return;
      for (let i = 0; i < node.effects.length; i++) {
        const eff = node.effects[i];
        if (eff && eff.type === 'automation') { active = true; return; }
      }
    });
    return active;
  }

  function refreshGameAuto(force) {
    const now = performance.now();
    if (!force && now - lastGameScan < AB_SCAN_MS) return gameAuto;
    lastGameScan = now;
    const next = detectGameAutomation();
    if (next) markGameAutomation();
    else if (!gameAutoByHook && gameAuto && !autoBuyOn) { gameAuto = false; renderAutoBuy(); }
    return gameAuto;
  }

  // 游戏内自动化已能干活：脚本这边主动让位（用户手动覆盖过则不再抢）
  function markGameAutomation() {
    const was = gameAuto;
    gameAuto = true;
    if (autoBuyOn && !abOverride) {
      autoBuyOn = false;
      try { localStorage.setItem(AB_STORE_KEY, '0'); } catch (e) { /* ignore */ }
      renderAutoBuy();
      setAbStatus('游戏自动化已接管，已自动关闭');
      console.info('[upg-speed] 检测到游戏内自动化，脚本自动购买已关闭');
      return;
    }
    if (!was) renderAutoBuy();
  }

  function autoBuyTick() {
    if (!autoBuyOn) return;
    if (refreshGameAuto(false) && !abOverride) return;

    let state = null;
    try { state = (typeof gameState !== 'undefined') ? gameState : null; } catch (e) { state = null; }
    if (!state || state.paused) return;
    if (typeof buyUpgrade !== 'function' || typeof getCost !== 'function') return;

    const t0 = performance.now();
    let bought = 0;

    eachUpgrade((node) => {
      if (bought >= 40) return;                       // 单次上限，避免一帧买太多卡住
      if (performance.now() - t0 > 8) return;         // 超时就交给下一次
      let unlocked = true;
      try { unlocked = typeof isNodeUnlocked !== 'function' ? true : isNodeUnlocked(node); } catch (e) { unlocked = false; }
      if (!unlocked) return;

      let cost;
      try { cost = getCost(node); } catch (e) { return; }
      if (!isFinite(cost)) return;

      const cur = state.currencies ? (state.currencies[node.costCurrency] || 0) : 0;
      if (cur < cost) return;

      try {
        if (buyUpgrade(node.id, true, false)) bought++;   // true=能买多少买多少，false=照常扣钱
      } catch (e) { /* 单个节点失败不影响其他 */ }
    });

    if (bought > 0) {
      const now = performance.now();
      for (let i = 0; i < bought; i++) boughtWindow.push(now);
      renderAutoBuy();
    }
  }

  function setAutoBuy(on, silent) {
    if (on) {
      refreshGameAuto(false);
      autoBuyOn = true;
      abOverride = gameAuto;       // 游戏已接管还手动开 → 记为「用户覆盖」，之后不再自动关
    } else {
      autoBuyOn = false;
      abOverride = false;
    }
    try { localStorage.setItem(AB_STORE_KEY, autoBuyOn ? '1' : '0'); } catch (e) { /* ignore */ }
    renderAutoBuy();
    if (!silent) {
      if (!autoBuyOn) setAbStatus('未开启');
      else setAbStatus(abOverride ? '游戏自动化也在运行（手动开启）' : '运行中');
    }
  }

  function setAbStatus(text) {
    if (ui && ui.abStat) ui.abStat.textContent = text;
  }

  function renderAutoBuy() {
    if (!ui || !ui.abBtn) return;
    ui.abBtn.textContent = autoBuyOn ? '自动购买：开' : '自动购买：关';
    ui.abBtn.classList.toggle('on', autoBuyOn);
    if (!autoBuyOn) return;
    const now = performance.now();
    boughtWindow = boughtWindow.filter((t) => now - t < 1000);
    const rate = boughtWindow.length ? boughtWindow.length + ' 次/秒' : '运行中';
    setAbStatus(gameAuto ? rate + ' · 游戏自动化也在运行' : rate);
  }

  function startAutoBuy() {
    if (abTimer) return;
    abTimer = setInterval(() => {
      try { autoBuyTick(); } catch (e) { /* ignore */ }
    }, AB_INTERVAL_MS);
    // 速率显示每秒刷新一次（即使没买到东西也要把旧数字清掉）
    setInterval(() => { if (autoBuyOn && !gameAuto) renderAutoBuy(); }, 1000);
  }

  // 兜底信号：上游的 checkAutomation() 是唯一以 isFree=true 调 buyUpgrade 的地方，
  // 只要看到这种调用，就说明游戏内自动化正在干活（比 1.5s 的静态扫描更即时）
  function hookBuyUpgrade() {
    try {
      if (typeof window.buyUpgrade !== 'function' || window.buyUpgrade.__abPatched) return;
      const orig = window.buyUpgrade;
      const wrapped = function (nodeId, isAutomated, isFree) {
        if (isFree === true) {
          gameAutoByHook = true;
          markGameAutomation();
        }
        return orig.apply(this, arguments);
      };
      wrapped.__abPatched = true;
      window.buyUpgrade = wrapped;
    } catch (e) { /* 拿不到就只靠静态扫描 */ }
  }



  /* ---------------- UI（Shadow DOM，避免和游戏的 Tailwind 打架）---------------- */

  let ui = null;

  function buildUI() {
    const host = document.createElement('div');
    host.id = 'upg-speed-root';
    host.style.cssText = 'position:fixed;left:8px;top:26px;z-index:2147483000;';

    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap {
          font: 12px/1.4 -apple-system, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
          color: #e4e4e7; user-select: none;
        }
        .panel {
          background: rgba(24,24,27,.96);
          border: 1px solid #3f3f46;
          box-shadow: 0 10px 30px rgba(0,0,0,.55);
          padding: 6px;
          min-width: 214px;
        }
        .head {
          display: flex; align-items: center; gap: 6px;
          cursor: pointer; padding: 2px 4px 4px;
        }
        .clock { color: #34d399; font-size: 13px; }
        .now { font-weight: 700; color: #34d399; min-width: 42px; }
        .hint { color: #71717a; font-size: 10px; margin-left: auto; }
        .body { display: none; padding-top: 4px; }
        .open .body { display: block; }
        .row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px; }
        button {
          font: inherit; font-size: 11px; color: #d4d4d8; cursor: pointer;
          background: #27272a; border: 1px solid #3f3f46; padding: 3px 7px;
        }
        button:hover { background: #3f3f46; }
        button.on { background: #065f46; border-color: #10b981; color: #d1fae5; }
        .custom { display: flex; gap: 4px; align-items: center; }
        input {
          font: inherit; font-size: 11px; width: 62px; color: #e4e4e7;
          background: #09090b; border: 1px solid #3f3f46; padding: 3px 5px; outline: none;
        }
        input:focus { border-color: #10b981; }
        .foot { color: #71717a; font-size: 10px; margin-top: 5px; display: flex; justify-content: space-between; }
        .abrow { display: flex; align-items: center; gap: 6px; margin: 2px 0 4px; }
        .stat { color: #71717a; font-size: 10px; }
        .stat.warn { color: #fbbf24; }
      </style>
      <div class="wrap">
        <div class="panel">
          <div class="head">
            <span class="clock">⏱</span>
            <span class="now">1×</span>
            <span class="hint">点击展开</span>
          </div>
          <div class="body">
            <div class="row" data-presets></div>
            <div class="custom">
              <span>自定义</span>
              <input type="number" min="0.1" max="1000" step="0.1" data-input>
              <button data-apply>应用</button>
              <button data-toggle title="临时开关：关掉即恢复 1×">暂停</button>
            </div>
            <div class="abrow">
              <button data-autobuy title="自动买下所有已解锁且买得起的升级">自动购买：关</button>
              <span class="stat" data-abstat>未开启</span>
            </div>
            <div class="foot">
              <span data-rate>— 次/秒</span>
              <span>Alt+↑/↓ 调速</span>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(host);

    const panel = root.querySelector('.panel');
    const nowEl = root.querySelector('.now');
    const input = root.querySelector('[data-input]');
    const rateEl = root.querySelector('[data-rate]');
    const toggleBtn = root.querySelector('[data-toggle]');
    const presetBox = root.querySelector('[data-presets]');
    const abBtn = root.querySelector('[data-autobuy]');
    const abStat = root.querySelector('[data-abstat]');

    PRESETS.forEach((v) => {
      const b = document.createElement('button');
      b.textContent = v + '×';
      b.dataset.speed = String(v);
      b.addEventListener('click', (e) => { e.stopPropagation(); setSpeed(v); });
      presetBox.appendChild(b);
    });

    root.querySelector('.head').addEventListener('click', () => {
      panel.classList.toggle('open');
      root.querySelector('.hint').textContent = panel.classList.contains('open') ? '点击收起' : '点击展开';
    });

    root.querySelector('[data-apply]').addEventListener('click', () => {
      const v = parseFloat(input.value);
      if (isFinite(v)) setSpeed(v);
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();                       // 别让游戏的热键抢走输入
      if (e.key === 'Enter') {
        const v = parseFloat(input.value);
        if (isFinite(v)) setSpeed(v);
      }
    });
    input.addEventListener('click', (e) => e.stopPropagation());

    toggleBtn.addEventListener('click', () => {
      enabled = !enabled;
      toggleBtn.textContent = enabled ? '暂停' : '恢复';
      toggleBtn.classList.toggle('on', !enabled);
    });

    ui = { host, root, panel, nowEl, input, rateEl, toggleBtn, presetBox, abBtn, abStat };
    render();

    abBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setAutoBuy(!autoBuyOn);
    });

    // 首次渲染：存档里是「开」的话，先看游戏内自动化是否已经接管
    refreshGameAuto(true);
    if (autoBuyOn && gameAuto) {
      autoBuyOn = false;
      try { localStorage.setItem(AB_STORE_KEY, '0'); } catch (e) { /* ignore */ }
    }
    renderAutoBuy();
    if (!autoBuyOn) setAbStatus(gameAuto ? '游戏自动化已接管，无需脚本自动购买' : '未开启');

    // 每秒刷一次"实际 tick 频率"，让玩家看到倍速真的生效了
    setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTickSample) / 1000;
      if (dt > 0) tickRate = tickCount / dt;
      tickCount = 0;
      lastTickSample = now;
      if (!ui) return;
      // 主循环按 100ms 一步，所以 1× ≈ 10 次/秒。达不到就说明撞上了性能保护
      const expected = enabled ? speed * 10 : 0;
      const capped = enabled && expected > 12 && tickRate < expected * 0.85;
      ui.rateEl.textContent = tickRate.toFixed(0) + ' 次/秒' + (capped ? ' · 已达性能上限' : '');
    }, 1000);

    // Alt+↑ / Alt+↓ 快速调速
    window.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
    }, true);
  }

  function step(dir) {
    const ladder = PRESETS.concat([200, 500, 1000]);
    let i = ladder.findIndex((v) => v >= speed - 1e-9);
    if (i < 0) i = ladder.length - 1;
    i = Math.min(ladder.length - 1, Math.max(0, i + dir));
    setSpeed(ladder[i]);
  }

  function setSpeed(v) {
    speed = clampSpeed(v);
    enabled = true;
    saveSpeed();
    if (ui) ui.toggleBtn.textContent = '暂停';
    if (ui) ui.toggleBtn.classList.remove('on');
    render();
  }

  function render() {
    if (!ui) return;
    ui.nowEl.textContent = (speed % 1 === 0 ? speed : parseFloat(speed.toFixed(2))) + '×';
    ui.input.value = String(speed);
    ui.root.querySelectorAll('[data-speed]').forEach((b) => {
      b.classList.toggle('on', Number(b.dataset.speed) === speed);
    });
  }

  /* ---------------- 启动 ---------------- */

  function boot() {
    if (install()) {
      hookBuyUpgrade();
      buildUI();
      startAutoBuy();
      return;
    }
    // 游戏脚本还没跑完，稍后再试（最多约 20 秒）
    let tries = 0;
    const timer = setInterval(() => {
      if (install()) {
        clearInterval(timer);
        hookBuyUpgrade();
        buildUI();
        startAutoBuy();
      } else if (++tries > 80) {
        clearInterval(timer);
        console.warn('[upg-speed] 没找到 tickGame，可能不是 upgtree 页面，已停止');
      }
    }, 250);
  }

  // 暴露给控制台，方便调试
  window.__UPG_SPEED = {
    get: () => speed,
    set: setSpeed,
    on: () => { enabled = true; },
    off: () => { enabled = false; },
    rate: () => tickRate,
    patched: () => !!(window.tickGame && window.tickGame.__speedPatched),
    autoBuy: (v) => { if (v === undefined) return autoBuyOn; setAutoBuy(!!v); return autoBuyOn; },
    gameAuto: (refresh) => { if (refresh) refreshGameAuto(true); return gameAuto; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
