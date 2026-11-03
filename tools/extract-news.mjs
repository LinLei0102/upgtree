// 抽取 NEWS_GROUPS 里的全部新闻消息 → tools/_news.json
// 用法: node tools/extract-news.mjs
// 说明：新闻消息不是普通文案，它带 [color]..[/color] / **bold** / 换行 等标记，
//       必须在数据层翻译（渲染后会被标签拆成多个文本节点，DOM 层无法整体匹配）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const start = html.indexOf('const NEWS_GROUPS = {');
if (start < 0) { console.error('✗ 找不到 NEWS_GROUPS'); process.exit(1); }
const endMark = html.indexOf('const newsTrack', start);
const block = html.slice(start, endMark > 0 ? endMark : start + 40000);

const groups = [...block.matchAll(/^ {12}(\w+):\s*\{/gm)];
const result = {};
let total = 0;

groups.forEach((m, i) => {
  const from = m.index;
  const to = i + 1 < groups.length ? groups[i + 1].index : block.length;
  const seg = block.slice(from, to);
  const nameM = seg.match(/name:\s*'([^']*)'/);
  const msgs = [...seg.matchAll(/^ *"((?:[^"\\]|\\.)*)",? *$/gm)].map((x) => x[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
  total += msgs.length;
  result[m[1]] = { name: nameM ? nameM[1] : '', messages: msgs };
});

const out = path.join(ROOT, 'tools', '_news.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');

console.log('分组：');
for (const [k, v] of Object.entries(result)) console.log(`  ${k.padEnd(10)} ${String(v.messages.length).padStart(3)} 条  (${v.name})`);
console.log(`合计 ${total} 条 → tools/_news.json`);
