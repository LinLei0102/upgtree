// 把页面依赖的三个 CDN 资源抓到本地 vendor/，让 zh.html 完全离线可用。
// 用法: node tools/vendor-assets.mjs
// 幂等：已存在且非空的文件会跳过，加 --force 强制重下。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'vendor');
const FONTS = path.join(VENDOR, 'fonts');
const FORCE = process.argv.includes('--force');

fs.mkdirSync(FONTS, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function download(url, dest, { binary = true } = {}) {
  if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log(`  = 跳过 ${path.relative(ROOT, dest)}（已存在 ${(fs.statSync(dest).size / 1024).toFixed(0)} KB）`);
    return fs.readFileSync(dest, 'utf8');
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, binary ? buf : buf.toString('utf8'));
  console.log(`  ✓ ${path.relative(ROOT, dest)}（${(buf.length / 1024).toFixed(0)} KB）`);
  return binary ? null : buf.toString('utf8');
}

console.log('→ tailwind（Play CDN 运行时）');
await download('https://cdn.tailwindcss.com/3.4.16', path.join(VENDOR, 'tailwind.js'));

console.log('→ lucide（图标）');
await download('https://unpkg.com/lucide@0.469.0/dist/umd/lucide.js', path.join(VENDOR, 'lucide.js'));

console.log('→ Fira Code（字体样式 + woff2）');
// 带 Chrome UA 才会返回 woff2 与 unicode-range 分片
const cssUrl = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap';
const rawCss = await (async () => {
  const res = await fetch(cssUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`字体 CSS → HTTP ${res.status}`);
  return await res.text();
})();

let css = rawCss;
const urls = [...new Set([...rawCss.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1]))];
console.log(`  发现 ${urls.length} 个字体文件`);

for (const u of urls) {
  const name = u.split('/').pop().split('?')[0];
  const dest = path.join(FONTS, name);
  await download(u, dest);
  css = css.split(u).join(`fonts/${name}`);
}

fs.writeFileSync(path.join(VENDOR, 'fira-code.css'), css, 'utf8');
console.log(`  ✓ vendor/fira-code.css（已把 ${urls.length} 个地址改为本地相对路径）`);

console.log('→ Firebase（全局计数器用的 ESM 模块）');
const FB_DIR = path.join(VENDOR, 'firebase');
fs.mkdirSync(FB_DIR, { recursive: true });
const FB_VER = '10.14.1';
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

await download(`${FB_BASE}/firebase-app.js`, path.join(FB_DIR, 'firebase-app.js'));
const dbCode = await download(`${FB_BASE}/firebase-database.js`, path.join(FB_DIR, 'firebase-database.js'), { binary: false });

// firebase-database.js 里用绝对 URL 引 firebase-app.js，改成同目录相对引用才能离线
if (dbCode && dbCode.includes(`${FB_BASE}/firebase-app.js`)) {
  const patched = dbCode.split(`${FB_BASE}/firebase-app.js`).join('./firebase-app.js');
  fs.writeFileSync(path.join(FB_DIR, 'firebase-database.js'), patched, 'utf8');
  console.log('  ✓ 已把 firebase-database.js 里的绝对 import 改为 ./firebase-app.js');
}

console.log('\n完成。现在跑 node tools/build-zh.mjs，生成的 zh.html 会指向 vendor/。');
