/*!
 * upgtree i18n 运行时（本地汉化层）
 * ---------------------------------------------------------------
 * 设计目标：index.html 保持上游原样，一行都不改，因此 git pull 不会冲突。
 * 本文件由 tools/build-zh.mjs 注入到生成的 zh.html 末尾，做三件事：
 *   1) 翻译 DOM 文本节点与 title/placeholder 等属性（MutationObserver 持续跟踪）
 *   2) 就地翻译 TREE_NODES 等数据里的 name / desc / code（必须在 canvas 换行前翻译，
 *      否则文本已被按英文宽度切成多行，逐行替换会失效）
 *   3) 兜底翻译 canvas fillText 的零散长字符串（DONE / ENTER / RESET 这类不换行标签）
 * 词典：i18n/zh-CN.js，键 = 英文原文。上游改文案后键不再命中 → 自动回落英文，
 *      不会报错、不会冲突，只需补词条。
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'upgtree.lang';
  var DEFAULT_LANG = 'zh-CN';
  var DICTS = window.__I18N_DICTS__ || {};
  var LANG = resolveLang();
  var DICT = (DICTS[LANG] || {});
  var ENABLED = LANG !== 'en';

  /* ---------------- 语言解析 / 切换 ---------------- */

  function resolveLang() {
    var hash = String(location.hash || '');
    var m = hash.match(/lang=([\w-]+)/);
    if (m) return m[1];
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) return s;
    } catch (e) { /* file:// 下可能被禁 */ }
    return DEFAULT_LANG;
  }

  function setLang(l) {
    try { localStorage.setItem(STORAGE_KEY, l); } catch (e) { /* ignore */ }
    try {
      location.hash = 'lang=' + l;
      location.reload();
    } catch (e) {
      location.href = location.pathname + '#lang=' + l;
    }
  }

  /* ---------------- 翻译核心 ---------------- */

  var NUM_RE = /-?\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  // 货币 id（小写）→ 中文名，用于把画布上的 "0.01 tokens" 这类成本标签翻掉
  var CURRENCY_CN = Object.create(null);
  // 数值可能带数量级后缀（1.16K / 3.4M），只吃掉后缀、不动后面的单位
  var NUM_SUFFIX_RE = /-?\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[KMBTQ]|Qa|Qi|Sx|Sp|Oc|No|Dc)?(?![A-Za-z])/g;
  var RULES = window.__I18N_RULES__ || [];
  var cache = Object.create(null);

  // 把 s 里的数字（或数字+后缀）替换成 #，命中词条后按顺序填回去
  function tryNormalized(s, re) {
    var nums = [];
    var norm = s.replace(re, function (m) { nums.push(m); return '#'; });
    if (norm === s) return null;
    var v = DICT[norm];
    if (v === undefined) return null;
    var i = 0;
    return v.replace(/#/g, function () { return i < nums.length ? nums[i++] : '#'; });
  }

  function lookup(s) {
    var v = DICT[s];
    if (v !== undefined) return v;

    // 两次归一化：先纯数字，再数字+数量级后缀
    v = tryNormalized(s, NUM_RE);
    if (v !== null) return v;
    v = tryNormalized(s, NUM_SUFFIX_RE);
    if (v !== null) return v;

    // 正则规则：处理拼接型文案（如 "EXECUTE #10"、"你离线了 X 秒"）
    for (var r = 0; r < RULES.length; r++) {
      var rule = RULES[r];
      if (!rule[0].test(s)) continue;
      if (typeof rule[1] === 'function') {
        var m = s.match(rule[0]);
        if (m) {
          var out = rule[1](m);
          // 函数规则返回 null 表示「本规则不适用」，继续尝试后面的规则
          if (out !== null) return out;
        }
        continue;
      }
      return s.replace(rule[0], rule[1]);
    }
    return null;
  }

  function translate(raw) {
    if (raw == null || raw === '') return raw;
    if (typeof raw !== 'string') raw = String(raw);
    if (cache[raw] !== undefined) return cache[raw];

    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return raw;
    var body = m[2].replace(/\s+/g, ' ');
    if (!body) return raw;

    var out = lookup(body);
    if (out === null) {
      // 成本标签："0.01 tokens" —— 上游画布上直接拼的货币 id（costCurrency），不是显示名。
      // 只处理多字母 id：P / R / ¤ / α / IP 这些本身就是符号或缩写，翻了反而让标签变长挤出去
      var cm = /^([-+]?[\d.,]+[A-Za-z]{0,3}(?:[eE][+-]?\d+)?)\s+([A-Za-z]{3,})$/.exec(body);
      if (cm) {
        var cn = CURRENCY_CN[cm[2].toLowerCase()];
        if (cn) {
          var r2 = m[1] + cm[1] + ' ' + cn + m[3];
          cache[raw] = r2;
          return r2;
        }
      }
      cache[raw] = raw;
      return raw;
    }

    // 译文以全角标点收尾时，丢掉原文的尾随空格：避免出现「欢迎回来， 名字」这种全角后多一格的排版
    var tail = m[3];
    if (tail && /[，。、！？；：）」』】》]$/.test(out)) tail = '';

    var res = m[1] + out + tail;
    cache[raw] = res;
    return res;
  }

  /* ---------------- DOM 翻译 ---------------- */

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'data-tooltip'];

  // 玩家昵称属于用户数据，绝不参与翻译（否则取名撞上词条就会被改写）
  // #player-name-display → 右上角 HUD；#settings-player-name → 设置面板；#offline-title span → 欢迎回来弹窗
  var NAME_SELECTORS = '#player-name-display, #settings-player-name, #offline-title span';

  function inName(el) {
    try { return !!(el && el.closest && el.closest(NAME_SELECTORS)); } catch (e) { return false; }
  }

  function trTextNode(node) {
    var raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    var out = translate(raw);
    if (out !== raw) node.nodeValue = out;
  }

  function trAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var raw = el.getAttribute(a);
      var out = translate(raw);
      if (out !== raw) el.setAttribute(a, out);
    }
  }

  function walk(root) {
    if (!root) return;
    var t = root.nodeType;
    if (t === 3) {
      if (!inName(root.parentElement)) trTextNode(root);
      return;
    }
    if (t !== 1 && t !== 9 && t !== 11) return;
    if (t === 1) {
      if (SKIP_TAGS[root.tagName]) return;
      if (root.hasAttribute && root.hasAttribute('data-i18n-skip')) return;
      if (inName(root)) return;
      trAttrs(root);
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1 && (SKIP_TAGS[n.tagName] || (n.hasAttribute && n.hasAttribute('data-i18n-skip')) || inName(n))) {
          return NodeFilter.FILTER_REJECT;
        }
        if (n.nodeType === 3 && inName(n.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) trTextNode(n);
      else trAttrs(n);
    }
  }

  var pending = new Set();
  var scheduled = false;

  function flush() {
    scheduled = false;
    var items = Array.from(pending);
    pending.clear();
    for (var i = 0; i < items.length; i++) walk(items[i]);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
    else setTimeout(flush, 16);
  }

  /* ---------------- 同步文本钩子 ---------------- */
  // 上游用 textContent 高频刷新货币栏（每 120ms）。只靠 MutationObserver 的话，
  // 数值一变就会先渲染一帧英文、下一帧才被改成中文 —— 肉眼可见的闪烁。
  // 这里直接包 setter，在赋值那一刻就地翻译，彻底消掉中间态。
  function canTranslateNode(el) {
    if (!el || !el.nodeType) return false;
    if (el.nodeType === 3) return !inName(el.parentElement);
    if (el.nodeType !== 1) return true;
    if (SKIP_TAGS[el.tagName]) return false;
    if (el.hasAttribute && (el.hasAttribute('data-i18n-skip') || el.id === 'i18n-font-btn')) return false;
    return !inName(el);
  }

  function hookSetter(target, prop, transform) {
    try {
      var d = Object.getOwnPropertyDescriptor(target, prop);
      if (!d || !d.set || d.set.__i18n) return;
      var set = d.set;
      var wrapped = function (v) {
        if (typeof v === 'string' && v) {
          try {
            if (canTranslateNode(this)) v = transform ? transform(v) : translate(v);
          } catch (e) { }
        }
        return set.call(this, v);
      };
      wrapped.__i18n = true;
      Object.defineProperty(target, prop, { get: d.get, set: wrapped, configurable: true, enumerable: d.enumerable });
    } catch (e) { /* 某些环境下属性不可改，退回 MutationObserver */ }
  }

  function installTextHook() {
    if (!ENABLED) return;
    if (typeof Node !== 'undefined') hookSetter(Node.prototype, 'textContent');
    if (typeof HTMLElement !== 'undefined') hookSetter(HTMLElement.prototype, 'innerText');
    if (typeof Element !== 'undefined') hookSetter(Element.prototype, 'innerHTML', htmlFix);
  }

  // innerHTML 是整段 HTML，不能直接走词典（文本被标签切开），
  // 只对少数「数字与英文混排在同一个 HTML 串里」的计数器做定点替换
  var HTML_FIX = [
    [/(\d+(?:\.\d+)?[A-Za-z]?) messages available\s*/g, '$1 条消息可用'],
    [/\((\d+) new, (\d+) in cooldown\)/g, '（$1 条新，$2 条冷却中）']
  ];

  function htmlFix(s) {
    var out = s;
    for (var i = 0; i < HTML_FIX.length; i++) out = out.replace(HTML_FIX[i][0], HTML_FIX[i][1]);
    return out;
  }

  function observe() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    var obs = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'characterData') pending.add(r.target);
        else if (r.type === 'attributes') pending.add(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) {
          var n = r.addedNodes[j];
          if (n.nodeType === 1 || n.nodeType === 3) pending.add(n);
        }
      }
      if (pending.size) schedule();
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  /* ---------------- 数据层翻译（canvas 文本的必经之路）---------------- */

  var FIELDS = ['name', 'desc', 'code', 'text'];
  // 上游会把效果条目的 desc 显示在节点详情里（`${eff.desc} (x${val})`），
  // 这些 desc 嵌在数组里，不在节点自身的字段上，得单独翻
  var EFFECT_ARRAYS = ['effects', 'challengeEffects', 'rewards'];

  function patchEffects(item) {
    var changed = 0;
    for (var a = 0; a < EFFECT_ARRAYS.length; a++) {
      var arr = item[EFFECT_ARRAYS[a]];
      if (!arr || typeof arr.length !== 'number') continue;
      for (var i = 0; i < arr.length; i++) {
        var eff = arr[i];
        if (!eff || typeof eff !== 'object') continue;
        if (typeof eff.desc === 'string') {
          var out = translate(eff.desc);
          if (out !== eff.desc) { eff.desc = out; changed++; }
        }
      }
    }
    return changed;
  }

  function patchList(list) {
    if (!list || typeof list.length !== 'number') return 0;
    var changed = 0;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item || typeof item !== 'object') continue;
      for (var k = 0; k < FIELDS.length; k++) {
        var f = FIELDS[k];
        if (typeof item[f] === 'string') {
          var out = translate(item[f]);
          if (out !== item[f]) { item[f] = out; changed++; }
        }
      }
      try { changed += patchEffects(item); } catch (e) { }
      wrapFn(item, 'getInfoText');
      wrapFn(item, 'desc');
    }
    return changed;
  }

  // 少数文案是函数（如 info 节点的 "Rate: +5/s"），在返回处再翻一次
  function wrapFn(item, key) {
    if (typeof item[key] !== 'function' || item[key].__i18n) return;
    var orig = item[key];
    var wrapped = function () {
      return translate(String(orig.apply(this, arguments)));
    };
    wrapped.__i18n = true;
    item[key] = wrapped;
  }

  function patchData() {
    var n = 0;
    try { if (typeof TREE_NODES !== 'undefined') n += patchList(TREE_NODES); } catch (e) { }
    try { if (typeof CHALLENGE_NODES !== 'undefined') n += patchList(CHALLENGE_NODES); } catch (e) { }
    try { if (typeof DECORATIONS !== 'undefined') n += patchList(DECORATIONS); } catch (e) { }
    try { if (typeof NOTATION_MODES !== 'undefined') n += patchList(NOTATION_MODES); } catch (e) { }
    try {
      if (typeof CURRENCIES !== 'undefined' && CURRENCIES) {
        for (var k in CURRENCIES) {
          if (!Object.prototype.hasOwnProperty.call(CURRENCIES, k)) continue;
          var c = CURRENCIES[k];
          if (c && typeof c.name === 'string') {
            var out = translate(c.name);
            if (out !== c.name) { c.name = out; n++; }
            if (c.name) CURRENCY_CN[String(k).toLowerCase()] = c.name;
          }
        }
        // 规则表里需要判断「某个词是不是货币 id」，把表暴露出去
        window.__I18N_CURRENCY__ = CURRENCY_CN;
      }
    } catch (e) { }
    // 新闻栏：消息先经 parseNewsMarkup 变成 HTML（[color]/**bold**），
    // 渲染后会被标签拆成多个文本节点，DOM 层无法整体匹配 → 必须在数据层翻
    try {
      if (typeof NEWS_GROUPS !== 'undefined' && NEWS_GROUPS) {
        for (var g in NEWS_GROUPS) {
          if (!Object.prototype.hasOwnProperty.call(NEWS_GROUPS, g)) continue;
          var grp = NEWS_GROUPS[g];
          if (!grp || !grp.messages || typeof grp.messages.length !== 'number') continue;
          for (var mi = 0; mi < grp.messages.length; mi++) {
            if (typeof grp.messages[mi] !== 'string') continue;
            var mo = translate(grp.messages[mi]);
            if (mo !== grp.messages[mi]) { grp.messages[mi] = mo; n++; }
          }
        }
      }
    } catch (e) { }
    return n;
  }

  /* ---------------- canvas 兜底 ---------------- */

  function hookCanvas() {
    var protos = [];
    if (typeof CanvasRenderingContext2D !== 'undefined') protos.push(CanvasRenderingContext2D.prototype);
    if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') protos.push(OffscreenCanvasRenderingContext2D.prototype);

    protos.forEach(function (proto) {
      ['fillText', 'strokeText'].forEach(function (fn) {
        var orig = proto[fn];
        if (!orig || orig.__i18n) return;
        var wrapped = function (text) {
          if (typeof text === 'string' && text) {
            var out = translate(text);
            if (out !== text) arguments[0] = out;
          }
          return orig.apply(this, arguments);
        };
        wrapped.__i18n = true;
        proto[fn] = wrapped;
      });
    });
  }

  /* ---------------- 字体切换 ---------------- */
  // DOM 文字靠注入 CSS 改；canvas 节点文字靠包装 ctx.font 的 setter 改（CSS 管不到 canvas）。
  // 默认用黑体：Fira Code 没有中文字形，回落到系统字体时中英混排很难看。
  var FONT_KEY = 'upgtree.font';
  var CUSTOM_FAMILY = 'UPGTreeCustom';
  var FONT_DB = 'upgtree-font';
  var FONT_STORE = 'files';
  var CUSTOM_ID = 'custom';

  var FONTS = {
    mono: { short: '等', name: '等宽（原版）', stack: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
    sans: { short: '黑', name: '黑体', stack: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", system-ui, -apple-system, "Segoe UI", sans-serif' },
    serif: { short: '宋', name: '宋体', stack: '"Songti SC", SimSun, "Noto Serif SC", "Source Han Serif SC", STSong, serif' }
    // custom 在字体加载成功后动态加入
  };
  var fontMode = resolveFont();

  function fontDef(key) {
    return FONTS[key] || FONTS.sans;
  }

  function fontOrder() {
    var o = ['sans', 'mono', 'serif'];
    if (FONTS.custom) o.push('custom');
    return o;
  }

  function resolveFont() {
    try {
      var h = String(location.hash || '').match(/font=(mono|sans|serif|custom)/);
      if (h) return h[1];
      var s = localStorage.getItem(FONT_KEY);
      if (s && (s === 'custom' || FONTS[s])) return s;
    } catch (e) { /* ignore */ }
    return 'sans';
  }

  function applyFontStyle() {
    var st = document.getElementById('i18n-font-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'i18n-font-style';
      (document.head || document.documentElement).appendChild(st);
    }
    // mono 模式留空，回到上游原本的 font-mono 表现
    st.textContent = fontMode === 'mono'
      ? ''
      : 'html, body, body *:not(svg):not(svg *) { font-family: ' + fontDef(fontMode).stack + ' !important; }';
  }

  // 把 '8px "Fira Code", monospace' 里的字体族换掉，字号/字重原样保留
  function remapFont(v) {
    if (fontMode === 'mono') return v;
    var m = /^((?:[a-z-]+\s+)*[\d.]+px(?:\s*\/\s*[\d.]+px)?)\s+/i.exec(v);
    return m ? m[1] + ' ' + fontDef(fontMode).stack : v;
  }

  function installCanvasFontHook() {
    try {
      var proto = CanvasRenderingContext2D.prototype;
      var d = Object.getOwnPropertyDescriptor(proto, 'font');
      if (!d || !d.set || d.set.__i18n) return;
      var setter = d.set;
      var wrapped = function (v) {
        var out = v;
        try { out = remapFont(String(v)); } catch (e) { }
        return setter.call(this, out);
      };
      wrapped.__i18n = true;
      Object.defineProperty(proto, 'font', { get: d.get, set: wrapped, configurable: true, enumerable: d.enumerable });
    } catch (e) { /* 拿不到访问器就只改 DOM 字体 */ }
  }

  function updateFontButton() {
    var btn = document.getElementById('i18n-font-btn');
    if (!btn) return;
    var f = fontDef(fontMode);
    btn.textContent = f.short;
    btn.title = '字体：' + f.name + '\n点击选择字体 · Shift+点击 直接上传自定义字体';
  }

  /* ---- 字体选择菜单（点击按钮弹出，避免玩家不知道能自定义）---- */

  var fontMenuEl = null;

  function closeFontMenu() {
    if (fontMenuEl && fontMenuEl.parentNode) fontMenuEl.parentNode.removeChild(fontMenuEl);
    fontMenuEl = null;
    document.removeEventListener('mousedown', onDocMouseDown, true);
  }

  function onDocMouseDown(e) {
    if (!fontMenuEl) return;
    if (fontMenuEl.contains(e.target)) return;
    if (e.target && e.target.id === 'i18n-font-btn') return;
    closeFontMenu();
  }

  function toggleFontMenu() {
    if (fontMenuEl) { closeFontMenu(); return; }
    var hint = document.getElementById('i18n-font-hint');
    if (hint && hint.parentNode) hint.parentNode.removeChild(hint);   // 提示和菜单位置重叠，开了菜单就收起来
    var btn = document.getElementById('i18n-font-btn');
    if (!btn) return;
    var r = btn.getBoundingClientRect();

    var m = document.createElement('div');
    m.id = 'i18n-font-menu';
    m.setAttribute('data-i18n-skip', '');
    m.className = 'bg-zinc-900 border border-zinc-700 shadow-2xl text-[11px] text-zinc-200';
    m.style.cssText = 'position:fixed;z-index:9999;left:' + Math.round(r.left) + 'px;'
      + 'bottom:' + Math.round(window.innerHeight - r.top + 6) + 'px;min-width:200px;padding:4px;';

    var items = [['sans', '黑体'], ['mono', '等宽（原版）'], ['serif', '宋体']];
    if (FONTS.custom) items.push(['custom', FONTS.custom.name]);

    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'block w-full text-left px-2 py-1.5 hover:bg-zinc-800 flex items-center justify-between gap-2';
      b.innerHTML = '<span>' + it[1] + '</span><span class="text-emerald-400">' + (fontMode === it[0] ? '✓' : '') + '</span>';
      b.addEventListener('click', function () { setFont(it[0]); closeFontMenu(); });
      m.appendChild(b);
    });

    var sep = document.createElement('div');
    sep.className = 'border-t border-zinc-700 my-1';
    m.appendChild(sep);

    var up = document.createElement('button');
    up.type = 'button';
    up.className = 'block w-full text-left px-2 py-1.5 hover:bg-zinc-800 text-cyan-400 flex items-center gap-1.5';
    up.innerHTML = '<span class="font-bold">＋</span><span>上传自定义字体…</span>';
    up.addEventListener('click', function () { closeFontMenu(); pickCustomFont(); });
    m.appendChild(up);

    document.body.appendChild(m);
    fontMenuEl = m;
    setTimeout(function () { document.addEventListener('mousedown', onDocMouseDown, true); }, 0);
  }

  // 首次进入给一次提示，否则玩家根本不知道字体按钮能点
  function maybeShowFontHint(attempt) {
    attempt = attempt || 0;
    // 起名/离线弹窗打开时先别弹，否则会盖在遮罩上很难看
    var blocked = ['name-modal', 'offline-modal'].some(function (id) {
      var el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    });
    if (blocked) {
      if (attempt < 40) setTimeout(function () { maybeShowFontHint(attempt + 1); }, 1500);
      return;
    }

    var HINT_KEY = 'upgtree.fontHint';
    try {
      if (localStorage.getItem(HINT_KEY)) return;
      localStorage.setItem(HINT_KEY, '1');
    } catch (e) { /* 存不了就每次提示一次，不影响功能 */ }

    var btn = document.getElementById('i18n-font-btn');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var h = document.createElement('div');
    h.id = 'i18n-font-hint';
    h.setAttribute('data-i18n-skip', '');
    h.textContent = '点这里换字体，也能上传你自己的字体';
    h.style.cssText = 'position:fixed;z-index:9998;left:' + Math.round(r.left) + 'px;'
      + 'bottom:' + Math.round(window.innerHeight - r.top + 8) + 'px;max-width:210px;'
      + 'background:#27272a;border:1px solid #52525b;color:#e4e4e7;font-size:11px;'
      + 'padding:6px 9px;line-height:1.5;box-shadow:0 6px 18px rgba(0,0,0,.5);cursor:pointer;';
    h.addEventListener('click', function () {
      if (h.parentNode) h.parentNode.removeChild(h);
      toggleFontMenu();
    });
    document.body.appendChild(h);
    setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 8000);
  }

  function setFont(key) {
    if (key !== 'mono' && key !== 'sans' && key !== 'serif' && key !== 'custom') return;
    if (key === 'custom' && !FONTS.custom) { pickCustomFont(); return; }
    fontMode = key;
    try { localStorage.setItem(FONT_KEY, key); } catch (e) { }
    applyFontStyle();
    updateFontButton();
    requestAnimatedRedraw();   // canvas 已画的字要重画才会换字体
  }

  function cycleFont() {
    var o = fontOrder();
    var i = o.indexOf(fontMode);
    setFont(o[(i + 1) % o.length]);
  }

  /* ---- 自定义字体：文件 → FontFace → IndexedDB 持久化 ---- */

  var _dbPromise = null;
  function openFontDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB 不可用'));
      var req = indexedDB.open(FONT_DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(FONT_STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('打开字体库失败')); };
    });
    return _dbPromise;
  }

  function dbPut(key, val) {
    return openFontDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(FONT_STORE, 'readwrite');
        tx.objectStore(FONT_STORE).put(val, key);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error); };
      });
    });
  }

  function dbGet(key) {
    return openFontDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(FONT_STORE, 'readonly');
        var g = tx.objectStore(FONT_STORE).get(key);
        g.onsuccess = function () { res(g.result); };
        g.onerror = function () { rej(g.error); };
      });
    });
  }

  function registerCustomFont(buf, name) {
    return new FontFace(CUSTOM_FAMILY, buf).load().then(function (face) {
      document.fonts.add(face);
      FONTS.custom = {
        short: '自',
        name: '自定义 · ' + (name || '字体'),
        stack: '"' + CUSTOM_FAMILY + '", ' + FONTS.sans.stack
      };
      return true;
    });
  }

  function pickCustomFont() {
    var inp = document.getElementById('i18n-font-file');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file';
      inp.id = 'i18n-font-file';
      inp.accept = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';
      inp.style.display = 'none';
      inp.setAttribute('data-i18n-skip', '');
      inp.addEventListener('change', function () {
        var file = inp.files && inp.files[0];
        inp.value = '';
        if (!file) return;
        if (file.size > 40 * 1024 * 1024) { toast('字体超过 40MB，换个小一点的吧'); return; }
        toast('正在加载：' + file.name);
        file.arrayBuffer().then(function (buf) {
          return registerCustomFont(buf, file.name).then(function () {
            return dbPut(CUSTOM_ID, { name: file.name, data: buf }).catch(function (e) {
              console.warn('[i18n] 字体保存失败，本次有效、刷新后需重新上传', e);
            });
          });
        }).then(function () {
          setFont('custom');
          toast('已应用：' + file.name);
        }).catch(function (e) {
          console.warn('[i18n] 字体加载失败', e);
          toast('字体加载失败，格式可能不被支持');
        });
      });
      document.body.appendChild(inp);
    }
    inp.click();
  }

  function restoreCustomFont() {
    return dbGet(CUSTOM_ID).then(function (rec) {
      if (!rec || !rec.data) return;
      return registerCustomFont(rec.data, rec.name).then(function () {
        updateFontButton();
        if (fontMode === 'custom') { applyFontStyle(); requestAnimatedRedraw(); }
      });
    }).catch(function (e) {
      console.warn('[i18n] 自定义字体恢复失败', e);
    });
  }

  // 轻量提示条（不依赖上游的 showToast）
  function toast(msg) {
    var d = document.createElement('div');
    d.setAttribute('data-i18n-skip', '');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9999;'
      + 'background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;padding:7px 14px;font-size:12px;'
      + 'border-radius:2px;box-shadow:0 8px 24px rgba(0,0,0,.5);transition:opacity .35s;opacity:1;';
    document.body.appendChild(d);
    setTimeout(function () { d.style.opacity = '0'; }, 1900);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2400);
  }

  function hudHost() {
    return document.querySelector('#currency-bar-container div.pointer-events-auto')
      || document.querySelector('#currency-bar-container');
  }

  function injectFontButton() {
    if (document.getElementById('i18n-font-btn')) return;
    var host = hudHost();
    if (!host) return;
    var b = document.createElement('button');
    b.id = 'i18n-font-btn';
    b.className = 'p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shadow-md transition flex items-center gap-1.5 text-[11px]';
    b.setAttribute('data-i18n-skip', '');
    b.addEventListener('click', function (e) {
      if (e.shiftKey) { closeFontMenu(); pickCustomFont(); }
      else toggleFontMenu();
    });
    host.appendChild(b);
    updateFontButton();
    setTimeout(maybeShowFontHint, 1200);   // 等布局稳定再定位提示
  }

  /* ---------------- 语言切换按钮 ---------------- */

  function injectToggle() {
    if (document.getElementById('i18n-lang-btn')) return;
    var host = document.querySelector('#currency-bar-container div.pointer-events-auto')
      || document.querySelector('#currency-bar-container');
    if (!host) return;
    var b = document.createElement('button');
    b.id = 'i18n-lang-btn';
    b.className = 'p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shadow-md transition flex items-center gap-1.5 text-[11px]';
    b.title = LANG === 'en' ? '切换到中文 / Switch to Chinese' : '切换到英文 / Switch to English';
    b.setAttribute('data-i18n-skip', '');
    b.innerHTML = '<span class="text-zinc-400 font-mono text-[10px]">' + (LANG === 'en' ? 'EN' : '中') + '</span>';
    b.addEventListener('click', function () { setLang(LANG === 'en' ? 'zh-CN' : 'en'); });
    host.appendChild(b);
  }

  /* ---------------- 启动 ---------------- */

  function requestRedraw() {
    try {
      // needsNodeUpdate 是上游的脏标记；能写就写，写完再手动 draw 一次
      try { if (typeof needsNodeUpdate !== 'undefined') needsNodeUpdate = true; } catch (e) { }
      if (typeof draw === 'function') draw();
      else if (typeof render === 'function') render();
      window.dispatchEvent(new Event('resize'));
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 外部 CDN 兜底 ---------------- */
  // 上游在 window.onload 里直接调 lucide.createIcons()，图标 CDN 超时就整个初始化中止。
  // 这里补一个空实现：图标不显示，但游戏能正常跑起来。
  function ensureLucide() {
    try {
      if (typeof window.lucide === 'undefined') {
        window.lucide = { createIcons: function () { }, icons: {} };
        console.warn('[i18n] 图标库 lucide 未加载（多半是 CDN 超时），已启用空实现：图标缺失，功能正常');
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 中文换行修正 ---------------- */
  // 上游 wrapTextCached 用 text.split(/\s+/) 断词，中文没有空格 → 整句不换行、冲出节点框。
  // 这里只接管"含中日韩字符"的文本，纯英文一律交回原函数，保证上游行为零改动。
  var CJK_RE = /[\u1100-\u11ff\u2e80-\u303f\u3040-\u9fff\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
  var HAS_CJK_RE = /[\u2e80-\u9fff\uff00-\uffef]/;

  /* ---------------- 节点下方的效果摘要 ---------------- */
  // getNodeEffectSummary() 把各效果拼成 "Time: Day, +1, +0" 这样的串，之后才交给
  // wrapTextCached 断行。一旦断成多行，每行都是碎片，词典再也匹配不上（画出来就是半中半英）。
  // 所以必须在「拼好、还没断行」时翻。
  function hookEffectSummary() {
    var names = ['getNodeEffectSummary', 'getChallengeEffectSummary'];
    for (var i = 0; i < names.length; i++) {
      (function (name) {
        var orig = window[name];
        if (typeof orig !== 'function' || orig.__i18nSummary) return;
        var wrapped = function () {
          var s = orig.apply(this, arguments);
          if (typeof s !== 'string' || !s) return s;
          try { return translateSummary(s); } catch (e) { return s; }
        };
        wrapped.__i18nSummary = true;
        window[name] = wrapped;
      })(names[i]);
    }
  }

  /* ---------------- 数值达上限（Infinity）的 MAX ---------------- */
  // formatNum/formatLevel 在 num === Infinity（数值溢出到 1e308 上限）时返回 'MAX'。
  // 这个 MAX 是「数值已达最大值」，和节点成本标签 isMax ? 'MAX'（买满等级）是两个含义，
  // 但上游用同一个字符串。这里包装这两个格式化函数，把 Infinity 的 'MAX' 直接换成中文，
  // 让货币栏显示「研片 已达上限」，而 canvas 成本标签仍走词典 "MAX"→「满级」。
  function hookFormatNum() {
    var names = ['formatNum', 'formatLevel'];
    for (var i = 0; i < names.length; i++) {
      (function (name) {
        var orig = window[name];
        if (typeof orig !== 'function' || orig.__i18nFmt) return;
        var wrapped = function (num) {
          var r = orig.apply(this, arguments);
          if (r === 'MAX') return '已达上限';
          return r;
        };
        wrapped.__i18nFmt = true;
        window[name] = wrapped;
      })(names[i]);
    }
  }

  // 货币栏为了省宽度用单字名（青 / 灰 / 橙），但写进效果摘要里「奖励：青 x1」读着别扭，
  // 颜色类补一个「色」。其余单字（铜 / 银 / 水）单独用没问题，保持原样。
  var COLOR_IDS = {
    cyan: 1, gray: 1, grey: 1, orange: 1, green: 1, purple: 1,
    white: 1, black: 1, red: 1, yellow: 1, blue: 1, pink: 1, brown: 1
  };
  // 货币 id（"x1 cyan" 里的 cyan）→ 中文名。只在效果摘要这种短串上做
  function remapCurrencyWords(s) {
    if (!s) return s;
    // 边界只要求「前后不是字母数字」，这样 "奖励：cyan x1" 这种全角标点也能命中；
    // 允许首字母大写（上游 targetCurrency 写作 "Cookie"），查表时统一转小写
    return s.replace(/(^|[^A-Za-z0-9_])([A-Za-z][A-Za-z0-9_]{2,})(?=[^A-Za-z0-9_]|$)/g, function (all, pre, id) {
      var cn = CURRENCY_CN[id.toLowerCase()];
      if (!cn) return all;
      if (COLOR_IDS[id.toLowerCase()] && cn.length === 1) cn += '色';
      return pre + cn;
    });
  }

  // 摘要由多段 ", " 拼成，整体翻不动就逐段翻（挑战摘要里每段都带货币 id）
  function translateSummary(s) {
    var whole = translate(s);
    if (whole !== s) return remapCurrencyWords(whole);

    var parts = s.split(', ');
    if (parts.length === 1) return remapCurrencyWords(translate(s));

    var changed = false;
    var out = parts.map(function (p) {
      var t = translate(p);
      if (t !== p) changed = true;
      return t;
    });
    if (!changed) return s;
    return remapCurrencyWords(out.join('，'));
  }

  function installWrapFix() {
    var orig = window.wrapTextCached;
    if (typeof orig !== 'function' || orig.__i18nCJK) return;

    var cache = new Map();
    var LIMIT = 500;

    var fixed = function (text, maxWidth, fontSize) {
      if (!text) return [];
      if (!HAS_CJK_RE.test(text)) return orig.call(this, text, maxWidth, fontSize);

      var key = text + '|' + maxWidth + '|' + fontSize;
      var hit = cache.get(key);
      if (hit) return hit;

      // 切成"拉丁词 / 单个汉字 / 空格"三种 token，再按估算宽度贪心排布
      var tokens = [];
      var buf = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (CJK_RE.test(ch)) {
          if (buf) { tokens.push(buf); buf = ''; }
          tokens.push(ch);
        } else if (/\s/.test(ch)) {
          if (buf) { tokens.push(buf); buf = ''; }
          tokens.push(' ');
        } else {
          buf += ch;
        }
      }
      if (buf) tokens.push(buf);

      var charW = fontSize * 0.6;
      var lines = [];
      var cur = '';
      var curW = 0;
      for (var t = 0; t < tokens.length; t++) {
        var tk = tokens[t];
        if (tk === ' ') {
          if (cur) cur += ' ';
          continue;
        }
        var w = CJK_RE.test(tk) ? fontSize : tk.length * charW;
        if (cur && curW + w > maxWidth) {
          lines.push(cur.replace(/\s+$/, ''));
          cur = tk;
          curW = w;
        } else {
          cur += tk;
          curW += w;
        }
      }
      if (cur) lines.push(cur.replace(/\s+$/, ''));
      if (!lines.length) lines = [text];

      cache.set(key, lines);
      if (cache.size > LIMIT) cache.delete(cache.keys().next().value);
      return lines;
    };

    fixed.__i18nCJK = true;
    window.wrapTextCached = fixed;
    // 上游 wrapText 只是转调，一并指过去
    try { if (typeof window.wrapText === 'function') window.wrapText = fixed; } catch (e) { }
  }

  // 重绘若干次，覆盖"上游脚本自身稍后还要初始化再画一帧"的情况
  function requestAnimatedRedraw() {
    var run = function () { requestRedraw(); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    setTimeout(run, 120);
    setTimeout(run, 600);
  }

  /* ---------------- 上游数据重复 ---------------- */
  // 上游 TREE_NODES 里 BCL03 被定义了两次（同 id 同坐标），绘制时会画两张卡，
  // 文字叠在一起像乱码。游戏逻辑用的是 NODE_MAP（后写覆盖），所以保留最后一条即可。
  function dedupeNodes() {
    try {
      if (typeof TREE_NODES === 'undefined' || !TREE_NODES || !TREE_NODES.length) return 0;
      var last = {};
      var i;
      for (i = 0; i < TREE_NODES.length; i++) {
        var n = TREE_NODES[i];
        if (n && n.id) last[n.id] = i;
      }
      var removed = 0;
      for (i = TREE_NODES.length - 1; i >= 0; i--) {
        var node = TREE_NODES[i];
        if (!node || !node.id) continue;
        if (last[node.id] !== i) { TREE_NODES.splice(i, 1); removed++; }
      }
      if (removed) console.info('[i18n] 移除 ' + removed + ' 个重复定义的节点（与 NODE_MAP 保持一致）');
      return removed;
    } catch (e) { return 0; }
  }

  function boot() {
    // 字体在两种语言下都可以切，先装好
    installCanvasFontHook();
    applyFontStyle();

    if (!ENABLED) {
      injectToggle();
      injectFontButton();
      restoreCustomFont();
      window.I18N = {
        lang: LANG, enabled: false,
        t: function (s) { return s; },
        setLang: setLang, setFont: setFont, pickFont: pickCustomFont,
        font: function () { return fontMode; }
      };
      return;
    }

    hookCanvas();
    installWrapFix();
    installTextHook();
    hookEffectSummary();
    hookFormatNum();
    ensureLucide();

    // 数据层：立即 + 数次重试（上游可能延后构建节点数组），并强制重绘
    dedupeNodes();
    var applied = patchData();
    // 上游在解析阶段就画过一帧英文，这里必须主动重绘，否则要等玩家拖动画面才变中文
    requestAnimatedRedraw();
    [0, 60, 300, 1200].forEach(function (ms) {
      setTimeout(function () {
        var dups = dedupeNodes();
        if (patchData() || dups) requestAnimatedRedraw();
      }, ms);
    });

    if (document.title) document.title = translate(document.title);

    walk(document.body);
    observe();
    injectToggle();
    injectFontButton();
    restoreCustomFont();

    // 记录漏译，方便补词条
    var untranslated = new Set();
    window.I18N = {
      lang: LANG,
      enabled: true,
      t: translate,
      setLang: setLang,
      setFont: setFont,
      pickFont: pickCustomFont,
      font: function () { return fontMode; },
      report: function () {
        document.querySelectorAll('*').forEach(function (el) {
          for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && /[A-Za-z]{3}/.test(n.nodeValue) && !SKIP_TAGS[el.tagName]) {
              untranslated.add(n.nodeValue.trim());
            }
          }
          var t = el.getAttribute && el.getAttribute('title');
          if (t && /[A-Za-z]{3}/.test(t)) untranslated.add(t);
        });
        return Array.from(untranslated);
      },
      stats: function () { return { nodes: applied, keys: Object.keys(DICT).length }; }
    };

    console.log('[i18n] ' + LANG + ' 已加载，词条 ' + Object.keys(DICT).length + ' 条，翻译字段 ' + applied + ' 处');
  }

  // 本文件位于 </body> 之前，DOM 已可用；数据在同一个全局词法环境里，可直接读
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
