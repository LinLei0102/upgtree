#!/usr/bin/env bash
# 同步上游 → 重建 zh.html → 列出新增的待译词条
# 用法: bash sync-upstream.sh
set -euo pipefail
cd "$(dirname "$0")"

# 优先用 upstream 远端（如果你把仓库 fork 了），否则用 origin
REMOTE=""
if git remote get-url upstream >/dev/null 2>&1; then
  REMOTE="upstream"
elif git remote get-url origin >/dev/null 2>&1; then
  REMOTE="origin"
else
  echo "✗ 没有配置任何 git 远端"; exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "→ 从 $REMOTE/$BRANCH 同步"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "! 工作区有未提交改动，已自动 stash（同步后可用 git stash pop 取回）"
fi

git pull --rebase --autostash "$REMOTE" "$BRANCH"

echo
echo "→ 重建产物（发布版 zh.html + 本地版 zh-offline.html）"
if [ ! -f vendor/tailwind.js ] || [ ! -f vendor/lucide.js ] || [ ! -f vendor/fira-code.css ]; then
  echo "! vendor/ 不完整，本次只生成发布版 zh.html（走 CDN）"
  echo "  需要本地离线版再跑：node tools/vendor-assets.mjs"
fi
node tools/build-zh.mjs

echo
echo "→ 统计待译词条"
node tools/extract-strings.mjs

cat <<'EOF'

提示：上游改过的文案会自动回落英文显示，不会报错也不会冲突。
补词条只需在 i18n/nodes/ 里加一行，或把 tools/_todo.json 里的条目发给我。
提交时只需带上 zh.html + i18n/ + tools/，vendor/ 与 zh-offline.html 已被 gitignore。
EOF
