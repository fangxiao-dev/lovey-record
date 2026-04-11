#!/bin/bash
# 扫描孤立文档 - 列出 docs/ 下无法从入口点到达的文件
# 用法: bash docs/scripts/scan-orphans.sh

set -e

ENTRYPOINTS=(
    "AGENTS.md"
    "README.md"
    "project-context.md"
    "docs/README.md"
    "docs/contracts/README.md"
    "backend/AGENTS.md"
    "frontend/AGENTS.md"
)

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "🔍 扫描孤立文档"
echo "=================="
echo ""
echo "入口点:"
for ep in "${ENTRYPOINTS[@]}"; do
    if [ -f "$ep" ]; then
        echo "  ✓ $ep"
    else
        echo "  ✗ $ep (不存在)"
    fi
done
echo ""

# 收集所有可达文件
REACHABLE=$(mktemp)
VISITED=$(mktemp)

# 递归函数：从文件中提取所有链接
extract_links() {
    local file="$1"
    local dir=$(dirname "$file")

    if [ -f "$file" ]; then
        # 提取 Markdown 链接 [text](path)
        grep -oE '\]\([^)]+\)' "$file" | sed 's/^\]\(//; s/)$//' >> "$REACHABLE"

        # 提取 HTML 标签 <path>
        grep -oE '<[^>]+\.(md|pen)>' "$file" | sed 's/^<//; s/>$//' >> "$REACHABLE"
    fi
}

# 处理入口点
for ep in "${ENTRYPOINTS[@]}"; do
    if [ -f "$ep" ]; then
        extract_links "$ep"
    fi
done

# 规范化路径（相对路径转绝对、去重）
sort -u "$REACHABLE" | while read path; do
    if [ -n "$path" ]; then
        # 移除 query 参数和 fragments
        path=$(echo "$path" | cut -d'#' -f1 | cut -d'?' -f1)

        # 跳过外部链接
        if [[ "$path" == http* ]]; then
            continue
        fi

        # 移除开头的 /
        path=$(echo "$path" | sed 's|^/||')

        echo "$path"
    fi
done | sort -u > "$REACHABLE.normalized"

# 找孤立文档
echo "📄 可达文档数量: $(wc -l < "$REACHABLE.normalized")"
echo ""
echo "🚨 孤立文档（docs/ 下无法到达的）:"
echo "======================================"

ORPHAN_COUNT=0
while IFS= read -r file; do
    # 检查是否在 reachable 列表中
    basename_file=$(basename "$file")

    if ! grep -q "$(echo "$file" | sed 's|^docs/||')" "$REACHABLE.normalized" 2>/dev/null && \
       ! grep -q "$basename_file" "$REACHABLE.normalized" 2>/dev/null; then
        echo "  • $file"
        ((ORPHAN_COUNT++))
    fi
done < <(find docs -type f \( -name "*.md" -o -name "*.pen" \) | sort)

echo ""
if [ "$ORPHAN_COUNT" -eq 0 ]; then
    echo "✅ 没有孤立文档!"
else
    echo "⚠️  发现 $ORPHAN_COUNT 个孤立文档"
fi

rm "$REACHABLE" "$REACHABLE.normalized"
