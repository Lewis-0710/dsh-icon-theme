#!/bin/bash
set -e

# ==============================================================================
# sync.sh - dsh-icon-theme 同步与定制补丁维护脚本 (Patch-First, Smart-Merge)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

REPO_NAME="$(basename "$SCRIPT_DIR")"
PATCH_FILE="$SCRIPT_DIR/sync.patch"

AUTO_YES=false
SKIP_TEST=false

for arg in "$@"; do
    case "$arg" in
        -y|--yes) AUTO_YES=true ;;
        --skip-test) SKIP_TEST=true ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -y, --yes      非交互模式，自动确认推送"
            echo "  --skip-test    跳过 npm test 验证"
            echo "  -h, --help     显示帮助信息"
            exit 0
            ;;
    esac
done

echo "=================================================="
echo "  同步 $REPO_NAME (Patch-First, Smart-Merge)"
echo "=================================================="

# 检查 git remote
if ! git remote get-url upstream >/dev/null 2>&1; then
    echo "❌ 错误: 未配置 upstream 远程仓库。"
    echo "💡 请先运行: git remote add upstream https://github.com/yzke/dsh-icon-theme.git"
    exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    echo "❌ 错误: 未配置 origin 远程仓库。"
    exit 1
fi

# Step 0: 创建安全临时备份目录
TMP_DIR="$(mktemp -d /tmp/dsh_icon_theme_sync_XXXXXX)"
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

if [ -f "$PATCH_FILE" ]; then
    cp "$PATCH_FILE" "$TMP_DIR/sync.patch"
fi
if [ -f "$SCRIPT_DIR/sync.sh" ]; then
    cp "$SCRIPT_DIR/sync.sh" "$TMP_DIR/sync.sh"
fi

# Step 1: 拉取上游与远端最新提交
echo "[1/4] 拉取 upstream 与 origin 最新提交..."
git fetch upstream --tags
git fetch origin

# 暂存本地未提交的修改（如果有）
STASHED=false
if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "📦 检测到工作区未提交修改，正在暂存..."
    git stash push -u -m "sync.sh-auto-stash-$(date +%s)" 2>/dev/null || true
    STASHED=true
fi

# Step 2: 更新 main 分支到 upstream/main
echo "[2/4] 更新 local main 分支到 upstream/main..."
if git show-ref --verify --quiet refs/heads/main; then
    git branch -f main upstream/main
else
    git branch main upstream/main
fi

# Step 3: 应用同步策略
echo "[3/4] 应用定制修改..."
APPLIED_VIA_PATCH=false

if [ -s "$TMP_DIR/sync.patch" ]; then
    echo "   正在测试 Patch 是否适用于最新 upstream/main..."
    git checkout main --quiet
    if git apply --check "$TMP_DIR/sync.patch" 2>/dev/null; then
        echo "   ✅ Patch 校验通过，应用干净线性历史（策略 1）..."
        git checkout -B custom main --quiet
        git apply "$TMP_DIR/sync.patch"
        cp "$TMP_DIR/sync.sh" "$SCRIPT_DIR/sync.sh"
        chmod +x "$SCRIPT_DIR/sync.sh"
        git add -A
        git commit -m "sync: 与 upstream/main 同步 ($(date +%Y-%m-%d))" --quiet || true
        APPLIED_VIA_PATCH=true
        echo "   ✅ 策略 1 应用成功"
    else
        echo "   ⚠️  Patch 与上游存在变动冲突，切换到 Smart Merge（策略 2）..."
    fi
fi

if [ "$APPLIED_VIA_PATCH" = false ]; then
    git checkout custom --quiet
    cp "$TMP_DIR/sync.sh" "$SCRIPT_DIR/sync.sh"
    chmod +x "$SCRIPT_DIR/sync.sh"

    echo "   执行 Smart Merge..."
    git merge main --no-commit --no-ff 2>/dev/null || true
    CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || true)

    if [ -z "$CONFLICTS" ]; then
        git add -A
        git commit -m "merge: 合并 upstream/main ($(date +%Y-%m-%d))" --quiet 2>/dev/null || true
    else
        for f in $CONFLICTS; do
            case "$f" in
                README*|readme*)
                    echo "   📄 $f: 保留本地 Fork 头部说明 + 结合上游内容"
                    FORK_HEADER=$(awk '/^> \[!NOTE\]/{p=1} p{print} /^$/{if(p)exit}' "$f" 2>/dev/null || true)
                    if [ -n "$FORK_HEADER" ]; then
                        git show "upstream/main:$f" > "$f.upstream"
                        printf '%s\n\n' "$FORK_HEADER" > "$f.header"
                        cat "$f.header" "$f.upstream" > "$f"
                        rm -f "$f.upstream" "$f.header"
                        echo "      ✅ Fork 说明已保留，正文已同步上游版本"
                    else
                        git checkout upstream/main -- "$f"
                        echo "      ✅ 未检测到 Fork 说明，恢复为上游版本"
                    fi
                    git add "$f"
                    ;;
                *)
                    echo "   📄 $f: 代码冲突，采用本地定制版本（--ours）"
                    git checkout --ours "$f"
                    git add "$f"
                    ;;
            esac
        done

        git add -A
        git commit -m "merge: 智能合并 upstream/main ($(date +%Y-%m-%d))" --quiet 2>/dev/null || true
        echo "   ✅ Smart Merge 完成"
    fi
fi

# 恢复此前暂存的工作区改动
if [ "$STASHED" = true ]; then
    echo "📦 恢复此前暂存的工作区改动..."
    git stash pop --quiet 2>/dev/null || true
fi

# Step 4: 重新生成干净的 sync.patch（排除 sync.patch、sync.sh 以及 pnpm-lock.yaml）
echo "[4/4] 重新生成干净的 sync.patch..."
git diff upstream/main...custom -- . ':!sync.patch' ':!sync.sh' ':!pnpm-lock.yaml' > "$PATCH_FILE"
PATCH_LINES=$(wc -l < "$PATCH_FILE" | tr -d ' ')
echo "✅ sync.patch 生成完毕 (共 $PATCH_LINES 行，已排除同步脚本与快照自身)"

# 确保 sync.sh 和 sync.patch 都被暂存并提交
git add sync.patch sync.sh

if ! git diff --cached --quiet; then
    git commit -m "chore: 更新 sync.patch 与 sync.sh 快照 ($(date +%Y-%m-%d))" --quiet || true
fi

# 自动测试与检查
if [ "$SKIP_TEST" = false ]; then
    if command -v npm >/dev/null 2>&1; then
        echo ""
        echo "🔍 正在运行项目测试与构建验证..."
        if npm test; then
            echo "✅ 测试验证全部通过！"
        else
            echo "❌ 警告: 测试失败，请检查代码！"
        fi
    fi
fi

# 推送到 origin/custom
echo ""
DO_PUSH=false
if [ "$AUTO_YES" = true ]; then
    DO_PUSH=true
elif [ -t 0 ]; then
    read -p "是否推送到 origin/custom? [y/N] " -n 1 -r < /dev/tty
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DO_PUSH=true
    fi
fi

if [ "$DO_PUSH" = true ]; then
    echo "🚀 正在推送到 origin/custom..."
    if [ "$APPLIED_VIA_PATCH" = true ]; then
        git push --force-with-lease origin custom
    else
        git push origin custom
    fi
    echo "✅ 已成功推送到 origin/custom"
else
    echo "ℹ️  跳过远程推送（可稍后手动执行 git push origin custom）"
fi

echo "🎉 $REPO_NAME 同步流程全部完成！"
