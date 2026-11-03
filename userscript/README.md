# 时间倍速 + 自动购买脚本（油猴 / Tampermonkey）

`time-speed.user.js` —— 给 upgtree（Upgrade Land）加时间倍速（预设 + 自定义）和自动购买。

## 安装

1. 浏览器装 [Tampermonkey](https://www.tampermonkey.net/)（或 Violentmonkey）
2. 打开 Tampermonkey 面板 → 新建脚本 → 把 `time-speed.user.js` 的内容整个粘进去 → Ctrl+S 保存
3. 打开游戏页面，左上角出现 `⏱ 1×` 就是装好了

> 如果托管地址不是 `github.io`，把脚本头部的 `@match` 改成你的域名即可（例如 `@match *://example.com/*`）。

## 用法

点左上角 `⏱` 展开面板：

- **预设**：1× / 2× / 5× / 10× / 20× / 50× / 100×
- **自定义**：填任意数字（支持小数，最低 0.1×「慢放」，最高 1000×）
- **暂停**：临时关掉倍速，等效 1×，再点恢复
- **Alt+↑ / Alt+↓**：按档位快速加减速
- **自动购买**：一键买下所有「已解锁且买得起」的升级，省得自己点
- 面板右上角实时显示 **实际 tick 频率**，1× ≈ 10 次/秒；如果显示「已达性能上限」说明撞到保护阈值了

设置存在 `localStorage('upgtree.speed')` / `localStorage('upgtree.autobuy')`，下次打开自动恢复。
控制台可用 `__UPG_SPEED.set(50)` / `__UPG_SPEED.rate()` / `__UPG_SPEED.autoBuy(true)` / `__UPG_SPEED.gameAuto()`。

## 自动购买

调用的是游戏自己的接口，不模拟鼠标点击：

```js
isNodeUnlocked(node)            // 是否已解锁
getCost(node)                   // 现价（内部已处理 maxLevel / bulkFinalCost）
buyUpgrade(id, true, false)     // 第二参数=能买多少买多少；第三参数=false 表示照常扣钱
```

- 每 400ms 扫一遍，单次最多 40 次、耗时超过 8ms 就收手，不会把页面卡住
- 游戏暂停时不动
- **只买 `type==='upgrade'`**，重置类节点（`reset`）不碰

### 游戏内自动化接管时自动关闭

上游 `checkAutomation()` 会对带 `automation` 效果的节点自动购买，且调用的是 `buyUpgrade(id, true, true)`——**免费买**。两边同时跑会抢同一批节点，所以脚本会自动让位：

| 判定方式 | 说明 |
|---|---|
| 静态扫描 | 每 1.5s 检查是否有「等级 > 0 且效果含 `type:'automation'`」的节点 |
| 运行时信号 | 包装 `buyUpgrade`，只要看到 `isFree === true` 的调用，立刻认定游戏自动化在干活（这是上游唯一传 `true` 的地方） |

一旦判定接管，脚本的自动购买会**自己关掉**，面板显示「游戏自动化已接管，已自动关闭」。

如果你手动再点开，脚本会尊重你的选择（显示「游戏自动化也在运行（手动开启）」），不再反复关——因为脚本买的是**全部**已解锁节点，而游戏的自动化只买它指定的目标，两者并不完全重叠。

## 原理（倍速部分）

看源码得出的结论，没动任何游戏逻辑：

```js
// 主循环
const dt = Math.min(50, timestamp - lastTime);
gameTickAccumulator += dt;
while (gameTickAccumulator >= GAME_TICK_MS) {   // 100ms
    tickGame(GAME_TICK_MS);                     // 经济结算全在这里
    gameTickAccumulator -= GAME_TICK_MS;
}
```

`tickGame(dtMs)` 完全由传入参数驱动，内部没有 `Date.now()` 依赖。所以脚本只做一件事：**包一层 `tickGame`，每次被调用就多跑几次**。

- 不拦截 `requestAnimationFrame`，渲染节奏不受影响，画面不会跟着抖
- 小数倍速用余数累计（`carry`），1.5× 长期平均准确
- 每秒最多跑 200 次（约 14ms 预算），超了就跳过剩余次数——宁可少跑也不让页面卡死

## 两个已知边界

1. **游戏自带的自动购买器不跟倍速加速。** 上游的自动化有 `performance.now() - lastAutomationTime >= 200` 的真实时间闸门，这个变量在闭包里，外部改不了。倍速只加速产出，它仍按真实 200ms 触发（反正每次都买当前买得起的量，不影响结果）。脚本自己的自动购买不受这个闸门限制。
2. **约 200× 是实际上限。** 再高会被单帧预算挡住，面板会显示「已达性能上限」。这是有意设计，避免高倍速把浏览器卡死。

## 兼容性

- 与汉化层（`i18n/`）互不干扰，它只包 `tickGame` 和 `buyUpgrade`
- 脚本用 Shadow DOM 渲染面板，不会被游戏的 Tailwind 样式影响，也不会污染游戏样式
