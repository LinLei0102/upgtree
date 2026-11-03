# Upgrade Land（升级大陆）— 简体中文汉化版

[Upgrade Land](https://andyyim175.github.io/upgtree) 的中文汉化版 —— 一款基于坐标的大型放置升级树游戏。

> 原版作者：Andy Yim · 原仓库：[AndyYim175/upgtree](https://github.com/AndyYim175/upgtree)
> 汉化说明：本仓库是原版的 fork，叠加了一层**零侵入**的中文翻译，不改动原版 `index.html` 一个字节。

## 开始玩

| 入口 | 地址 / 文件 | 说明 |
|---|---|---|
| 在线版（推荐） | <https://linlei0102.github.io/upgtree/> | GitHub Pages，即开即玩 |
| 在线中文版 | [`zh.html`](zh.html) | 仓库内的发布版（走 CDN） |
| 本地离线版 | `zh-offline.html` | 断网也能玩（需先构建 vendor） |

## 汉化特性

- **全量中文化**：1000+ 节点、69 条新闻栏消息、界面、挑战、系统提示、底板标题全覆盖
- **零侵入**：`index.html` 保持上游原样，同步上游永不冲突
- **字体切换**：黑体 / 等宽（原版）/ 宋体一键循环，支持上传自定义字体
- **中 / EN 一键切换**：右下角设置旁有语言切换按钮
- **附带油猴脚本**：时间倍速（0.1× ~ 100×）+ 自动购买，见 [`userscript/`](userscript/)

## 快速开始

```bash
git clone git@github.com:LinLei0102/upgtree.git
cd upgtree
node tools/build-zh.mjs    # 生成 zh.html（发布版）
bash sync-upstream.sh      # 同步上游 + 重建 + 报缺译
```

本地测中文打开 `zh-offline.html`，托管用 `zh.html`，两者界面一致。

## 目录结构

```
index.html        上游原版（永不修改，git pull 只更新它）
zh.html           发布版（CDN），提交入库
zh-offline.html   本地版（vendor），已 gitignore
i18n/             翻译引擎 + 词典 + 15 个分片词条 + 术语表
tools/            构建 / 提取 / 漏译扫描脚本
userscript/       时间倍速 + 自动购买油猴脚本
.github/          GitHub Pages 自动部署工作流
```

## 详细文档

- 汉化架构与维护：[`i18n/README.md`](i18n/README.md)
- 术语约定：[`i18n/术语表.md`](i18n/术语表.md)
- 油猴脚本用法：[`userscript/README.md`](userscript/README.md)
