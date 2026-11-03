// index.html (上游原样) → 两份产物
//   zh.html          发布版：走 CDN，体积小，可直接托管到 GitHub Pages
//   zh-offline.html  本地版：引用 vendor/，断网可跑，不入库
// 设计: 绝不修改 index.html，保证 git pull 同步上游时零冲突。
// 用法: node tools/build-zh.mjs [--cdn|--vendor]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'index.html');

const FORCE_CDN = process.argv.includes('--cdn');
const FORCE_VENDOR = process.argv.includes('--vendor');

/* ---------------- 汉化层脚本清单 ---------------- */
const NODES_DIR = path.join(ROOT, 'i18n', 'nodes');
const nodeParts = fs.existsSync(NODES_DIR)
  ? fs.readdirSync(NODES_DIR).filter((f) => f.endsWith('.js')).sort()
  : [];

const SCRIPTS = ['i18n/zh-CN.js']
  .concat(nodeParts.map((f) => 'i18n/nodes/' + f))
  .concat(['i18n/i18n.js']);

/* ---------------- vendor 是否就绪 ---------------- */
const VENDOR_FILES = ['tailwind.js', 'lucide.js', 'fira-code.css'];
const vendorReady = VENDOR_FILES.every(
  (f) => fs.existsSync(path.join(ROOT, 'vendor', f)) && fs.statSync(path.join(ROOT, 'vendor', f)).size > 0
);

/* ---------------- 图标兜底（两种构建都要） ---------------- */
const LUCIDE_STUB = `
    <script>
    /* 汉化层：图标库兜底。加载失败只会少图标，不会中断初始化 */
    if (typeof lucide === 'undefined') {
        window.lucide = { createIcons: function () { }, icons: {} };
        console.warn('[i18n] lucide 未加载，已启用空实现：图标不显示，功能正常');
    }
    </script>`;

const FB_STUBS = {
  initializeApp: 'function () { return {}; }',
  getDatabase: 'function () { return {}; }',
  ref: 'function () { return {}; }',
  child: 'function () { return {}; }',
  increment: 'function (n) { return n; }',
  set: 'function () { return Promise.resolve(); }',
  get: 'function () { return Promise.resolve({ exists: function () { return false; }, val: function () { return null; } }); }',
  runTransaction: 'function () { return Promise.resolve({ committed: false, snapshot: { val: function () { return null; } } }); }',
};

/* ---------------- 构建 ---------------- */

function build({ useVendor }) {
  let html = fs.readFileSync(SRC, 'utf8');
  const notes = [];

  if (!/<\/body>/i.test(html)) throw new Error('index.html 里找不到 </body>，上游结构可能变了');

  // 1. 注入汉化层到 </body> 之前（此处能拿到全局 TREE_NODES 等常量）
  const snippet = `
    <!-- ===== 本地汉化层（由 tools/build-zh.mjs 生成，勿手改）===== -->
${SCRIPTS.map((s) => `    <script src="${s}"></script>`).join('\n')}
`;
  html = html.replace(/(\s*)<\/body>/i, `${snippet}$1</body>`);

  // 2. 图标兜底：上游在解析阶段就调 lucide.createIcons()，失败会打断整个主脚本
  const lucideTag = '<script src="https://unpkg.com/lucide@latest">';
  const li = html.indexOf(lucideTag);
  if (li > -1) {
    const close = html.indexOf('</script>', li);
    if (close > -1) {
      const at = close + '</script>'.length;
      html = html.slice(0, at) + LUCIDE_STUB + html.slice(at);
    }
  }

  // 3. 语言标记
  html = html.replace(/<html([^>]*?)\slang="[^"]*"/i, '<html$1 lang="zh-CN"');

  // 4. Firebase：静态 import → 可选动态 import
  //    静态 import 失败会让整个 module 不执行（昵称系统在里面）；
  //    而本地 ESM 在 file:// 下会被 CORS 拦，所以只能保留 CDN + 降级。
  const mApp = html.match(/import\s*\{\s*initializeApp\s*\}\s*from\s*"(https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*firebase-app\.js)";/);
  const mDb = html.match(/import\s*\{([^}]+)\}\s*from\s*"(https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*firebase-database\.js)";/);
  if (mApp && mDb && mDb.index > mApp.index) {
    const names = ['initializeApp', ...mDb[1].split(',').map((s) => s.trim()).filter((n) => n && n !== 'initializeApp')];
    const others = names.filter((n) => n !== 'initializeApp');
    const fallback = names.map((n) => `        ${n} = ${FB_STUBS[n] || 'function () { return {}; }'};`).join('\n');
    const block = `// 汉化层：Firebase 改为可选动态导入。离线时降级为空实现（全局计数器本身就需要联网）
    let ${names.join(', ')};
    try {
        ({ initializeApp } = await import("${mApp[1]}"));
        ({ ${others.join(', ')} } = await import("${mDb[2]}"));
    } catch (err) {
${fallback}
        console.warn('[i18n] Firebase 未加载（离线？），全局计数器已停用，其余功能正常');
    }`;
    html = html.slice(0, mApp.index) + block + html.slice(mDb.index + mDb[0].length);
  } else {
    notes.push('未识别 firebase import，跳过降级改写');
  }

  // 5. 样式 / 图标 / 字体：本地版指向 vendor，发布版保持 CDN
  if (useVendor) {
    html = html
      .split('<script src="https://cdn.tailwindcss.com">').join('<script src="vendor/tailwind.js">')
      .split(lucideTag).join('<script src="vendor/lucide.js">')
      .replace(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"[^>]*>/i, '<link href="vendor/fira-code.css" rel="stylesheet">')
      .replace(/\s*<link rel="preconnect"[^>]*>/gi, '');
  }

  return { html, notes };
}

/* ---------------- 产出 ---------------- */

let ok = 0;

// 发布版（CDN）
if (!FORCE_VENDOR) {
  const { html, notes } = build({ useVendor: false });
  fs.writeFileSync(path.join(ROOT, 'zh.html'), html, 'utf8');
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
  console.log(`✓ zh.html（${kb} KB）  发布版 · 走 CDN · 可托管`);
  notes.forEach((n) => console.log('  ! ' + n));
  ok++;
}

// 本地版（vendor）
if (!FORCE_CDN) {
  if (vendorReady) {
    const { html } = build({ useVendor: true });
    fs.writeFileSync(path.join(ROOT, 'zh-offline.html'), html, 'utf8');
    const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
    console.log(`✓ zh-offline.html（${kb} KB）  本地版 · 走 vendor/ · 断网可跑`);
    ok++;
  } else {
    console.log('· vendor/ 不完整，跳过本地版。需要离线包请先跑: node tools/vendor-assets.mjs');
  }
}

if (!ok) { console.error('✗ 什么都没生成（--cdn 与 --vendor 不能同时用）'); process.exit(1); }
console.log('  index.html 始终保持上游原样');
