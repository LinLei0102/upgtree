/* ============================================================================
 * 分片 16 —— 上游 2026-11 更新新增内容
 *
 * 这一批全是上游新增的板块，之前从未翻过：
 *  - CGR10–16   灰色系扩展（copy、灰灰、多重区间增长…）
 *  - CM01–10    洋红 / 法力板块（新货币 magenta、mana）
 *  - CMN01–03   法力技能
 *  - CY19–25    黄色系扩展（quick、随机数终点…）
 *  - CGL22–25   托帕石扩展
 *  - +BU11      底板 XI（时间墙底板）
 *  - BTW01–07 / BTWGM  欧米伽赌博板块
 *
 * 术语：magenta → 洋红、mana → 法力、Omega 按术语表保留原文（同 Alpha/Beta）
 * ========================================================================== */

window.__I18N_DICTS__ = window.__I18N_DICTS__ || {};
window.__I18N_DICTS__['zh-CN'] = Object.assign(window.__I18N_DICTS__['zh-CN'] || {}, {

    /* ---- 新货币（Omega 与 Alpha/Beta 同属希腊字母货币，保留原文）---- */
    "Magenta": "洋红",
    "Mana": "法力",
    "Omega": "Omega",

    /* ---- 新底板装饰（canvas 大字）---- */
    "Timewall baseplate": "时间墙底板",
    "Magenta baseplate": "洋红底板",
    "Mana baseplate": "法力底板",

    /* ---- CGR10–16：灰色系扩展 ---- */
    "[copy]": "［复制］",
    "generate x1.25 grey per level, extra boost at the start per perchase.": "每级产出 x1.25 灰色，每次购买额外提供开局增幅。",
    "grey grey": "灰灰",
    "x3 grey per level.": "每级灰色 x3。",
    "different terms": "换个说法",
    "+1x grey per (level)^2.": "每 (等级)^2 增加 x1 灰色。",
    "two increases": "双重增长",
    "x1.01 grey per level, +0.01 to base per 10 levels": "每级灰色 x1.01，每 10 级基础值 +0.01",
    "multiple interval increases": "多重区间增长",
    "x2 grey on multiples of 2, 3, 5 [stack]": "等级为 2、3、5 的倍数时灰色 x2［可叠加］",
    "speed up": "加速",
    "x1.5 grey per level": "每级灰色 x1.5",
    "last colour plate": "最后的颜色底板",
    "unlock the final colour plate on the right.": "解锁右侧最后一块颜色底板。",

    /* ---- CM01–10：洋红 / 法力 ---- */
    "magenta": "洋红",
    "generate magenta.": "产出洋红。",
    "magenta factor I": "洋红系数 I",
    "magenta factor II": "洋红系数 II",
    "magenta factor III": "洋红系数 III",
    "boost magenta by +20% additive per level.": "每级洋红 +20% 加算增幅。",
    "mana": "法力",
    "unlock and generate mana.": "解锁并产出法力。",
    "more mana": "更多法力",
    "+0.01 mana/s.": "法力 +0.01/秒。",
    "mana mana": "法力法力",
    "mana slightly boost itself. additional boost cap per level": "法力会小幅增幅自身。每级提高额外增幅上限",
    "do it more makes it better": "做得越多越好",
    "boost mana based on first skill activations": "根据首次技能激活次数增幅法力",
    "need some mana?": "需要点法力吗？",
    "+10 mana on perchase per level [given over 0.2s]. note the cost goes up": "每级购买时法力 +10［0.2 秒内发放］。注意成本会上涨",
    "i mean... why not?": "我是说……为什么不呢？",
    "+1% mana additive per level. note that this costs mana.": "每级法力 +1% 加算。注意这会消耗法力。",

    /* ---- CMN01–03：法力技能 ---- */
    "mana skill I": "法力技能 I",
    "double magenta for 5s. cost increased based on all skills time since last activation, this basiclly goes for most mana skills": "洋红翻倍 5 秒。成本随距上次激活全部技能的时间增加，这基本适用于大多数法力技能",
    "mana skill II": "法力技能 II",
    "1.75x magenta for 15s.": "洋红 x1.75，持续 15 秒。",
    "mana skill III": "法力技能 III",
    "5x magenta [decays]": "洋红 x5［会衰减］",

    /* ---- CY19–25：黄色系扩展 ---- */
    "quick": "快速",
    "yellow boost that grows really quick (softcap is 100000), later level make it grow faster": "增长极快的黄色增幅（软上限 100000），后续等级会让它长得更快",
    "wrong order!": "顺序错了！",
    "x1.5 topaz per level": "每级黄玉 x1.5",
    "strange formula, nice answer": "奇怪的公式，漂亮的答案",
    "+10% yellow per level": "每级黄色 +10%",
    "factor boosting": "系数增幅",
    "x1.25 yellow per level, an additional x1.2 if multiple of 2, x1.3 if mult of 3, x1.5 if mult of 5": "每级黄色 x1.25，等级为 2 的倍数再 x1.2，3 的倍数再 x1.3，5 的倍数再 x1.5",
    "i like yellow": "我喜欢黄色",
    "x2^(sqrt(lvl)) yellow.": "黄色 x2^(√等级)。",
    "what is better than one random number?": "有什么比一个随机数更好？",
    "two. 1/random() yellow per tick again, SQUARED, max 10000": "两个。每次结算再获得 1/随机数 的黄色，结果平方，上限 10000",
    "end of random": "随机的终点",
    "finish yellow. unlock more grey upgrades, x1e5 grey": "给黄色收尾。解锁更多灰色升级，灰色 x1e5",

    /* ---- CGL22–25：托帕石扩展 ---- */
    "x100 yellow.": "黄色 x100。",
    "i heard you need more luck?": "听说你需要更多运气？",
    "+^0.2 to CGL06s effect per level.": "每级 CGL06 效果 +^0.2。",
    "and you can get more per level.": "而且每级还能获得更多。",
    "+0.02 to CY03s base per level.": "每级 CY03 基础值 +0.02。",
    "no not again!!!": "别又来这套！！！",
    "anyways. x10000 yellow that grows over time.": "总之。黄色 x10000，并随时间增长。",

    /* ---- +BU11：底板 XI ---- */
    "Plate XI": "底板 XI",
    "Unlock a timewally baseplate": "解锁一块时间墙底板",

    /* ---- BTW 系列：欧米伽赌博 ---- */
    "good luck...": "祝你好运……",
    "+0.1Ω/s.": "Ω +0.1/秒。",
    "[begin]": "［开始］",
    "+0.01Ω/s/lvl.": "每级 Ω +0.01/秒。",
    "[continue]": "［继续］",
    "+10%Ω/s/lvl.": "每级 Ω +10%/秒。",
    "wait WHAT": "等等什么？！",
    "unlock a way to gain more omega (or lose them). you know what i mean ;)": "解锁一个获得更多 omega（或输掉它们）的方法。你懂我意思 ;)",
    "bet omega...": "赌 omega……",
    "get/lose Ω": "获得/失去 Ω",
    "win rate": "胜率",
    "slightly improve BTWGMs win rate.": "小幅提高 BTWGM 的胜率。",
    "win reward": "胜场奖励",
    "slightly improve BTWGMs win reward.": "小幅提高 BTWGM 的胜场奖励。",
    "omega~": "omega~",
    "+20%Ω/s/lvl.": "每级 Ω +20%/秒。",

    /* ---- 效果摘要里的零散文本（display 类型返回值）---- */
    "on your right": "在你右边",

});
