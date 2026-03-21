/**
 * TeleNexus: The Ghost in the Grid
 * 2026 Sovereign Edition - API & Audio Hardened (v26.0321.2150)
 */

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
        this.audioCtx = null;
        this.init();
    }

    async init() {
        const res = await fetch('scenario.json');
        this.scenario = await res.json();
        
        this.nodes.textBox.onclick = () => {
            this.initAudio(); // 透過使用者互動初始化音訊上下文
            this.next();
        };
        
        this.nodes.flyInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.initAudio();
                this.handleFlyInput();
            }
        };

        this.render();
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playPulseSound() {
        if (!this.audioCtx) return;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    async bootstrapAI() {
        if (typeof LanguageModel !== 'undefined') {
            try {
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
            this.typewrite("主權連結斷開。檢測到環境不支援 LanguageModel。");
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
            const result = await this.aiSession.prompt(input);
            this.nodes.body.style.opacity = "1";
            this.updateActor('stable');
            this.typewrite(result, () => this.playPulseSound()); // 推理完畢播放音效
            
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

    typewrite(text, callback) {
        this.isTyping = true;
        let i = 0;
        this.nodes.body.innerText = "";
        if (this.typeTimer) clearInterval(this.typeTimer);
        
        this.typeTimer = setInterval(() => {
            this.nodes.body.innerText += text[i++];
            if (i >= text.length) {
                clearInterval(this.typeTimer);
                this.isTyping = false;
                if (callback) callback();
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
