/**
 * TeleNexus: The Ghost in the Grid
 * 2026 Sovereign Edition - API, Audio & P2P Hardened (v26.0325.Handshake)
 */

class P2PProbe {
    constructor(engine) {
        this.engine = engine;
        this.pc = null;
        this.dc = null;
        this.agentId = `agent-${crypto.randomUUID().substring(0, 8)}`;
        this.config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }

    initPC() {
        this.pc = new RTCPeerConnection(this.config);
        this.pc.onicecandidate = (e) => {
            if (e.candidate) return;
            this.engine.nodes.p2pSignalOut.value = btoa(JSON.stringify(this.pc.localDescription));
        };
        this.pc.onconnectionstatechange = () => {
            this.engine.updateP2PStatus(this.pc.connectionState === 'connected' ? 'connected' : 'connecting');
        };
    }

    async createOffer() {
        this.initPC();
        this.dc = this.pc.createDataChannel('ghost-chat');
        this.setupDataChannel();
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
    }

    async handleSignal() {
        const input = this.engine.nodes.p2pSignalIn.value.trim();
        if (!input) return;
        
        try {
            const signal = JSON.parse(atob(input));
            if (!this.pc) this.initPC();

            if (signal.type === 'offer') {
                await this.pc.setRemoteDescription(signal);
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this.pc.ondatachannel = (e) => {
                    this.dc = e.channel;
                    this.setupDataChannel();
                };
            } else if (signal.type === 'answer') {
                await this.pc.setRemoteDescription(signal);
            }
        } catch (e) {
            this.engine.typewrite("[系統]: 訊號解碼失敗，因果連結崩潰。");
        }
    }

    setupDataChannel() {
        if (!this.dc) return;
        this.dc.onopen = () => {
            console.log("[P2P] Channel Open");
            this.engine.updateP2PStatus('connected');
            this.sendHandshake();
        };
        this.dc.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'HELLO') {
                this.handleHandshake(data);
            } else {
                const safeText = this.engine.sanitize(data.text);
                this.engine.typewrite(`[遠端殘響]: ${safeText}`);
            }
        };
    }

    sendHandshake() {
        const handshake = {
            type: 'HELLO',
            agentId: this.agentId,
            capabilities: {
                ai: typeof LanguageModel !== 'undefined',
                audio: typeof AudioContext !== 'undefined',
                timestamp: new Date().toISOString()
            }
        };
        this.dc.send(JSON.stringify(handshake));
    }

    handleHandshake(data) {
        console.log(`[P2P] 收到握手自 ${data.agentId}:`, data.capabilities);
        this.engine.playPulseSound();
        this.engine.typewrite(`[系統]: 已連結至主權節點 ${data.agentId}。算力就緒：${data.capabilities.ai}`);
    }

    send(text) {
        if (this.dc && this.dc.readyState === 'open') {
            this.dc.send(JSON.stringify({ type: 'MESSAGE', text }));
        }
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
            flyInput: document.getElementById('fly-input'),
            p2pStatus: document.getElementById('p2p-status'),
            p2pSignalOut: document.getElementById('p2p-signal-out'),
            p2pSignalIn: document.getElementById('p2p-signal-in')
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

    async checkInfrastructure() {
        this.typewrite("[系統]: 啟動階段二基礎設施預檢...");

        const infra = {
            storage: '未知',
            ai: typeof LanguageModel !== 'undefined' ? 'NPU 就緒' : 'CPU 模擬',
            audio: typeof AudioContext !== 'undefined' || (window.AudioContext || window.webkitAudioContext) ? '聲學就緒' : '靜音模式'
        };

        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const freeGB = (estimate.quota - estimate.usage) / (1024 * 1024 * 1024);
                infra.storage = `${freeGB.toFixed(1)} GB 可用`;
                if (freeGB < 22) {
                    this.typewrite("[警告]: 磁碟空間低於 Gemini Nano 門檻 (22GB)。");
                }
            }
        } catch (e) {
            console.warn("Storage API unavailable");
        }

        this.typewrite(`[預檢結果]: 存儲: ${infra.storage} | 算力: ${infra.ai} | 音訊: ${infra.audio}`);
    }

    async init() {
        const res = await fetch('scenario.json');
        this.scenario = await res.json();

        this.nodes.textBox.onclick = () => {
            this.initAudio();
            this.next();
        };

        this.nodes.flyInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.initAudio();
                this.handleFlyInput();
            }
        };

        this.p2p = new P2PProbe(this);
        await this.checkInfrastructure();
        this.render();
    }
    updateP2PStatus(state) {
        const colors = { disconnected: '#666', connecting: '#ffcc00', connected: '#00f3ff' };
        if (this.nodes.p2pStatus) {
            this.nodes.p2pStatus.style.background = colors[state] || '#666';
            this.nodes.p2pStatus.style.boxShadow = `0 0 10px ${colors[state] || '#666'}`;
        }
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

    sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            this.typewrite(result, () => {
                this.playPulseSound();
                if (this.p2p) this.p2p.send(result);
            }); 
            
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
