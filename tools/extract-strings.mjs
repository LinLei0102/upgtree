// 从 index.html 中抽取所有待翻译的英文字符串（静态 UI + 升级树节点）
// 用法: node tools/extract-strings.mjs
// 输出: tools/_todo.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------------- 工具 ---------------- */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ', copy: '©', hellip: '…', mdash: '—', ndash: '–' };
const decode = (s) => s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, k) => {
  if (k[0] === '#') {
    const cp = k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
  }
  return ENTITIES[k] ?? m;
});

const unescapeJs = (s) => s
  .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  .replace(/\\n/g, '\n').replace(/\\t/g, '\t');

// 是否值得翻译：必须含至少 2 个连续英文字母
const worth = (s) => /[A-Za-z]{2}/.test(s);

/* ---------------- 1. 静态 UI 标记 ---------------- */

// 第一个内联 <script> 之前全是静态 HTML
const inlineScript = html.match(/\r?\n\s*<script>\s*\r?\n/);
const markupEnd = inlineScript ? inlineScript.index : html.length;
let markup = html.slice(0, markupEnd);

markup = markup
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<title>[\s\S]*?<\/title>/gi, '<title>Upgrade Land</title>'); // title 单独处理

const ui = new Map(); // 原文 -> 出现次数
const addUi = (raw) => {
  if (!raw) return;
  const s = decode(raw).replace(/\s+/g, ' ').trim();
  if (!s || !worth(s)) return;
  ui.set(s, (ui.get(s) || 0) + 1);
};

// 文本节点
for (const m of markup.matchAll(/>([^<>]+)</g)) addUi(m[1]);
// 常见携带文案的属性
for (const m of markup.matchAll(/\s(?:title|placeholder|aria-label|alt|data-tooltip)\s*=\s*"([^"]*)"/g)) addUi(m[1]);
for (const m of markup.matchAll(/\s(?:title|placeholder|aria-label|alt|data-tooltip)\s*=\s*'([^']*)'/g)) addUi(m[1]);
// <title>
for (const m of html.matchAll(/<title>([^<]*)<\/title>/gi)) addUi(m[1]);

/* ---------------- 2. 升级树节点 ---------------- */

const nodes = [];

// 节点对象可能跨多行（挑战节点就是：desc 在下一行），所以不能按行抓，
// 要先用花括号配对切出整个对象，再只取深度为 1 的字段（避免把 effects[].desc 当成节点 desc）
function topLevelFields(block) {
  const out = {};
  let depth = 0;
  let inStr = null;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '{' || ch === '[') { depth++; continue; }
    if (ch === '}' || ch === ']') { depth--; continue; }
    if (depth !== 1) continue;
    if (!/[A-Za-z_$]/.test(ch)) continue;
    if (i > 0 && !/[\s,{]/.test(block[i - 1])) continue;
    let j = i;
    while (j < block.length && /[\w$]/.test(block[j])) j++;
    const key = block.slice(i, j);
    let k = j;
    while (k < block.length && /\s/.test(block[k])) k++;
    if (block[k] === ':') {
      k++;
      while (k < block.length && /\s/.test(block[k])) k++;
      const q = block[k];
      if (q === "'" || q === '"' || q === '`') {
        let v = '';
        for (let m = k + 1; m < block.length; m++) {
          const c = block[m];
          if (c === '\\') { v += c + block[++m]; continue; }
          if (c === q) break;
          v += c;
        }
        if (!(key in out)) out[key] = unescapeJs(v);
      }
    }
    i = j - 1;
  }
  return out;
}

const braceDelta = (s) => {
  let d = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}') d--;
  }
  return d;
};

const lines = html.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  // 注意：不能要求 `{ id:` 开头——有些节点带前置属性，例如
  // { bulkFinalCost: true, id: 'I01', type: 'upgrade', ... }，写死会把它们整条漏掉
  if (!/^\s*\{[^\n]*?\bid:\s*'/.test(lines[i])) continue;
  let block = lines[i];
  let depth = braceDelta(block);
  let j = i;
  while (depth > 0 && j + 1 < lines.length) {
    j++;
    block += '\n' + lines[j];
    depth += braceDelta(lines[j]);
  }
  i = j;
  const rec = topLevelFields(block);
  if (rec.type && /^(automation|display|line|rect|text|coord)$/.test(rec.type) && !rec.name) continue;
  if (rec.id) nodes.push(rec);
}

/* ---------------- 2b. 另外两类容易漏的文案 ---------------- */
// (a) 装饰/标签：{ type: 'text', text: 'Point baseplate' } —— 画在 canvas 上的底板标题
// (b) 信息节点的动态文案：getInfoText: () => `Note that ...`（纯字面量，不含 ${}）
const extras = new Map(); // 原文 -> 来源说明
const addExtra = (s, where) => {
  const v = unescapeJs(s).replace(/\s+/g, ' ').trim();
  if (!v || !worth(v)) return;
  if (!extras.has(v)) extras.set(v, where);
};

for (const m of html.matchAll(/\{\s*type:\s*'text'[^\n]*?\btext:\s*'((?:[^'\\]|\\.)*)'/g)) addExtra(m[1], 'decoration text');
for (const m of html.matchAll(/getInfoText:\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*`([^`$]*)`/g)) addExtra(m[1], 'getInfoText');
for (const m of html.matchAll(/getInfoText:\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*'([^'\\]*)'/g)) addExtra(m[1], 'getInfoText');

// (b3) 直接赋值给 textContent / innerHTML 的字面量（三元表达式里的也算）
//      例：heading.textContent = fromSettings ? 'Change your name' : 'Welcome ...'
//      只取等号右边的部分，否则会把 getElementById('xxx') 里的 id 也当成文案
for (const line of lines) {
  if (/^\s*\/\//.test(line)) continue;
  const mm = /\.(?:textContent|innerText|innerHTML)\s*=([\s\S]*)$/.exec(line);
  if (!mm) continue;
  for (const m of mm[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    const v = unescapeJs(m[1]).trim();
    if (/[<>]/.test(v)) continue;   // HTML 片段，翻的是里面的文本节点
    if (!/\s/.test(v)) continue;    // 单个标识符 / 图标名 / 开关键 / 拼接碎片（ON、pause、new,）
    addExtra(m[1], 'textContent assignment');
  }
}

// (b2) 效果条目的 desc：{ type: 'currency_mult', ..., desc: 'x2 cyan per completion' }
//      上游会把它渲染成「desc (xN)」显示在节点详情里，属于用户可见文案。
//      挑战节点的 challengeEffects / rewards 都是这种；节点自身的 desc 已在 nodes 里，跳过。
const nodeDescs = new Set(nodes.map((n) => n.desc).filter(Boolean));
for (const line of lines) {
  if (/^\s*\/\//.test(line)) continue; // 注释掉的不算
  for (const m of line.matchAll(/\bdesc:\s*'((?:[^'\\]|\\.)*)'/g)) {
    const v = unescapeJs(m[1]).replace(/\s+/g, ' ').trim();
    if (nodeDescs.has(v)) continue;
    if (!/\s/.test(v) && /[\\^]/.test(v)) continue; // 纯公式（/lvl^lvl），不翻
    addExtra(v, 'effect desc');
  }
}

// (a2) 系统提示 showToast(...)：静态字面量进词表；含 ${} 的登记为动态（需规则）
for (const m of html.matchAll(/showToast\(\s*'((?:[^'\\]|\\.)*)'/g)) addExtra(m[1], 'toast');
for (const m of html.matchAll(/showToast\(\s*"((?:[^"\\]|\\.)*)"/g)) addExtra(m[1], 'toast');
for (const m of html.matchAll(/showToast\(\s*`([^`$]*)`/g)) addExtra(m[1], 'toast');

// (c) 含 ${} 的动态提示：没法用固定词条，只能靠 __I18N_RULES__ 的正则兜。
//     这里只做登记，方便上游新增动态提示时能立刻发现。
const dynamicHints = new Set();
for (const m of html.matchAll(/getInfoText:\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*`([\s\S]*?)`/g)) {
  if (m[1].includes('${')) dynamicHints.add(m[1].replace(/\$\{[^}]*\}/g, '${…}'));
}
for (const m of html.matchAll(/showToast\(\s*`([\s\S]*?)`/g)) {
  if (m[1].includes('${')) dynamicHints.add(m[1].replace(/\$\{[^}]*\}/g, '${…}'));
}

/* ---------------- 3. 已有词条 ---------------- */

const dictPath = path.join(ROOT, 'i18n', 'zh-CN.js');
const known = new Set();
const dictFiles = [dictPath];
const nodesDir = path.join(ROOT, 'i18n', 'nodes');
if (fs.existsSync(nodesDir)) {
  for (const f of fs.readdirSync(nodesDir).filter((x) => x.endsWith('.js')).sort()) {
    dictFiles.push(path.join(nodesDir, f));
  }
}
for (const f of dictFiles) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*"((?:[^"\\]|\\.)*)"\s*:\s*"/);
    if (m) known.add(unescapeJs(m[1]));
  }
}

// 运行时才拼到别的内容上的前缀片段，整串由 __I18N_RULES__ 处理，不必单独有词条
const FRAGMENTS = new Set(['Entered "', 'Left "', '⚠️ Max', '👋 Welcome back,']);

// 与引擎一致：折叠空白 + 数字归一化，让 "+0 Currency" 命中 "+# Currency"、换行文本也能对上
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const isTranslated = (s) => {
  const n = squash(s);
  if (FRAGMENTS.has(n)) return true;
  return known.has(n) || known.has(n.replace(NUM_RE, '#'));
};

// code 字段多半是编号（#01 / CCC01 / CY+ / CY07），只有含小写字母的才是真文案（Start / time warp）
const needField = (k, v) => {
  if (!v || !worth(v)) return false;
  if (k === 'code') return /[a-z]/.test(v);
  return true;
};

/* ---------------- 4. 输出 ---------------- */

const missingUi = [...ui.keys()].filter((s) => !isTranslated(s));
const missingExtras = [...extras.entries()].filter(([s]) => !isTranslated(s)).map(([s, w]) => ({ where: w, text: s }));
const missingNodes = nodes.filter((n) =>
  ['name', 'desc', 'code', 'text'].some((k) => needField(k, n[k]) && !isTranslated(n[k]))
).map((n) => {
  const miss = {};
  for (const k of ['name', 'desc', 'code', 'text']) {
    if (needField(k, n[k]) && !isTranslated(n[k])) miss[k] = n[k];
  }
  return { id: n.id, ...miss };
});

const todo = {
  generatedAt: new Date().toISOString(),
  stats: {
    uiTotal: ui.size, uiMissing: missingUi.length,
    extrasTotal: extras.size, extrasMissing: missingExtras.length,
    nodesTotal: nodes.length, nodesMissing: missingNodes.length,
  },
  ui: missingUi,
  extras: missingExtras,
  dynamicGetInfoText: [...dynamicHints],
  nodes: missingNodes,
};

fs.writeFileSync(path.join(ROOT, 'tools', '_todo.json'), JSON.stringify(todo, null, 2), 'utf8');

console.log(`静态 UI : ${ui.size} 条，已译 ${ui.size - missingUi.length}，缺 ${missingUi.length}`);
console.log(`装饰/提示: ${extras.size} 条，已译 ${extras.size - missingExtras.length}，缺 ${missingExtras.length}`);
console.log(`节点文案: ${nodes.length} 个节点，缺 ${missingNodes.length} 个`);
if (dynamicHints.size) {
  console.log(`动态提示: ${dynamicHints.size} 条含 \${}，无法用固定词条，需在 __I18N_RULES__ 里覆盖（已登记在 _todo.json）`);
  for (const t of dynamicHints) console.log('  · ' + t);
}
console.log(`→ tools/_todo.json`);
