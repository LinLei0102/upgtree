/* 词条 part 13 — 补漏：无限底板首行 I01-I08
 * 这 8 个节点在源码里带前置属性（`{ bulkFinalCost: true, id: 'I01', ... }`），
 * 旧版提取器要求 `{ id:` 开头，整条被跳过。提取器已修，规则改为「行内有 id: 即可」。
 */
Object.assign(window.__I18N_DICTS__['zh-CN'], {

    "Gain 0.01∞/s/level": "每级 +0.01∞/秒",
    "Multiplier": "倍数",
    "x(lvl)^2∞/s": "∞/秒 x(lvl)^2",
    "Linear": "线性",
    "x∞/s based on level": "按等级 x∞/秒",
    "Sub-linear?": "亚线性？",
    "x∞/s based on level.": "按等级 x∞/秒。",
    "x3∞/s per level.": "每级 x3∞/秒。",
    "Divide I01s cost per level.": "每级降低 I01 的成本。",
    "Fuel": "燃料",
    "Infinity boost itself, softcapped ~50.": "无限自我增幅，约 50 处软上限。",
    "Expander": "扩展器",
    "Unlock new content below. Also +1% infinity per level": "解锁下方新内容。每级无限 +1%。",

    /* ==== display 效果里单独出现的整句（会拼在节点下方的效果摘要里）==== */
    "Time: Day": "时间：白天",
    "Time: Dusk": "时间：黄昏",
    "Time: Night": "时间：夜晚",
    "Time: Dawn": "时间：黎明",
    "Unlock weather baseplate (WIP)": "解锁天气底板（开发中）",
    "Go outside to see the weather": "出门看看天气",
    "Open a weather forecast app lol": "先开个天气 App 看看吧 lol",
    "another -": "另一个 -",
    "apology accepted": "接受道歉",
    "never forgive": "永不原谅",
    "yay!": "耶！",
    "yes! its now 10": "对！现在是 10",
    "get: ": "获得：",
    "<- new content": "← 新内容",
    "WIP": "开发中",

});
