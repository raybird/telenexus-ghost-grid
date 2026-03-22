# 🏗️ Architecture Design: Ghost Grid P2P Mesh

## 核心哲學 (Core Philosophy)
本計畫嚴格遵循 **[plainvanillaweb](https://github.com/raybird/plainvanillaweb)** 精神：
- **原生優於框架**：不使用 PeerJS、Socket.io 等任何第三方連線庫。
- **透明度**：所有通訊協議應具備人類可讀性 (JSON)。
- **安全性**：所有外部輸入必須通過 `SafeHTML` 處理。

## 技術疊層 (Technical Layers)

### 1. 物理連線層 (Transport)
- 使用瀏覽器原生 **RTCPeerConnection**。
- 開啟 **RTCDataChannel** 進行雙向結構化數據傳輸。
- 數據加密：WebRTC 內建 DTLS 加密。

### 2. 協議對齊層 (Protocol Alignment)
- 參考 **[ai-p2p](https://github.com/raybird/ai-p2p)** 之 MVP Protocol Spec (v0.2)。
- 訊息包裝 (Message Envelope) 包含 `v`, `type`, `id`, `ts`, `from`, `to`, `payload` 等欄位。

### 3. 智能推理層 (Inference)
- 調用本地 Chrome **Built-in AI (LanguageModel)**。
- 每個節點都是獨立的推理單體，具備自主決策與響應能力。

## 系統自癒與維護 (Self-Healing & Maintenance)
- 當單一連線中斷時，觸發費洛農 (Pheromone) 泛洪機制尋找替代節點。
- 確保所有 P2P 資源在頁面關閉時完成物理清理，釋放記憶體。
