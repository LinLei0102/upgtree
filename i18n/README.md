# 汉化层说明（i18n）

这套汉化**不改 `index.html` 一个字节**。上游每次提交都在改 `index.html`，只要本地动过它，`git pull` 必然冲突；所以汉化被做成一层外挂，塞进构建生成的产物里。

## 两份产物，各管一头

| 产物 | 依赖 | 用途 | 入库 |
|---|---|---|---|
| `zh.html` | **CDN** | 托管（GitHub Pages 等），体积小，仓库干净 | ✅ 要提交 |
| `zh-offline.html` | `vendor/` | 本地双击测试，断网可跑 | ❌ 已忽略 |

一次构建同时产出两份：

```bash
node tools/build-zh.mjs          # 两份都生成（vendor 缺失时只生成发布版）
node tools/build-zh.mjs --cdn    # 只生成发布版
node tools/build-zh.mjs --vendor # 只生成本地版
```

## 目录

```
index.html            ← 上游文件，永不修改（git pull 只更新它）
zh.html               ← 发布版（CDN），提交入库
zh-offline.html       ← 本地版（vendor），已 gitignore
i18n/
  i18n.js             ← 运行时引擎（DOM + canvas + 数据层翻译）
  zh-CN.js            ← 界面/货币/规则
  nodes/01..16.js     ← 节点、新闻、底板标题、系统提示、挑战描述等分片词条
tools/
  build-zh.mjs        ← index.html → 上述两份
  extract-strings.mjs ← 扫描缺译（UI + 节点 + 装饰文本 + getInfoText + showToast）
  extract-news.mjs    ← 抽取新闻栏消息
  vendor-assets.mjs   ← 下载 CDN 依赖到 vendor/（仅本地离线用）
  scan-page.cjs       ← 真机漏译扫描（需 playwright）
vendor/               ← 本地运行库，已 gitignore
sync-upstream.sh      ← 同步上游 + 重建 + 报缺译
```

## 日常流程

```bash
bash sync-upstream.sh          # 同步上游 → 重建两份产物 → 告诉你缺哪些词条
```

本地测中文开 `zh-offline.html`，托管用 `zh.html`。两者界面完全一致，右下角设置旁有一个「中 / EN」按钮可以切回英文。

## 为什么这样不会冲突

| 动作 | 结果 |
|---|---|
| `git pull` | 只更新 `index.html`，我们没碰它 |
| 汉化文件 | 全是新增文件，上游不存在同名文件 |
| 上游改了某条文案 | 词典键失配 → 该条回落英文，页面不报错、不崩 |
| `vendor/`、`zh-offline.html` | 纯本地，已 gitignore，不进仓库 |

唯一可能的冲突：上游哪天自己新建了 `i18n/` 目录或 `tools/` 下的同名文件。概率极低，真遇到时把我们的文件挪进 `i18n/local/` 即可。

## 翻译为什么分三层

游戏画面是 canvas 画的，文字经 `ctx.fillText` 输出，**而且是先按英文宽度换行、再逐行绘制**。所以逐行替换 DOM 或 hook `fillText` 都无效——必须先翻译 `TREE_NODES[].name/desc` 再让它去换行。因此引擎做了三件事：

1. **数据层**：启动后立刻改写 `TREE_NODES / CHALLENGE_NODES / DECORATIONS / CURRENCIES / NOTATION_MODES` 里的 `name / desc / code / text`，然后强制重绘一帧。
2. **DOM 层**：`MutationObserver` 持续跟踪新增节点、文本变化和 `title` 等属性，覆盖设置面板、弹窗、货币栏。
   **玩家昵称是用户数据，永远跳过**——`#player-name-display`、`#settings-player-name`、`#offline-title span` 三处在翻译时被排除，否则取名撞上词条（比如叫 `Points`）就会变成「点数」。
3. **同步钩子**：包装 `Node.prototype.textContent` / `HTMLElement.prototype.innerText` 的 setter，赋值那一刻就翻译。
   货币栏每 120ms 刷一次，只靠 `MutationObserver`（下一帧才处理）会先闪一帧英文再变回中文——数值一变就闪，很难看。同步钩子把中间态彻底消掉。
4. **canvas 兜底**：包装 `fillText`，处理 `DONE / ENTER / RESET` 这类不换行的零散标签。
5. **效果摘要**：包装 `getNodeEffectSummary` / `getChallengeEffectSummary`，在**拼好、还没断行**时翻。
   节点下方那行青色小字是 `effects` 拼出来的（`Time: Day, +1, +0`），一旦被 `wrapTextCached` 按宽度断成多行，每行都是碎片，词典再也匹配不上，画出来就是半中半英。摘要里还带货币 id（`Rew: x2 cyan`），引擎会按 `CURRENCIES` 换成中文名。

### 顺手修掉的一个上游 bug

`TREE_NODES` 里 **BCL03 定义了两次**（同 id、同坐标）。逻辑走 `NODE_MAP`（后写覆盖）没问题，但绘制是遍历数组，于是同一位置画两张卡，文字叠在一起像乱码。引擎启动时会按 id 去重、保留最后一条，与 `NODE_MAP` 的行为对齐——所以运行时节点数是 **1047**（源码里是 1048 条）。

## 补词条

在 `i18n/zh-CN.js` 里加一行即可，一条一行便于 diff：

```js
"Another Beginning": "又一个起点",
```

两个约定：

- **`#` 代表任意数字**。`"Rate: +#/s": "速率：+#/秒"` 能同时命中 `Rate: +5/s` 和 `Rate: +1.2e10/s`，数字原样填回。
  匹配时会做两次归一化：先纯数字，再「数字+数量级后缀」（`1.16K` / `3.4M`）。所以 `Rate: +1.16K/s` 也能命中同一条词条。
- **拼接型文案用规则**，写在文件末尾的 `__I18N_RULES__`，例如 `EXECUTE #10`、`(+2.25 on reset)` 这类运行时拼出来的标题。规则的第二项可以是字符串（支持 `$1`）或函数（能对捕获组再加工，比如把 `1m 12s` 转成中文时长）。

### 节点下方的效果摘要

节点底下那几行小字（`Time: Day, +1, +0`、`12 seconds -> /5`、`-> x1.31 luck`）来自 `getNodeEffectSummary()`，它把 `display` 类型效果的返回值用 `', '` 拼成一行。所以：

- 单独出现的整句 → 放词典（`Time: Night` → 时间：夜晚）
- 和数字拼在一起的片段 → 只能靠规则表**最后**那条函数规则逐段替换，且必须排在最后，否则会抢先命中别的词条
- 半角 `, ` 会统一换成 `，`；`->` 换成 `→`

新增这类效果时，先 `grep "type: 'display'"` 看返回值里有没有英文，再决定进词典还是进那条规则。

## 缺译自查

```bash
node tools/extract-strings.mjs   # 静态扫描：UI + 节点数据 + 底板标题 + getInfoText + showToast → tools/_todo.json
node tools/scan-page.cjs         # 真机扫描：canvas 实际绘制文本 + 渲染后 DOM
```

`extract-strings.mjs` 还会单独列出**含 `${}` 的动态提示**（`getInfoText` / `showToast` 里拼接数值的那些）。这类没法用固定词条，只能靠 `__I18N_RULES__` 的正则覆盖——上游新增动态提示时这里会直接列出来，不会静默漏掉。

`showToast` 里只取到**片段**的（如 `'⚠️ Max ' + n`、`'Left "' + name + '" challenge'`）登记在 `FRAGMENTS` 里，由规则处理整串，不单独建词条。

`scan-page.cjs` 需要 playwright：

```bash
npm i -D playwright && npx playwright install msedge
```

## 字体切换

左下角 HUD 有一排按钮，其中 **`黑` / `等` / `宋`** 那个就是字体开关，点一下循环切换：

| 模式 | 字体栈 | 说明 |
|---|---|---|
| 黑（默认） | 微软雅黑 → PingFang SC → Noto Sans SC → system-ui | 中文最清爽，中英混排也稳 |
| 等 | Fira Code | 上游原版。中文会回落到系统衬线字体，8px 下偏细 |
| 宋 | 宋体 → Songti SC → Noto Serif SC | 有味道，但小字号下偏细 |

选择存在 `localStorage('upgtree.font')`，也可以用 `#font=mono|sans|serif|custom` 强制指定。代码里可用 `I18N.setFont('sans')`。

### 自定义字体

左下 HUD 的字体按钮，**点一下弹出菜单**：

```
黑体            ✓
等宽（原版）
宋体
─────────────
＋ 上传自定义字体…
```

菜单底部那行就是入口（不是藏在 tooltip 里，玩家一眼能看到）。首次进入还会在旁边浮一个一次性提示气泡，点它也能直接打开菜单。

- 支持 `.ttf / .otf / .woff / .woff2`，上限 40MB，格式是否被支持取决于浏览器
- 文件经 `FontFace` 注册成 `UPGTreeCustom` 字族，DOM 与 canvas 同时生效
- 字体二进制存进 **IndexedDB**（库名 `upgtree-font`），刷新后自动恢复；`localStorage` 装不下几 MB 的字体，所以没用它
- 自定义字族排在字体栈最前面，没覆盖到的字（比如字体不含中文）会往后回落到黑体，不会变成方块
- 重传直接再从菜单里上传一次即可覆盖
- 快捷键：Shift+点击字体按钮 = 直接打开文件选择；控制台 `I18N.pickFont()`

> 注意：自定义字体存在浏览器本地，不随 `zh.html` 走。换设备或清站点数据后需要重传。

### 为什么不能只改 CSS

画面上的节点文字是 **canvas 画的**，CSS 的 `font-family` 完全管不到。所以引擎做了两件事：

1. **DOM 文字**：注入一段 `html, body, body * { font-family: … !important }`
2. **canvas 文字**：包装 `CanvasRenderingContext2D.prototype.font` 的 setter，把 `8px "Fira Code", monospace` 里的字体族换掉而保留字号/字重 —— 上游有 14 处 `ctx.font = …`，这样一处改动全覆盖

换字体后会主动重绘一帧，否则 canvas 上还是旧字体的画面。自定义字体还要等 `face.load()` 完成才生效，否则首帧会用回退字体渲染。

## 当前进度

- 界面外壳（设置面板、HUD、弹窗、货币名、记数法、标题）：**100%**
- 升级树节点：**1048 / 1048**
- 新闻栏消息：**69 / 69**（7 个分组）
- 底板标题（canvas 大字）+ 信息节点提示：**62 / 62**
- 运行时拼接的文案：离线结算弹窗、`EXECUTE xxx`、`Buy xN` 等用 `__I18N_RULES__` 覆盖

词条按层分片存放在 `i18n/nodes/01.js` … `16.js`，由 `build-zh.mjs` 自动按文件名顺序注入，新增分片文件即可，不必改构建脚本。

> 12–15 号分片是补漏用的。这些文案都不属于"节点行"：底板标题写在 `{ type:'text', text:'...' }`、提示文案写在 `getInfoText` 模板里、系统弹条写在 `showToast('...')` 里、挑战节点描述写在 `id` 的下一行、效果条目描述嵌在 `rewards` / `challengeEffects` 数组里，还有直接赋给 `textContent` 的三元表达式。现在这些来源都已纳入 `extract-strings.mjs`——节点改为按花括号配对整块解析、只取深度 1 的字段，所以跨行和嵌套都不会再漏。
>
> 16 号分片对应上游 2026-11 的新增板块：灰色扩展 CGR10–16、洋红 / 法力 CM01–10 与 CMN01–03、黄色扩展 CY19–25、托帕石扩展 CGL22–25、欧米伽赌博 BTW01–07，以及底板 XI 和 3 块新底板装饰。

## 新闻栏为什么要单独处理

新闻消息不是普通文案，它带一套轻量标记：`[red]…[/red]`、`[rainbow]…[/rainbow]`、`**加粗**`，由 `parseNewsMarkup()` 转成 HTML 后塞进 innerHTML。渲染完成后文本已经被 `<span>` 拆成多个文本节点，DOM 层拿到的是碎片，整体匹配不到词典。

所以引擎在数据层直接改写 `NEWS_GROUPS[组].messages[]`，**翻译时标记必须原样保留**（否则颜色直接失效）：

```js
"[rainbow]woo...[/rainbow].": "[rainbow]哇哦...[/rainbow]。",
```

行尾空格由引擎自动保留，词条里不用写。抽消息用 `node tools/extract-news.mjs`。

## 外部依赖

发布版 `zh.html` 走 CDN（托管环境有网，仓库也就不必塞二进制）；本地版 `zh-offline.html` 用 `vendor/` 里的副本：

| 依赖 | 发布版 | 本地版 |
|---|---|---|
| Tailwind Play CDN | CDN | `vendor/tailwind.js` |
| lucide 图标 | CDN | `vendor/lucide.js` |
| Google Fonts / Fira Code | CDN | `vendor/fira-code.css` + 7 个 woff2 |
| Firebase 计数器 | CDN + 降级 | 同左（见下） |

重新下载本地库：`node tools/vendor-assets.mjs`（幂等；`--force` 强制重下）。

### 两个坑

**1. 图标库加载失败会中断主脚本。** 上游在解析阶段就调 `lucide.createIcons()`，一旦失败直接抛错，后面整段脚本都不执行。所以 `build-zh.mjs` 在 lucide 的 `<script>` 后紧跟一个空实现——两种构建都注入，掉图标但不断流程。

**2. 本地 ESM 模块在 `file://` 下会被 CORS 拦。** 浏览器硬限制：`file://` 页面（origin 为 `null`）不允许 import 本地模块文件。所以把 firebase 放 `vendor/` 反而比 CDN 更糟——之前试过，报 `Cross origin requests are only supported for protocol schemes…`。

因此 firebase 一律保留 CDN，但把静态 `import` 改成 try/catch 的 `await import()`：静态 import 一旦失败，整个 `<script type="module">` 连同其中的昵称系统、欢迎弹窗都不会执行；改成动态导入后，失败只是降级为空实现，其余逻辑照常跑。**离线时全局计数器本来就是废的（要联网），零功能损失。**
