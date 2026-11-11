/*!
 * upgtree 简体中文词典
 * ---------------------------------------------------------------
 * 键 = 英文原文（取自 index.html），值 = 中文。
 * 规则：
 *   1. 一条一行，便于 tools/extract-strings.mjs 比对缺漏、便于 git diff 阅读。
 *   2. 键里可用 # 代表"任意数字"，运行时会被原样填回，例如 "Rate: +#/s"。
 *   3. 上游改文案 → 键失配 → 自动回落英文，不会报错。用
 *        node tools/extract-strings.mjs
 *      即可列出所有待补的词条。
 * ---------------------------------------------------------------
 */
window.__I18N_DICTS__ = window.__I18N_DICTS__ || {};
window.__I18N_DICTS__['zh-CN'] = {

    /* ================= 页面 / 标题 ================= */
    "Upgrade Land": "递升之地",

    /* ================= 左下 HUD ================= */
    "SFX: ON": "音效：开",
    "SFX: OFF": "音效：关",
    "Stop": "暂停",
    "Continue": "继续",
    "Scroll: ON": "滚动：开",
    "Scroll: OFF": "滚动：关",
    "Toggle scroll lock on currency bar": "切换货币栏滚动锁定",

    /* ================= 设置：视图与镜头 ================= */
    "View & Camera": "视图与镜头",
    "ZOOM": "缩放",
    "FONT SIZE": "字号",
    "Recenter Cam": "视角归位",
    "EFFECTS: ON": "特效：开",
    "EFFECTS: OFF": "特效：关",

    /* ================= 设置：购买与记数 ================= */
    "Buy Mode & Notation": "购买与记数",
    "BUY: x1": "购买：x1",
    "NOTATION": "记数法",
    "Standard": "标准",
    "Sci e9": "科学 e9",
    "Sci e6": "科学 e6",
    "Sci e3": "科学 e3",
    "Sci e0": "科学 e0",
    "Long": "长名",
    "letter": "字母",
    "stubid": "搞怪",

    /* ================= 设置：快捷键 ================= */
    "Hotkeys": "快捷键",
    "(click to rebind)": "（点击可改键）",
    "Buy x1": "购买 x1",
    "Buy x5": "购买 x5",
    "Buy x10": "购买 x10",
    "Buy MAX": "购买上限",
    "Click a key, then press a new key to rebind. Duplicates are auto-resolved.": "点击一个按键，再按下新键即可改绑；重复绑定会自动处理。",
    "Camera Teleport Spots": "镜头传送点",
    "(click key to teleport, rename, or delete)": "（点按键传送，可重命名或删除）",
    "Add current camera position": "添加当前镜头位置",

    /* ================= 设置：货币 / 新闻 ================= */
    "Currencies": "货币",
    "Currency Order": "货币顺序",
    "(eye to hide, arrows to reorder)": "（眼睛图标隐藏，箭头调整顺序）",
    "News Ticker": "新闻栏",
    "NEWS: ON": "新闻：开",
    "NEWS: OFF": "新闻：关",
    "AUTO-ADD": "自动追加",
    "SCROLL SPEED": "滚动速度",
    "DUPLICATE PREVENTION": "去重条数",
    "NEW WEIGHT": "新消息权重",

    /* ================= 设置：存档 ================= */
    "Save & Data": "存档与数据",
    "NAME": "昵称",
    "Change": "修改",
    "Export Save": "导出存档",
    "Import Save": "导入存档",
    "(refresh page afterwards)": "（之后请刷新页面）",
    "Wipe Save": "清除存档",
    "Enter your name...": "输入你的昵称…",
    "No teleport spots saved. Use the button below!": "还没有保存的传送点，用下面的按钮添加！",
    "⚠️ Init error — data saved, refresh may help": "⚠️ 初始化出错 —— 数据已保存，刷新可能有用",

    /* ================= 重置 / 弹窗 ================= */
    "Execute Reset Layer": "执行重置层",
    "Resetting will wipe lower tier node levels to grant prestige currency!": "重置会清空低层级节点的等级，换取声望货币！",
    "Gain:": "获得：",
    "Resetting Nodes:": "将重置节点：",
    "All tier nodes": "全部同层节点",
    "Resetting Currencies:": "将重置货币：",
    "None": "无",
    "do not show again": "不再显示",
    "CANCEL": "取消",
    "CONFIRM RESET": "确认重置",
    "Wipe All Save Progress?": "清除全部存档进度？",
    "This action is completely permanent. All currencies and node levels will be reset to zero.": "此操作完全不可撤销，所有货币与节点等级都会归零。",
    "WIPE EVERYTHING": "全部清除",

    /* ================= 首次进入 ================= */
    "Welcome to upgrade land!": "欢迎来到递升之地！",
    "Before you begin, what name shall you go by?": "开始之前，你想用什么昵称？",
    "This will be used for offline progress greetings and discord notifs.": "该昵称会用于离线收益问候和 Discord 通知。",
    "Name must be 2–28 characters.": "昵称需为 2–28 个字符。",
    "SET NAME": "设定昵称",
    "Welcome Back!": "欢迎回来！",
    "Welcome Back,": "欢迎回来，",
    "COLLECT": "收取",

    /* ================= canvas 上的零散标签 ================= */
    "DONE": "完成",
    "ENTER": "进入",
    "LEAVE": "离开",
    "RESET": "重置",
    "MAX": "满级",
    "Rew: x": "奖励：x",

    /* ================= 动态文案（# 代表数字）================= */
    "Rate: +#/s": "速率：+#/秒",
    "+# Currency": "+# 货币",
    "BUY: x#": "购买：x#",
    "# messages available": "共 # 条消息",
    "(# new, # in cooldown)": "（# 新，# 冷却中）",
    "Unlock condition not met": "未满足解锁条件",

    /* ================= 新闻分组名 ================= */
    "Tips": "提示",
    "General": "综合",
    "Community": "社区",
    "Progression": "进度",
    "Automation": "自动化",
    "Jokes": "冷笑话",
    "Late Game": "后期",

    /* ================= 节点：奖励底板 ================= */
    "Bonus": "奖励",
    "Bonus!!": "奖励！！",
    "+Unlock Bonus Basepate.": "解锁奖励底板。",

    /* ================= 货币名 ================= */
    "Points": "点数",
    "Research": "研究",
    "Prestige": "声望",
    "Ascension": "飞升",
    "Dim-1": "维度-1",
    "Dim-2": "维度-2",
    "Dim-3": "维度-3",
    "Dim-4": "维度-4",
    "Dim-5": "维度-5",
    "Dim-6": "维度-6",
    "Dim-7": "维度-7",
    "Dim-8": "维度-8",
    "Grass": "草",
    "Dirt": "泥土",
    "Stone": "石头",
    "Copper": "铜",
    "Silver": "银",
    "Topaz": "黄玉",
    "Lapis": "青金石",
    "Diamonds": "钻石",
    "Netherite": "下界合金",
    "Fragment": "碎片",
    "Essence": "精华",
    "Dim-Essence": "维度精华",
    "Plates": "板块",
    "Progression score": "进度分",
    "Tree mass": "树质量",
    "Additions": "加法",
    "Multiplications": "乘法",
    "Experience": "经验",
    "Levels": "等级",
    "Cookie": "曲奇",
    "Tokens": "代币",
    "Chips": "筹码",
    "Money": "金钱",
    "Customers": "顾客",
    "Fame": "名气",
    "Stars": "星星",
    "Water": "水",
    "Sunlight": "阳光",
    "Sunpower": "太阳之力",
    "Golden cookie": "金色曲奇",
    "Cash": "现金",
    "Quantum Tokens": "量子代币",
    "Tachyon": "快子",
    "Decoration power": "装饰之力",
    "Infinities": "无限",
    "Infinity fragments": "无限碎片",
    "Energy": "能量",
    "Black": "黑",
    "Red": "红",
    "Crimson": "猩红",
    "Firebrick": "火砖红",
    "Maroon": "栗红",
    "Burgundy": "勃根第红",
    "Yellow": "黄",
    "Gold": "金",
    "Blue": "蓝",
    "Power": "力量",
    "power2": "力量2",
    "Gray": "灰",
    "Cyan": "青",
    "Anticyan": "反青",
    "Orange": "橙",
    "Green": "绿",
    "Antigreen": "反绿",
    "Purple": "紫",
    "White": "白",
    "Frogs": "青蛙",
    "Euros": "欧元",
    "bits": "比特",
    "bools": "布尔",
    "chars": "字符",
    "shorts": "短整型",
    "ints": "整型",
    "longs": "长整型",
    "long longs": "特长整型",
    "Clocktime": "时钟",
    "Lux": "勒克斯",
    "Nox": "诺克斯",
    "Void": "虚空",
    "Wet weather": "雨天",
    "Solar weather": "晴天",
    "Breezy weather": "大风天",
    "Foggy weather": "雾天",

    /* ================= 天气类型名（Weather.getWeather() 运行时显示）================= */
    "Sunny": "晴天",
    "Cloudy": "多云",
    "Rainy": "雨天",
    "Windy": "大风",
    "Thunderstorm": "雷暴",
    "Blizzard": "暴雪",
    "Mist": "薄雾",
    "Heatwave": "热浪",
    "Sandstorm": "沙暴",
    "Hail": "冰雹",
    "Smog": "雾霾",
    "Drought": "干旱",

    /* ================= 节点：挑战 ================= */
    "Cyan Challenge I": "青色挑战 I",
    "Cyan Challenge II": "青色挑战 II",
    "Cyan Challenge III": "青色挑战 III",
    "Cyan Challenge IV": "青色挑战 IV",
    "Cyan Challenge V": "青色挑战 V",
    "Cyan Challenge VI": "青色挑战 VI",
    "Cyan Challenge VII": "青色挑战 VII",
    "Cyan Challenge VIII": "青色挑战 VIII",

    /* ================= 节点：点数层 ================= */
    "The start. You can pan the screen! There is buy max in the settings.": "起点。画面可以拖动！设置里有「购买上限」。",
    "Begin. [if nothing appears please refresh the page]": "开始。[如果什么都不显示，请刷新页面]",
    "Start": "开始",
    "Another Beginning": "又一个起点",
    "+1 Base point/s.": "基础点数 +1/秒。",
    "A bigger increase": "更大的增长",
    "+2p/s": "点数 +2/秒",
    "Multipliers": "乘数",
    "x2 p/s.": "点数 x2。",
    "More points": "更多点数",
    "+1 p/s per level.": "每级点数 +1/秒。",
    "More mult": "更多倍数",
    "x1.1 p/s per level.": "每级点数 x1.1。",
    "Point boost": "点数增幅",
    "+5% p/s per level additive.": "每级点数 +5%（加法叠加）。",
    "Another mult": "又一个倍数",
    "x2.5 p/s.": "点数 x2.5。",
    "Unlock research (on top of #1)": "解锁研究（在 #1 之上）",
    "Self-boost": "自我增幅",
    "Points boost itself. p^0.08": "点数增幅自身：p^0.08",
    "Uncapped": "突破上限",
    "#4 cap +5/level": "#4 的等级上限 +5/级",
    "Many": "很多",
    "x1.03 p/s per level.": "每级点数 x1.03。",
    "yes!": "好耶！",
    "x1.25 resc/lvl.": "每级研究 x1.25。",
    "woah!": "哇哦！",
    "increase max.lvl to #6 per level.": "每级为 #6 提升等级上限。",
    "this too": "这个也是",
    "+50% energy per level": "每级能量 +50%",
    "Reversed": "反转",
    "Unspent resc boost points.": "未花费的研究会增幅点数。",
    "Infinite": "无限",
    "+2% points additive/lvl. There is no max.": "每级点数 +2%（加法）。没有上限。",
    "Uncapped^2": "突破上限²",
    "#10 cap +5/lvl.": "#10 的等级上限 +5/级。",
    "Simplify": "简化",
    "x3 points.": "点数 x3。",
    "Hi!": "嗨！",
    "Boost decoration power by x10/lvl.": "装饰之力每级 x10。",
    "Twenty!": "二十！",
    "Boost resc generate rate by x1.25/lvl.": "研究产出速率每级 x1.25。",
    "Expanded again...": "又扩展了……",
    "+2% prestige per level.": "每级声望 +2%。",
    "did you know there is a new upgrade in the original baseplates corner": "你知道吗，原始底座角落还有一个新升级",
    "Double energy per level.": "每级能量翻倍。",
    "reverse boost": "反向增幅",
    "Boost points, but gets weaker with more points, stronger with more levels. [max20min1]": "增幅点数，但点数越多效果越弱、等级越高效果越强。[上限 20，下限 1]",
    "Straight to the point": "直入正题",
    "x5 points.": "点数 x5。",
    "Bonus boost.": "额外增幅。",
    "x1.1 cash, infinity, alpha per level.": "现金、无限、Alpha 每级 x1.1。",
    "alternating": "交替",
    "x2 points is upg amt is odd, x1.1 points per level": "升级数为奇数时点数 x2，每级点数 x1.1",
    "level more!": "再升几级！",
    "2 extra levels to #03, but higher cost": "#03 额外 +2 级，但成本更高",
    "what": "啥",
    "20x manual reset research gain (i.e x20 resc and x0.05 rate)": "手动重置的研究收益 x20（即研究 x20、速率 x0.05）",
    "prestige?": "声望？",
    "double prestige": "声望翻倍",
    "wow its math": "哇，是数学",
    "Boost points based on how many times this upgrades level can divide by 2": "按该升级等级能被 2 整除的次数增幅点数",
    "wait what": "等等，啥",
    "Unlock a way to convert rescarch into more points.": "解锁把研究转换为更多点数的途径。",
    "Convert resc to points! (based on resc/(resc/s) and point/s)": "把研究转换成点数！（基于 研究/(研究/秒) 与 点数/秒）",
    "time warp": "时间扭曲",
    "oh yes": "噢耶",
    "Double time warp point gain.": "时间扭曲的点数收益翻倍。",

};

/* 正则规则：处理运行时拼接、无法用固定键覆盖的文案 */
/* 正则规则：处理运行时拼接、无法用固定键覆盖的文案
 * 第二条可以是字符串（支持 $1）或函数（收到 match 数组，可对分段再加工） */

// 离线时长："1 seconds" / "3m 20s" → 中文
function _cnDuration(s) {
    return String(s)
        .replace(/^(\d+) seconds$/, '$1 秒')
        .replace(/^(\d+)m (\d+)s$/, '$1 分 $2 秒');
}

// 快捷键动作 id → 设置面板上显示的名字（提示里上游只给 id）
function _hkAction(id) {    return ({
        buy1: '购买 x1',
        buy5: '购买 x5',
        buy10: '购买 x10',
        buyMax: '购买 MAX'
    })[id] || id;
}

// 颜色类货币在货币栏用单字（青 / 灰 / 橙），写进摘要时补「色」
var _CN_COLOR = {
    cyan: 1, gray: 1, grey: 1, orange: 1, green: 1, purple: 1,
    white: 1, black: 1, red: 1, yellow: 1, blue: 1, pink: 1, brown: 1
};

// 天气类型名 → 中文（Weather.getWeather().Curr/Next 运行时显示，效果摘要里单独出现）
var _CN_WEATHER = {
    Sunny: '晴天', Cloudy: '多云', Rainy: '雨天', Windy: '大风',
    Thunderstorm: '雷暴', Blizzard: '暴雪', Mist: '薄雾', Heatwave: '热浪',
    Sandstorm: '沙暴', Hail: '冰雹', Smog: '雾霾', Drought: '干旱'
};

window.__I18N_RULES__ = [
    [/^EXECUTE (.+)$/, '执行 $1'],    [/^Buy x(\d+)$/, '购买 x$1'],
    [/^BUY: (.+)$/, '购买：$1'],
    [/^Level (\d+)$/, '等级 $1'],
    // 纯中文标签 + 半角冒号（上游模板 `${name}:`）→ 全角冒号
    [/^([\u4e00-\u9fa5、（）·]+):$/, '$1：'],
    // 货币栏的重置预估：(+2.25 on reset)
    [/^\(\+(.+) on reset\)$/, '（重置 +$1）'],
    // 速率：数值可能带 K/M/B 等后缀（+1.16K/s），词典的 # 只吃纯数字，所以用正则兜住
    [/^Rate: \+(.+)\/s$/, '速率：+$1/秒'],
    // 装饰底板信息节点：Amount: +0¤, Rate: +0/s
    [/^Amount: \+(.+?), Rate: \+(.+)\/s$/, '数量：+$1，速率：+$2/秒'],
    [/^\+([^\s]+) Currency$/, '+$1 货币'],
    [/^👋 Welcome back, (.+)!$/, '👋 欢迎回来，$1！'],
    // 货币栏眼睛按钮的提示：`${name} is now visible` / `${name} hidden`
    // name 是货币显示名（e8、点数…），原样保留；中文名后面不留空格
    [/^(.+?) is now visible$/, function (m) {
        return m[1] + (/[\u4e00-\u9fa5]$/.test(m[1]) ? '已显示' : ' 已显示');
    }],
    [/^(.+?) hidden$/, function (m) {
        return m[1] + (/[\u4e00-\u9fa5]$/.test(m[1]) ? '已隐藏' : ' 已隐藏');
    }],

    /* ---- 系统提示（toast）里的拼接文案 ---- */
    // 快捷键动作在提示里是裸 id（buy1），换成设置面板上显示的名字
    [/^Hotkey set: (.+) → (.+)$/, function (m) {
        return '快捷键已设置：' + m[1] + ' → ' + _hkAction(m[2]);
    }],
    [/^Rebound "(.+?)" → (.+?) \(freed from (.+?)\)$/, function (m) {
        return '已重新绑定「' + m[1] + '」→ ' + _hkAction(m[2]) + '（' + _hkAction(m[3]) + ' 已释放）';
    }],
    [/^Swapped: "(.+?)" → (.+?), "(.+?)" → (.+)$/, function (m) {
        return '已互换：「' + m[1] + '」→ ' + _hkAction(m[2]) + '，「' + m[3] + '」→ ' + _hkAction(m[4]);
    }],
    // 重置提示：`Reset! +10 Cookie` —— targetCurrency 是货币 id，要换成中文名
    [/^Reset! \+([\d.,A-Za-z]+) (.+)$/, function (m) {
        var C = window.__I18N_CURRENCY__ || {};
        var cn = C[String(m[2]).toLowerCase()];
        return '重置！+' + m[1] + ' ' + (cn || m[2]);
    }],
    [/^Reset! \+(.+)$/, '重置！+$1'],
    [/^Teleported to "(.+)"$/, '已传送至「$1」'],
    [/^Entered "(.+?)" challenge!?$/, '已进入挑战「$1」'],
    [/^Left "(.+?)" challenge$/, '已离开挑战「$1」'],
    [/^"(.+?)" completed! \((\d+)\/(\d+)\)$/, '已完成「$1」！($2/$3)'],
    [/^⚠️ Max (.+)$/, '⚠️ 最多 $1'],
    // 效果摘要里的等级上限：`+5 MAX`
    [/^([+\-][\d.,A-Za-z]+) MAX$/, '$1 上限'],
    // 成本标签里数值达上限（Infinity → formatNum 包装成「已达上限」）再拼货币 id：
    // `已达上限 cyan` → `已达上限 青`（单字，与成本标签省宽度一致）
    [/^已达上限 ([A-Za-z][A-Za-z0-9_]{2,})$/, function (m) {
        var C = window.__I18N_CURRENCY__ || {};
        var cn = C[String(m[1]).toLowerCase()];
        if (!cn) return null;
        return '已达上限 ' + cn;
    }],
    // 挑战节点摘要：「Rew: x2 cyan」「x0.5 cyan」「+1 anticyan」——货币名在引擎里再换成中文
    // 只在第三段确实是货币 id 时才处理，避免误伤普通描述
    [/^Rew: x([\d.,A-Za-z?]+) (.+?)( r\/g)?$/, function (m) {
        var C = window.__I18N_CURRENCY__ || {};
        var key = String(m[2]).toLowerCase();
        var cn = C[key];
        if (!cn) return null;
        if (cn.length === 1 && _CN_COLOR[key]) cn += '色';
        return '奖励：' + cn + (m[3] ? ' 重置收益' : '') + ' x' + m[1];
    }],
    /* 效果摘要里的数值 + 货币：`x0.5 cyan`、`+250 Cookie`、`+0 Cookie r/g`
     * 只有第三段确实是货币 id 时才处理，避免误伤普通描述；
     * 货币中文名从引擎的 __I18N_CURRENCY__ 取（id 小写 → 显示名） */
    [/^([x+])([\d.,A-Za-z?]+) ([A-Za-z][A-Za-z0-9_]{1,})( r\/g)?$/, function (m) {
        var C = window.__I18N_CURRENCY__ || {};
        var key = m[3].toLowerCase();
        var cn = C[key];
        if (!cn) return null;
        // 货币栏为了省宽度用单字名（青/灰/橙），摘要里补个「色」更像中文
        if (cn.length === 1 && _CN_COLOR[key]) cn += '色';
        return (m[4] ? '每次重置 ' : '') + m[1] + m[2] + ' ' + cn;
    }],
    // 效果条目的数值后缀：上游拼 `${desc} (x${val})`，中文里换成全角括号
    [/^(.+?) \(x([\d.,]+[A-Za-z]?)\)$/, '$1（x$2）'],
    [
        /^You were offline for (.+?), which gives (.+?)s of offline progress(.*?)\. \(if over 2m, gets softcapped\) While you were gone:$/,
        function (m) {
            var cap = m[3] ? m[3].replace(/^\s*\(capped from (\d+)s\)$/, '（原始 $1 秒）') : '';
            return '你离线了 ' + _cnDuration(m[1]) + '，折算 ' + m[2] + ' 秒的离线收益' + cap +
                '。（超过 2 分钟会软上限）你不在的这段时间：';
        }
    ],

    /* ---- 节点下方的效果摘要 ----
     * display 类型效果返回的英文片段会被 join(', ') 拼成一行画在节点下面，例如：
     *   "Time: Day, +1, +0"  "+5% chance per tick up to 10"  "12 seconds -> /5"  "3s left"
     * 因为是拼接产物，固定词条对不上，只能在这里逐段替换。必须放在规则表最后，避免抢先命中。 */
    [
        /(seconds|% chance|void consumed|max power|max customers|max stars|max boost|Time left|Effect time|s left|luck|cost| raw|AUTO|Time: (?:Day|Dusk|Night|Dawn)|another -|apology accepted|never forgive|yay!|get: |\(WIP\)|<- new content|to min random|to V77s boost|Go outside|Open a weather forecast|->|\d+s\b|\/lvl\b)/,
        function (m) {
            return m.input
                .replace(/^Time: (Day|Dusk|Night|Dawn)/, function (x, k) {
                    return '时间：' + { Day: '白天', Dusk: '黄昏', Night: '夜晚', Dawn: '黎明' }[k];
                })
                .replace(/([+\-]?[\d.,]+[A-Za-z]?)% chance per tick up to ([\d.,]+[A-Za-z]?)/, '每次结算 $1% 概率，最高 $2')
                .replace(/([+\-]?[\d.,]+[A-Za-z]?)% chance/, '$1% 概率')
                .replace(/([+\-]?[\d.,]+[A-Za-z]?)% of void consumed/, '消耗 $1% 虚空')
                // 天气预报（BW02）：「Rainy in 123.45 seconds」→「123.45 秒后雨天」
                .replace(/([A-Za-z]+) in ([\d.,]+[A-Za-z]?) seconds/, function (x, w, n) {
                    return n + ' 秒后' + (_CN_WEATHER[w] || w);
                })
                .replace(/([\d.,]+[A-Za-z]?) seconds -> \//, '$1 秒 → /')
                .replace(/([\d.,]+[A-Za-z]?) seconds/, '$1 秒')
                .replace(/([\d.,]+[A-Za-z]?)s left/, '剩余 $1 秒')
                // CM07：「max boost: 3.5 at 112.5 mana」→「最大增幅：3.5（需 112.5 法力）」
                .replace(/max boost: ([\d.,A-Za-z]+) at ([\d.,A-Za-z]+) ([A-Za-z][A-Za-z0-9_]{2,})/, function (x, cap, need, id) {
                    var C = window.__I18N_CURRENCY__ || {};
                    var cn = C[String(id).toLowerCase()] || id;
                    return '最大增幅：' + cap + '（需 ' + need + ' ' + cn + '）';
                })
                // CMN01/02：「Time left: 4.37s」；CMN03：「Effect time: 0.034s」
                .replace(/Time left: /g, '剩余时间：')
                .replace(/Effect time: /g, '效果时长：')
                .replace(/([+\-]?[\d.,]+[A-Za-z]?) max stars/, '最多 $1 星')
                // 「+200 max power / x1.5 max customers」：小写 max 表示「上限」，货币词交给 remapCurrencyWords 补中文
                .replace(/([+\-x]?[\d.,]+[A-Za-z]?) max (power|customers)\b/g, '$1 $2上限')
                .replace(/([\d.,]+[A-Za-z]?) luck/, '$1 运气')
                .replace(/([\d.,]+[A-Za-z]?) cost/, '$1 成本')
                // CGL23/CGL24 的摘要：「^1.2 -> 1.4 to effect」「base: 2 -> 2.02」
                // 必须在下面把 -> 换成 → 之前处理
                .replace(/^(\S+) -> (\S+) to effect$/, '效果 $1 → $2')
                .replace(/^base: (\S+) -> (\S+)$/, '基础值：$1 → $2')
                .replace(/->/g, '→')
                .replace(/\/lvl\b/g, '/级')
                .replace(/ to min random\(\)/, ' 至随机下限')
                .replace(/ to V77s boost additionally/, '，额外增幅 V77')
                .replace(/Go outside to see the weather/, '出门看看天气')
                .replace(/([+\-][\d.,A-Za-z]+) MAX/g, '$1 上限')
                .replace(/Open a weather forecast app lol/, '先开个天气 App 看看吧 lol')
                // 效果摘要里的单位词：+0 raw（原始产量）、AUTO（自动化）、+0 MAX（等级上限）
                .replace(/([+\-]?[\d.,]+(?:[eE][+\-]?\d+)?[A-Za-z]?) raw\b/g, '$1 原始')
                .replace(/\bAUTO\b/g, '自动')
                .replace(/Unlock weather baseplate \(WIP\)/, '解锁天气底板（开发中）')
                .replace(/<- new content/, '← 新内容')
                .replace(/another -/, '另一个 -')
                .replace(/apology accepted/, '接受道歉')
                .replace(/never forgive/, '永不原谅')
                .replace(/yes! its now 10/, '对！现在是 10')
                .replace(/yay!/, '耶！')
                .replace(/^get: /, '获得：')
                .replace(/\(WIP\)/, '（开发中）')
                .replace(/([\d.,]+(?:[KMBTQ]|Qa|Qi|Sx|Sp|Oc|No|Dc)?)s\b/g, '$1 秒')      // 兜底："30s" / "1.00Ts" → "30 秒"，前面的专有片段已先处理
                .replace(/, /g, '，');                  // 拼接用的半角逗号统一成全角
        }
    ],
];
