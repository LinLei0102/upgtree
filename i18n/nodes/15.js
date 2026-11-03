/* ============================================================================
 * 分片 15 —— 挑战节点描述 / 效果条目 / 改名弹窗
 *
 * 这一批之前全漏：
 *  - 挑战节点（CHALLENGE_NODES）的 desc 写在 id 的下一行，按行扫描抓不到
 *  - challengeEffects / rewards 里的 desc 是嵌在对象里的字段，节点行里没有
 *  - 「Change your name」是三元表达式里赋值的字面量，不属于任何结构化字段
 * ========================================================================== */

window.__I18N_DICTS__ = window.__I18N_DICTS__ || {};
window.__I18N_DICTS__['zh-CN'] = Object.assign(window.__I18N_DICTS__['zh-CN'] || {}, {

    /* ---- 改名弹窗 ---- */
    "Change your name": "修改昵称",

    /* ---- 挑战节点的描述（青色挑战 I–VIII）---- */
    "No nerfs! Reward: x1.1 cyan per level": "没有削弱！奖励：每级青色 x1.1",
    "/lvl^lvl cyan. Reward: x2 cyan per level": "青色 /lvl^lvl。奖励：每级青色 x2",
    "generates anticyan which deboosts cyan. x10 req. and more anticyan gen based on challenge lvl. Reward: x2 cyan per level": "产出反青，反青会削弱青色。需求 x10，反青产出随挑战等级提升。奖励：每级青色 x2",
    "generate anticyan at a fixed rate based on challenge level. cyan generation stops when anticyan is above cyan. Reward: x2 cyan per level": "按挑战等级以固定速率产出反青。反青高于青色时，青色停止产出。奖励：每级青色 x2",
    "/1e12 cyan and /10 more per level. Reward: x2.5 cyan per level": "青色 /1e12，每级再 /10。奖励：每级青色 x2.5",
    "[first levels are easy!] gen anticyan at 1/s. if anticyan > 1 cyan gen stops. Reward: x2.5 cyan per level": "［前几级很轻松！］每秒产出 1 反青。反青 > 1 时青色停止产出。奖励：每级青色 x2.5",
    "big nerf to cyan that gets better quite a bit over time based on anticyan [its good this time!]. Reward: x5 cyan per level": "对青色的大幅削弱，会随反青随时间明显好转［这次是好事！］。奖励：每级青色 x5",

    /* ---- 重置节点的描述 ---- */
    "Wipes all non-bonus uni 1 node levels & currencies and essence. Bonus plates excepted.": "清空所有非加成型宇宙 I 节点等级、货币与精华。加成底板除外。",

    /* ---- 天气节点名 ---- */
    "How's the weather?": "天气如何？",

    /* ---- 效果条目（挑战减益 / 奖励），上游渲染成「描述 (xN)」---- */
    "cyan deboost": "青色削弱",
    "cyan nerf": "青色大幅削弱",
    "anticyan generation": "反青产出",
    "x1.1 cyan per completion": "每次完成青色 x1.1",
    "x2 cyan per completion": "每次完成青色 x2",
    "x2.5 cyan per completion": "每次完成青色 x2.5",
    "x5 cyan per completion": "每次完成青色 x5",

});
