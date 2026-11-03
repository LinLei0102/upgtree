// 运行时漏译扫描：打开 zh.html，把 canvas 绘制的文本 + DOM 文本都抓出来，
// 报告"仍含英文且不在词典里"的字符串。改完词典跑一次即可确认收尾情况。
//
// 用法: node tools/scan-page.cjs
// 依赖: playwright（npx playwright 装过即可，可用 NODE_PATH 指向其 node_modules）
const path = require('path');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('缺少 playwright。先执行: npm i -D playwright && npx playwright install msedge');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const FILE = 'file:///' + path.join(ROOT, 'zh.html').replace(/\\/g, '/').replace(/ /g, '%20');
const CHANNEL = process.env.BROWSER_CHANNEL || 'msedge';

// 词典里已有的键（zh-CN.js + i18n/nodes/*.js）
const dictFiles = [path.join(ROOT, 'i18n', 'zh-CN.js')];
const nodesDir = path.join(ROOT, 'i18n', 'nodes');
if (fs.existsSync(nodesDir)) {
  for (const f of fs.readdirSync(nodesDir).filter((x) => x.endsWith('.js')).sort()) {
    dictFiles.push(path.join(nodesDir, f));
  }
}
const keys = new Set();
for (const f of dictFiles) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*"((?:[^"\\]|\\.)*)"\s*:\s*"/);
    if (m) keys.add(m[1]);
  }
}

const NUM_RE = /-?\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
const known = (s) => {
  if (keys.has(s)) return true;
  const norm = s.replace(NUM_RE, '#');
  return keys.has(norm);
};
// 已含中文的字符串视为已处理（避免 "试试 player.devSpeed" 这类中英混排被误报）
const HAS_CJK = /[\u3400-\u9fff]/;
const suspicious = (s) => /[A-Za-z]{3}/.test(s) && !HAS_CJK.test(s) && !known(s);

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(FILE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  const raw = await page.evaluate(() => {
    window.__canvasText = new Set();
    const proto = CanvasRenderingContext2D.prototype;
    const orig = proto.fillText;
    proto.fillText = function (t) { if (t) window.__canvasText.add(String(t)); return orig.apply(this, arguments); };
    // 关掉昵称弹窗，让画面主干跑起来
    document.querySelectorAll('input').forEach((i) => { i.value = '测试'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    document.querySelectorAll('button').forEach((b) => { if (/设定昵称|SET NAME/.test(b.textContent)) b.click(); });
    return true;
  });

  await page.waitForTimeout(600);
  await page.mouse.move(640, 430);
  await page.mouse.down();
  await page.mouse.move(700, 470, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  // 打开设置面板，把面板文案也拉进来
  await page.evaluate(() => {
    const t = document.querySelector('#btn-settings-toggle');
    if (t) t.click();
  });
  await page.waitForTimeout(800);
  if (raw) { /* noop */ }

  const result = await page.evaluate(() => {
    const dom = new Set();
    const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
    document.querySelectorAll('*').forEach((el) => {
      if (SKIP[el.tagName]) return;
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.nodeValue.trim()) dom.add(n.nodeValue.trim());
      }
      ['title', 'placeholder', 'aria-label'].forEach((a) => {
        const v = el.getAttribute && el.getAttribute(a);
        if (v) dom.add(v);
      });
    });
    return { canvas: Array.from(window.__canvasText || []), dom: Array.from(dom), title: document.title };
  });

  const canvasLeft = [...new Set(result.canvas.filter(suspicious))];
  const domLeft = [...new Set(result.dom.filter(suspicious))];

  console.log('页面标题:', result.title);
  console.log('JS 运行时错误:', errors.length ? errors : '无');
  console.log('\n--- canvas 漏译 (' + canvasLeft.length + ') ---');
  canvasLeft.slice(0, 80).forEach((s) => console.log('  ' + s));
  console.log('\n--- DOM 漏译 (' + domLeft.length + ') ---');
  domLeft.slice(0, 80).forEach((s) => console.log('  ' + s));

  await browser.close();
})();
