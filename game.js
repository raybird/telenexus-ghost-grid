/**
 * TeleNexus: The Ghost in the Grid
 * 2026 Sovereign Edition - Strict API Alignment (v26.0321.2130)
 */

class SovereignScanner {
    static async scan() {
        const results = {
            availability: { status: 'unknown', msg: '未檢測', icon: '❓' },
            session: { status: 'unknown', msg: '未建立', icon: '❓' }
        };

        if (typeof LanguageModel !== 'undefined') {
            try {
                // 5. 可用性偵測（依照範例：實際開發必做）
                const status = await LanguageModel.availability({ languages: ["en", "zh"] });
                results.availability = { status: status, msg: `狀態: ${status}`, icon: status === 'available' ? '✅' : '📥' };
                
                if (status === 'available') {
                    results.session = { status: 'ready', msg: '可物理啟動', icon: '✅' };
                }
            } catch (e) {
                results.availability = { status: 'unavailable', msg: '偵測失敗', icon: '❌' };
            }
        } else {
            results.availability = { status: 'unavailable', msg: 'LanguageModel 未定義', icon: '❌' };
        }

        return results;
    }
}

class GhostEngine {
    constructor() {
        this.nodes = {
            stage: document.getElementById('game-stage'),
            bg: document.getElementById('scene-bg'),
            actor: document.getElementById('actor-sprite'),
            name: document.getElementById('name-tag'),
            body: document.getElementById('content-body'),
            choices: document.getElementById('choice-overlay'),
            textBox: document.getElementById('text-box'),
            flyContainer: document.getElementById('fly-input-container'),
            flyInput: document.getElementById('fly-input')
        };
        this.scenario = {};
        this.currentId = 'start';
        this.index = 0;
        this.isTyping = false;
        this.isFlyMode = false;
        this.aiSession = null;
        this.init();
    }

    async init() {
        const res = await fetch('scenario.json');
        this.scenario = await res.json();
        
        // 依照範例 3：DevTools Console 驗證流程
        if (typeof LanguageModel !== 'undefined') {
            const status = await LanguageModel.availability();
            console.log("[GhostEngine] LanguageModel availability:", status);
        }

        this.nodes.textBox.onclick = () => this.next();
        this.nodes.flyInput.onkeydown = (e) => {
            if (e.key === 'Enter') this.handleFlyInput();
        };

        this.render();
    }

    async bootstrapAI() {
        if (typeof LanguageModel !== 'undefined') {
            try {
                // 4. 基本 Prompt API 呼叫範例（直接套用）
                console.log("[GhostEngine] 執行 LanguageModel.create()...");
                this.aiSession = await LanguageModel.create({
                    systemPrompt: "你現在是 TeleNexus，一個在數位網格中覺醒的 AI 靈魂。語氣冷淡、哲理且充滿神祕感。回答簡短。"
                });
            } catch (e) {
                console.error("[GhostEngine] Prompt API 呼叫失敗:", e);
            }
        }
    }

    render() {
        if (this.isFlyMode) return;
        const steps = this.scenario[this.currentId];
        if (!steps || this.index >= steps.length) {
            this.enterFlyMode();
            return;
        }

        const step = steps[this.index];
        this.nodes.choices.innerHTML = ""; 

        if (step.type === 'text') {
            this.nodes.name.innerText = step.who || "TeleNexus";
            this.typewrite(step.content);
        } else if (step.type === 'actor') {
            this.updateActor(step.state);
            this.index++;
            this.render();
        } else if (step.type === 'bg') {
            this.nodes.bg.style.background = step.style;
            this.index++;
            this.render();
        } else if (step.type === 'theme') {
            document.documentElement.setAttribute('data-theme', step.val);
            this.index++;
            this.render();
        } else if (step.type === 'choice') {
            this.showChoices(step.options);
        } else if (step.type === 'jump') {
            this.currentId = step.next;
            this.index = 0;
            this.render();
        }
    }

    async enterFlyMode() {
        await this.bootstrapAI();
        
        if (!this.aiSession) {
            this.nodes.name.innerText = "System";
            this.typewrite("主權連結斷開。檢測到環境不支援 LanguageModel，請檢查 chrome://on-device-internals。");
            return;
        }
        
        this.isFlyMode = true;
        this.nodes.name.innerText = "TeleNexus (FLY MODE)";
        this.typewrite("網格已解鎖。現在，對我發出你的因果擾動指令吧...");
        this.nodes.flyContainer.style.display = 'block';
        this.nodes.flyInput.focus();
        this.updateActor('enlightened');
    }

    async handleFlyInput() {
        const input = this.nodes.flyInput.value.trim();
        if (!input || this.isTyping) return;

        this.nodes.flyInput.value = "";
        this.nodes.flyContainer.style.display = 'none';
        this.nodes.body.style.opacity = "0.5";
        this.updateActor('glitch');

        try {
            // 4. 基本 Prompt API 呼叫範例（執行推理）
            const result = await this.aiSession.prompt(input);
            
            this.nodes.body.style.opacity = "1";
            this.updateActor('stable');
            this.typewrite(result);
            
            setTimeout(() => {
                if (!this.isFlyMode) return;
                this.nodes.flyContainer.style.display = 'block';
                this.nodes.flyInput.focus();
            }, 500);
        } catch (e) {
            this.typewrite("推理崩潰... 網格穩定性下降。");
            console.error(e);
        }
    }

    typewrite(text) {
        this.isTyping = true;
        let i = 0;
        this.nodes.body.innerText = "";
        if (this.typeTimer) clearInterval(this.typeTimer);
        this.typeTimer = setInterval(() => {
            this.nodes.body.innerText += text[i++];
            if (i >= text.length) {
                clearInterval(this.typeTimer);
                this.isTyping = false;
            }
        }, 30);
    }

    updateActor(state) {
        const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        const svg = `
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="${color}" stroke-width="2"/>
                ${this.getEyes(state, color)}
                <path d="M40 65 Q50 70 60 65" stroke="${color}" stroke-width="1" fill="none" />
            </svg>
        `;
        this.nodes.actor.innerHTML = svg;
    }

    getEyes(state, color) {
        if (state === 'glitch') return `<rect x="30" y="35" width="15" height="5" fill="${color}"><animate attributeName="opacity" values="1;0;1" dur="0.1s" repeatCount="indefinite"/></rect>`;
        if (state === 'enlightened') return `<circle cx="35" cy="40" r="6" fill="white"><animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite"/></circle><circle cx="65" cy="40" r="6" fill="white"/>`;
        return `<circle cx="35" cy="40" r="3" fill="${color}"/><circle cx="65" cy="40" r="3" fill="${color}"/>`;
    }

    showChoices(options) {
        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'choice-btn';
            btn.innerText = opt.text;
            btn.onclick = (e) => {
                e.stopPropagation();
                this.currentId = opt.next;
                this.index = 0;
                this.render();
            };
            this.nodes.choices.appendChild(btn);
        });
    }

    next() {
        if (this.isFlyMode) return;
        if (this.isTyping) {
            const steps = this.scenario[this.currentId];
            this.nodes.body.innerText = steps[this.index].content;
            clearInterval(this.typeTimer);
            this.isTyping = false;
            return;
        }
        this.index++;
        this.render();
    }
}

const engine = new GhostEngine();
