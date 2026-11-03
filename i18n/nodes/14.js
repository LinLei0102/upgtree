/* ============================================================================
 * 分片 14 —— 系统提示（toast / showToast）
 *
 * 这一层之前整块漏翻：文案写在 `showToast('...')` 的模板字符串里，
 * 既不在节点数据中，也不在静态 HTML 标记里，提取器扫不到。
 * 键含 emoji 前缀（引擎只裁空白，不裁 emoji），行尾空格由引擎自动保留。
 * 带 ${} 拼接的见 zh-CN.js 的 __I18N_RULES__。
 * ========================================================================== */

window.__I18N_DICTS__ = window.__I18N_DICTS__ || {};
window.__I18N_DICTS__['zh-CN'] = Object.assign(window.__I18N_DICTS__['zh-CN'] || {}, {

    /* ---- 存档 / 数据 ---- */
    "All data wiped.": "所有数据已清空。",
    "Save exported!": "存档已导出！",
    "✅ Save imported successfully!": "✅ 存档导入成功！",
    "❌ Invalid save file:": "❌ 存档文件无效：",
    "⚠️ Save restored from backup (refresh should be clean now)": "⚠️ 已从备份恢复存档（刷新后应恢复正常）",

    /* ---- 传送点 ---- */
    "Teleport spot added!": "传送点已添加！",
    "Teleport spot deleted": "传送点已删除",
    "⚠️ Already have a spot at this position": "⚠️ 此处已有传送点",

    /* ---- 挑战 ---- */
    "⚠️ Already in a challenge!": "⚠️ 已在挑战中！",
    "⚠️ Already in another challenge!": "⚠️ 已在另一项挑战中！",
    "⚠️ Already in another challenge! Leave it first.": "⚠️ 已在另一项挑战中！请先退出。",
    "⚠️ Challenge already at max completions!": "⚠️ 该挑战的完成次数已达上限！",
    "⚠️ Challenge not unlocked!": "⚠️ 该挑战尚未解锁！",

});
