#!/bin/bash
# telenexus-ghost-grid: Autonomous Evolution Cycle
# v1.0.0 | Pure Vanilla Sovereignty

# 確保在正確的目錄執行
cd "$(dirname "$0")/.." || exit 1

VERSION="v$(date +%y.%m%d.%H%M)"
echo "--- 👻 Ghost Grid 演化開始 ($VERSION) ---"

# 1. 環境預檢
if [ ! -d ".git" ]; then echo "錯誤：未偵測到 Git 基礎。"; exit 1; fi

# 2. 技術對焦 (階段二：基礎設施預檢已由 AI 注入 game.js)
echo "[Step 2] 執行代碼精進與規範對齊..."

# 3. 性能與資源回收
echo "[Step 3] 執行系統資源清理..."
if [ -f "/app/workspace/.gemini/skills/system-cleanup/scripts/cleanup.sh" ]; then
    bash /app/workspace/.gemini/skills/system-cleanup/scripts/cleanup.sh
else
    echo "跳過系統清理（腳本不存在）。"
fi

# 4. 主權同步
echo "[Step 4] 執行 Git 存封..."
git add .
git commit -m "auto: ghost grid evolution cycle $VERSION (Stage 2 Infrastructure Pre-check)"
git tag $VERSION
git push origin main --tags

echo "--- 👻 演化任務完成 ---"
