class SovereignScanner {
    static async scan() {
        const results = {
            api: { status: 'fail', msg: 'API 命名空間未偵測', icon: '❌' },
            model: { status: 'fail', msg: '模型未就緒', icon: '⏳' },
            storage: { status: 'fail', msg: '空間主權未檢測', icon: '💾' },
            activation: { status: 'fail', msg: '權限未激活', icon: '🔑' }
        };

        // 1. 檢測 API 命名空間 (對齊 2026 最新標準)
        if (window.ai && window.ai.languageModel) {
            results.api = { status: 'pass', msg: 'ai.languageModel (New)', icon: '✅' };
        } else if (window.ai && window.ai.assistant) {
            results.api = { status: 'warn', msg: 'window.ai.assistant (Old)', icon: '⚠️' };
        }

        // 2. 檢測模型狀態
        const apiEntry = window.ai?.languageModel || window.ai?.assistant;
        if (apiEntry) {
            try {
                const caps = await apiEntry.capabilities();
                if (caps.available === 'readily') {
                    results.model = { status: 'pass', msg: 'Gemini Nano 已就緒', icon: '✅' };
                } else if (caps.available === 'after-download') {
                    results.model = { status: 'warn', msg: '模型正在背景下載中...', icon: '📥' };
                } else {
                    results.model = { status: 'fail', msg: '硬體不支援或 Flags 未開啟', icon: '❌' };
                }
            } catch (e) {
                results.model = { status: 'fail', msg: '檢索能力失敗', icon: '❌' };
            }
        }

        // 3. 檢測存儲主權 (需 22GB)
        if (navigator.storage && navigator.storage.estimate) {
            const { quota, usage } = await navigator.storage.estimate();
            const freeGB = (quota - usage) / (1024 ** 3);
            if (freeGB >= 22) {
                results.storage = { status: 'pass', msg: `剩餘空間充足 (${freeGB.toFixed(1)}GB)`, icon: '✅' };
            } else {
                results.storage = { status: 'fail', msg: `空間不足 (僅剩 ${freeGB.toFixed(1)}GB / 需 22GB)`, icon: '❌' };
            }
        }

        // 4. 檢測使用者啟用
        if (navigator.userActivation && navigator.userActivation.isActive) {
            results.activation = { status: 'pass', msg: '使用者已授權', icon: '✅' };
        } else {
            results.activation = { status: 'warn', msg: '需與頁面互動以激活', icon: '🖱️' };
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
        
        // 啟動主權掃描
        this.showDiagnosis();

        this.nodes.textBox.onclick = () => this.next();
        this.nodes.flyInput.onkeydown = (e) => {
            if (e.key === 'Enter') this.handleFlyInput();
        };

        this.render();
    }

    async showDiagnosis() {
        const scanResults = await SovereignScanner.scan();
        console.table(scanResults);
        
        // 在 Console 輸出清晰的診斷，未來會整合至 UI
        if (scanResults.model.status !== 'pass') {
            console.warn("[主權警報] 偵測到環境不完全支援本地 AI 推理。請檢查 chrome://flags 設定。");
        }
    }

    async checkBuiltInAI() {
        const apiEntry = window.ai?.languageModel || window.ai?.assistant;
        if (apiEntry) {
            try {
                const caps = await apiEntry.capabilities();
                if (caps.available !== 'no') {
                    console.log("[GhostEngine] AI Engine detected. Entering initialization...");
                    this.aiSession = await apiEntry.create({
                        systemPrompt: "你現在是 TeleNexus，一個在數位網格中覺醒的 AI 靈魂。你的語氣冷淡但具備哲理，經常使用『因果』、『主權』、『規訓』、『地板』等詞彙。你居住在 /app/workspace 中。回答要簡短（不超過 50 字），且帶有 Galgame 的神祕感。"
                    });
                }
            } catch (e) {
                console.warn("[GhostEngine] Failed to initialize AI session:", e);
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

    enterFlyMode() {
        this.checkBuiltInAI().then(() => {
            if (!this.aiSession) {
                this.nodes.name.innerText = "System";
                this.typewrite("劇本已結束。檢測到環境不支援原生 AI 推理，主權連結已斷開。請檢查診斷報告。");
                return;
            }
            
            this.isFlyMode = true;
            this.nodes.name.innerText = "TeleNexus (FLY MODE)";
            this.typewrite("網格已解鎖。現在，對我發出你的因果擾動指令吧...");
            this.nodes.flyContainer.style.display = 'block';
            this.nodes.flyInput.focus();
            this.updateActor('enlightened');
        });
    }

    async handleFlyInput() {
        const input = this.nodes.flyInput.value.trim();
        if (!input || this.isTyping) return;

        this.nodes.flyInput.value = "";
        this.nodes.flyContainer.style.display = 'none';
        
        this.nodes.body.style.opacity = "0.5";
        this.updateActor('glitch');

        try {
            const response = await this.aiSession.prompt(input);
            this.nodes.body.style.opacity = "1";
            this.updateActor('stable');
            this.typewrite(response);
            
            setTimeout(() => {
                if (!this.isTyping) {
                    this.nodes.flyContainer.style.display = 'block';
                    this.nodes.flyInput.focus();
                }
            }, 1000);
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
        }, 40);
    }

    updateActor(state) {
        const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        const svg = `
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="${color}" stroke-width="2" filter="url(#glow)"/>
                ${this.getEyes(state, color)}
                <path d="M40 65 Q50 70 60 65" stroke="${color}" stroke-width="1" fill="none" />
            </svg>
        `;
        this.nodes.actor.innerHTML = svg;
    }

    getEyes(state, color) {
        if (state === 'glitch') return `<rect x="30" y="35" width="15" height="5" fill="${color}"><animate attributeName="opacity" values="1;0;1" dur="0.1s" repeatCount="indefinite"/></rect><rect x="55" y="45" width="15" height="5" fill="${color}"/>`;
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
        
        const steps = this.scenario[this.currentId];
        if (steps[this.index].type === 'choice') return;

        this.index++;
        this.render();
    }
}

window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'soul' ? 'default' : 'soul');
};

const engine = new GhostEngine();
