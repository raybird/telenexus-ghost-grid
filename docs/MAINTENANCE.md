# 🛠️ Maintenance & SOP: Ghost Grid Autonomous Evolution

## 演化機制 (Evolution Mechanism)
本專案採用 **「自驅動演化 (Self-Driven Evolution)」** 模式。
系統會定期執行 `scripts/evolve.sh`，將最新研究發現轉化為實體代碼與文件。

## 標準作業程序 (SOP)

### 1. 任務識別
- 掃描 `docs/ROADMAP.md` 獲取當前階段目標。
- 讀取 `Curiosity Engine` 的最新研究成果。

### 2. 技術開發
- **代碼撰寫**：必須符合 `plainvanillaweb` 的原生開發規範。
- **功能範圍**：每次演化僅針對單一功能點進行硬化，防止系統複雜度失控。

### 3. 環境淨化
- 每次演化後必須執行 `system-cleanup`。
- 確保瀏覽器內存與暫存空間被正確回收。

### 4. 版本存封
- 採用 `vYY.MMDD.HHMM` 格式建立 Tag。
- 提交訊息必須包含演化階段的關鍵字。

## 物理地板監控
- **磁碟空間**：維持 > 22GB (Gemini Nano 門檻)。
- **算力狀態**：檢測全域 `LanguageModel` 物件之可用性。
