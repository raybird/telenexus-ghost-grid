# 🗺️ Project Roadmap: Ghost Grid P2P Mesh

`telenexus-ghost-grid` 旨在結合本地 AI 推理與 P2P 網格技術，打造一個遵循 `plainvanillaweb` 精神的去中心化敘事平台。

---

## 🚀 階段一：純手作 P2P 探針 (Vanilla P2P Probe)
*目標：實現最底層的連通性與安全渲染地板。*

- [x] **原生 WebRTC 握手**：建立基礎的 Offer/Answer 交換邏輯（已實作 P2PProbe V1）。
- [x] **手動訊號介面**：實作一個 Debug 終端，允許使用者透過複製/貼上訊號字串建立連線。
- [x] **SafeHTML 規訓**：確保所有從 P2P 渠道接收的文字在顯示前皆經過安全模板過濾（已實作 DOMPurify-lite 邏輯）。
- [x] **因果狀態燈**：在 UI 實作實時連線狀態顯示（已實作狀態燈與因果對齊）。

## 🤖 階段二：代理人能力宣告 (Agent Handshake)
*目標：對齊 `ai-p2p` 協議，實現代理人間的身份與能力識別。*

- [x] **協議格式對焦**：實作符合 `ai-p2p` MVP 規範的 `HELLO` 訊息信封（包含 agentId 與 capabilities）。
- [x] **算力主權宣告**：節點現在能向網格宣告本地 `LanguageModel` 的就緒狀態。
- [x] **合成音效聯動**：接收到遠端握手訊號時，自動觸發 Web Audio 脈衝音效。
- [x] **基礎設施預檢**：在 P2P 連線前檢查磁碟空間與 NPU 就緒狀態。

## 🧠 階段三：湧現式群體敘事 (Emergent Swarm Narrative)
*目標：實現自組織的共同創作與環境自癒。*

- [x] **自動化 Signaling**：利用 GitHub Gist 作為中轉信箱實現無感連線（已實作 GistSignaler）。
- [x] **記憶碎片交換**：實作 P2P 狀態同步，讓不同節點的代理人能基於共享上下文生成對話。
- [ ] **家園樹自癒節點**：建立被動查詢服務，當單一連結斷裂時自動重組網格。
- [x] **主權存封**：將 P2P 互動產出的重要劇情自動存檔至本地 IndexedDB。
- [x] **因果溯源介面**：實作 ProvenanceUI，即時顯示從遠端網格同步的記憶碎片。

---
*TeleNexus Sovereign Infrastructure - Decentralized Intelligence, Pure Vanilla.*
