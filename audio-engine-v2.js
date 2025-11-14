/**
 * Low-Latency Audio Engine V2
 * Direct Web Audio API implementation for minimal latency and true bypass
 */

class LowLatencySynthEngine {
    constructor() {
        this.context = null;
        this.sampleRate = 44100;
        
        // Master gain
        this.masterGain = null;
        
        // Filter
        this.filter = null;
        this.filterBypassed = false;
        
        // Effects with true bypass
        this.effects = {
            distortion: null,
            compressor: null,
            chorus: null,
            delay: null,
            reverb: null
        };
        
        // Effect bypass states
        this.effectBypassed = {
            distortion: false,
            compressor: false,
            chorus: false,
            delay: false,
            reverb: false
        };
        
        // Voice management
        this.voicePool = [];
        this.activeVoices = new Map(); // noteKey -> Voice
        this.maxVoices = 8;
        
        // Parameters
        this.params = {
            waveType: 'sine',
            masterVolume: 0.5,
            
            // ADSR
            attackTime: 0.01,
            decayTime: 0.1,
            sustainLevel: 0.7,
            releaseTime: 0.2,
            
            // Filter
            filterCutoff: 5000,
            filterResonance: 1,
            filterType: 'lowpass',
            
            // Effects
            distortionAmount: 0,
            chorusAmount: 0,
            reverbAmount: 0,
            
            // LFO
            lfoRate: 2,
            lfoDepth: 20,
            lfoWaveType: 'sine',
            lfoTarget: 'cutoff',
            
            // Unison
            unisonMode: false,
            unisonVoices: 2,
            unisonDetune: 5,
            
            // Tuning
            masterDetune: 0
        };
        
        // LFO
        this.lfo = null;
        this.lfoGain = null;
        
        // Analyser for visualization
        this.analyser = null;
        this.waveformData = null;
        
        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDestination = null;
        
        // Metronome
        this.metronomeEnabled = false;
    }
    
    /**
     * Initialize audio context and signal chain
     */
    async init() {
        if (this.context) return;
        
        // Create audio context with optimal settings
        this.context = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000, // Higher sample rate for better quality
            latencyHint: 'interactive' // Low latency mode
        });
        
        this.sampleRate = this.context.sampleRate;
        console.log('Audio context initialized:', this.sampleRate, 'Hz');
        
        // Create master gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.params.masterVolume;
        this.masterGain.connect(this.context.destination);
        
        // Create filter
        this.filter = this.context.createBiquadFilter();
        this.filter.type = this.params.filterType;
        this.filter.frequency.value = this.params.filterCutoff;
        this.filter.Q.value = this.params.filterResonance;
        
        // Create effects with true bypass
        this.createEffects();
        
        // Setup signal routing
        this.setupSignalChain();
        
        // Create LFO
        this.createLFO();
        
        // Create analyser
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.3;
        const bufferLength = this.analyser.frequencyBinCount;
        this.waveformData = new Uint8Array(bufferLength);
        
        // Connect analyser to filter output (before effects) for clean waveform visualization
        // This shows the raw oscillator shape
        this.filter.connect(this.analyser);
        
        // Initialize voice pool
        this.initVoicePool();
        
        // Setup recording
        this.setupRecording();
        
        console.log('Low-latency audio engine initialized');
    }
    
    /**
     * Create all effects with true bypass capability
     */
    createEffects() {
        // Distortion (using waveshaper)
        this.effects.distortion = {
            node: this.context.createWaveShaper(),
            bypassGain: this.context.createGain(),
            active: false
        };
        this.updateDistortionCurve(0);
        
        // Compressor
        this.effects.compressor = {
            node: this.context.createDynamicsCompressor(),
            bypassGain: this.context.createGain(),
            active: false
        };
        this.effects.compressor.node.threshold.value = -24;
        this.effects.compressor.node.ratio.value = 12;
        this.effects.compressor.node.attack.value = 0.003;
        this.effects.compressor.node.release.value = 0.25;
        
        // Chorus (using delay and LFO)
        this.effects.chorus = {
            node: this.context.createDelay(0.1),
            lfo: this.context.createOscillator(),
            lfoGain: this.context.createGain(),
            delayGain: this.context.createGain(),
            dryGain: this.context.createGain(),
            bypassGain: this.context.createGain(),
            active: false
        };
        this.effects.chorus.node.delayTime.value = 0.0035;
        this.effects.chorus.lfo.frequency.value = 1.5;
        this.effects.chorus.lfoGain.gain.value = 0.002;
        this.effects.chorus.delayGain.gain.value = 0;
        this.effects.chorus.dryGain.gain.value = 1;
        this.effects.chorus.lfo.connect(this.effects.chorus.lfoGain);
        this.effects.chorus.lfoGain.connect(this.effects.chorus.node.delayTime);
        this.effects.chorus.lfo.start();
        
        // Delay
        this.effects.delay = {
            node: this.context.createDelay(1.0),
            feedback: this.context.createGain(),
            wetGain: this.context.createGain(),
            dryGain: this.context.createGain(),
            bypassGain: this.context.createGain(),
            active: false
        };
        this.effects.delay.node.delayTime.value = 0.25; // 8n at 120 BPM
        this.effects.delay.feedback.gain.value = 0.3;
        this.effects.delay.wetGain.gain.value = 0;
        this.effects.delay.dryGain.gain.value = 1;
        
        // Reverb (using convolver with impulse response)
        this.effects.reverb = {
            node: this.context.createConvolver(),
            wetGain: this.context.createGain(),
            dryGain: this.context.createGain(),
            bypassGain: this.context.createGain(),
            active: false
        };
        this.effects.reverb.wetGain.gain.value = 0;
        this.effects.reverb.dryGain.gain.value = 1;
        this.createReverbImpulse();
    }
    
    /**
     * Create reverb impulse response
     */
    createReverbImpulse() {
        const length = this.sampleRate * 2; // 2 seconds
        const impulse = this.context.createBuffer(2, length, this.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
        
        this.effects.reverb.node.buffer = impulse;
    }
    
    /**
     * Update distortion curve
     */
    updateDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        const k = amount * 10;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        
        this.effects.distortion.node.curve = curve;
    }
    
    /**
     * Setup signal chain with true bypass routing
     */
    setupSignalChain() {
        // Start: Filter output
        let currentOutput = this.filter;
        
        // Route through effects with true bypass
        // Each effect has a bypass path that can be switched
        
        // Distortion
        currentOutput = this.setupEffectBypass(currentOutput, 'distortion', this.effects.distortion);
        
        // Compressor
        currentOutput = this.setupEffectBypass(currentOutput, 'compressor', this.effects.compressor);
        
        // Chorus
        currentOutput = this.setupEffectBypass(currentOutput, 'chorus', this.effects.chorus);
        
        // Delay
        currentOutput = this.setupEffectBypass(currentOutput, 'delay', this.effects.delay);
        
        // Reverb
        currentOutput = this.setupEffectBypass(currentOutput, 'reverb', this.effects.reverb);
        
        // Final connection to master gain
        currentOutput.connect(this.masterGain);
        
        // Update bypass states
        this.updateAllBypasses();
    }
    
    /**
     * Setup effect bypass routing
     */
    setupEffectBypass(input, name, effect) {
        // Create mixer for effect and bypass
        const mixer = this.context.createGain();
        const effectGain = this.context.createGain();
        const bypassGain = this.context.createGain();
        
        // Connect input to both effect and bypass paths
        input.connect(effectGain);
        input.connect(bypassGain);
        
        // Connect effect path (handle special routing for chorus/delay/reverb)
        if (name === 'chorus') {
            // Chorus: input splits to dry and delayed (wet) signals
            effectGain.connect(effect.dryGain);
            effect.dryGain.connect(mixer);
            effectGain.connect(effect.node);
            effect.node.connect(effect.delayGain);
            effect.delayGain.connect(mixer);
        } else if (name === 'delay') {
            // Delay: input splits to dry and delayed (wet) signals with feedback
            effectGain.connect(effect.dryGain);
            effect.dryGain.connect(mixer);
            effectGain.connect(effect.node);
            effect.node.connect(effect.wetGain);
            effect.wetGain.connect(mixer);
            // Feedback loop: delay output feeds back into delay input
            effect.node.connect(effect.feedback);
            effect.feedback.connect(effect.node);
        } else if (name === 'reverb') {
            // Reverb: input splits to dry and reverb (wet) signals
            effectGain.connect(effect.dryGain);
            effect.dryGain.connect(mixer);
            effectGain.connect(effect.node);
            effect.node.connect(effect.wetGain);
            effect.wetGain.connect(mixer);
        } else {
            // Simple effects: input -> effect -> mixer
            effectGain.connect(effect.node);
            effect.node.connect(mixer);
        }
        
        // Connect bypass path
        bypassGain.connect(mixer);
        
        // Store references for bypass control
        effect.inputGain = effectGain;
        effect.bypassGain = bypassGain;
        effect.mixer = mixer;
        
        return mixer;
    }
    
    /**
     * Update all effect bypass states
     */
    updateAllBypasses() {
        Object.keys(this.effectBypassed).forEach(name => {
            this.setEffectBypass(name, this.effectBypassed[name]);
        });
    }
    
    /**
     * Set effect bypass state (TRUE bypass - disconnect/reconnect)
     */
    setEffectBypass(name, bypassed) {
        this.effectBypassed[name] = bypassed;
        const effect = this.effects[name];
        
        if (!effect || !effect.inputGain || !effect.bypassGain) return;
        
        if (bypassed) {
            // TRUE bypass: mute effect path, enable bypass path
            effect.inputGain.gain.value = 0;
            effect.bypassGain.gain.value = 1;
            effect.active = false;
        } else {
            // Effect active: enable effect path, mute bypass path
            effect.inputGain.gain.value = 1;
            effect.bypassGain.gain.value = 0;
            effect.active = true;
        }
        
        console.log(`${name} bypass:`, bypassed ? 'ON' : 'OFF');
    }
    
    /**
     * Initialize voice pool
     */
    initVoicePool() {
        for (let i = 0; i < this.maxVoices; i++) {
            this.voicePool.push(this.createVoice());
        }
    }
    
    /**
     * Create a single voice
     */
    createVoice() {
        const voice = {
            oscillator: null,
            envelope: null,
            isActive: false,
            noteKey: null,
            frequency: 0,
            startTime: 0
        };
        
        return voice;
    }
    
    /**
     * Get a free voice from pool
     */
    getFreeVoice() {
        // Find inactive voice
        for (const voice of this.voicePool) {
            if (!voice.isActive) {
                return voice;
            }
        }
        
        // If all voices active, steal oldest
        let oldestVoice = null;
        let oldestTime = Infinity;
        
        for (const voice of this.voicePool) {
            if (voice.startTime < oldestTime) {
                oldestTime = voice.startTime;
                oldestVoice = voice;
            }
        }
        
        return oldestVoice;
    }
    
    /**
     * Play a note
     */
    playNote(frequency, noteKey = frequency) {
        if (!this.context) {
            console.warn('Audio context not initialized');
            return;
        }
        
        if (this.context.state !== 'running') {
            console.warn('Audio context not running, state:', this.context.state);
            // Try to resume
            this.context.resume().then(() => {
                console.log('Audio context resumed');
                this.playNote(frequency, noteKey);
            }).catch(err => {
                console.error('Failed to resume audio context:', err);
            });
            return;
        }
        
        // Check if note already playing
        if (this.activeVoices.has(noteKey)) {
            console.log('Note already playing:', noteKey);
            return;
        }
        
        console.log('Playing note:', frequency, 'Hz, key:', noteKey);
        
        // Get free voice
        const voice = this.getFreeVoice();
        
        // Stop voice if it was active
        if (voice.isActive) {
            this.releaseVoice(voice);
        }
        
        // Create nodes for this voice
        voice.oscillator = this.context.createOscillator();
        voice.envelope = this.context.createGain();
        
        // Configure oscillator
        voice.oscillator.type = this.params.waveType;
        voice.oscillator.frequency.value = frequency;
        
        // Apply master detune
        if (this.params.masterDetune !== 0) {
            const detuneCents = this.params.masterDetune;
            const detuneRatio = Math.pow(2, detuneCents / 1200);
            voice.oscillator.frequency.value *= detuneRatio;
        }
        
        // Configure envelope - start at 0, ramp to 1, then to sustain
        const now = this.context.currentTime;
        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(1, now + this.params.attackTime);
        voice.envelope.gain.linearRampToValueAtTime(
            this.params.sustainLevel,
            now + this.params.attackTime + this.params.decayTime
        );
        
        // Connect voice signal chain - oscillator -> envelope -> main filter
        // No per-voice filter to avoid double filtering
        voice.oscillator.connect(voice.envelope);
        voice.envelope.connect(this.filter);
        
        // Start oscillator
        voice.oscillator.start(this.context.currentTime);
        
        // Store voice state
        voice.isActive = true;
        voice.noteKey = noteKey;
        voice.frequency = frequency;
        voice.startTime = this.context.currentTime;
        
        this.activeVoices.set(noteKey, voice);
    }
    
    /**
     * Release a note
     */
    releaseNote(noteKey) {
        const voice = this.activeVoices.get(noteKey);
        if (!voice || !voice.isActive) return;
        
        this.releaseVoice(voice);
        this.activeVoices.delete(noteKey);
    }
    
    /**
     * Release a voice (start release envelope)
     */
    releaseVoice(voice) {
        if (!voice.isActive || !voice.envelope) return;
        
        const now = this.context.currentTime;
        const currentGain = voice.envelope.gain.value;
        
        // Start release phase
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(currentGain, now);
        voice.envelope.gain.linearRampToValueAtTime(0, now + this.params.releaseTime);
        
        // Stop oscillator after release
        const stopTime = now + this.params.releaseTime + 0.01;
        voice.oscillator.stop(stopTime);
        
        // Clean up after stop
        setTimeout(() => {
            if (voice.oscillator) {
                try {
                    voice.oscillator.disconnect();
                } catch (e) {}
            }
            if (voice.envelope) {
                try {
                    voice.envelope.disconnect();
                } catch (e) {}
            }
            voice.isActive = false;
            voice.oscillator = null;
            voice.envelope = null;
        }, (this.params.releaseTime + 0.01) * 1000);
    }
    
    /**
     * Stop all notes
     */
    stopAllNotes() {
        for (const [noteKey, voice] of this.activeVoices) {
            this.releaseVoice(voice);
        }
        this.activeVoices.clear();
    }
    
    /**
     * Create LFO
     */
    createLFO() {
        this.lfo = this.context.createOscillator();
        this.lfoGain = this.context.createGain();
        
        this.lfo.type = this.params.lfoWaveType;
        this.lfo.frequency.value = this.params.lfoRate;
        this.lfoGain.gain.value = this.params.lfoDepth / 100;
        
        this.lfo.connect(this.lfoGain);
        this.lfo.start();
        
        this.routeLFO();
    }
    
    /**
     * Route LFO to target
     */
    routeLFO() {
        // Disconnect LFO from all targets
        this.lfoGain.disconnect();
        
        switch (this.params.lfoTarget) {
            case 'cutoff':
                if (this.filter && !this.filterBypassed) {
                    const scale = this.context.createGain();
                    scale.gain.value = this.params.filterCutoff * 0.5;
                    this.lfoGain.connect(scale);
                    scale.connect(this.filter.frequency);
                }
                break;
            case 'amplitude':
                const ampScale = this.context.createGain();
                ampScale.gain.value = 0.3;
                this.lfoGain.connect(ampScale);
                ampScale.connect(this.masterGain.gain);
                break;
            case 'pitch':
                // Would need to modulate oscillator frequency
                // For now, skip
                break;
        }
    }
    
    /**
     * Setup recording
     */
    setupRecording() {
        try {
            this.recordingDestination = this.context.createMediaStreamDestination();
            this.masterGain.connect(this.recordingDestination);
        } catch (e) {
            console.warn('Recording setup failed:', e);
        }
    }
    
    // ===== PARAMETER SETTERS =====
    
    setWaveType(type) {
        this.params.waveType = type;
        // Update all active voices
        for (const voice of this.activeVoices.values()) {
            if (voice.oscillator) {
                voice.oscillator.type = type;
            }
        }
    }
    
    setMasterVolume(volume) {
        this.params.masterVolume = volume / 100;
        if (this.masterGain) {
            this.masterGain.gain.value = this.params.masterVolume;
        }
    }
    
    setAttackTime(time) {
        this.params.attackTime = time;
    }
    
    setDecayTime(time) {
        this.params.decayTime = time;
    }
    
    setSustainLevel(level) {
        this.params.sustainLevel = level / 100;
    }
    
    setReleaseTime(time) {
        this.params.releaseTime = time;
    }
    
    setFilterCutoff(freq) {
        this.params.filterCutoff = Math.max(20, Math.min(20000, freq));
        if (this.filter && !this.filterBypassed) {
            this.filter.frequency.value = this.params.filterCutoff;
        }
    }
    
    setFilterResonance(q) {
        this.params.filterResonance = Math.max(0.1, Math.min(20, q));
        if (this.filter && !this.filterBypassed) {
            this.filter.Q.value = this.params.filterResonance;
        }
    }
    
    setFilterType(type) {
        this.params.filterType = type;
        if (this.filter && !this.filterBypassed) {
            this.filter.type = type;
        }
    }
    
    setFilterBypass(bypassed) {
        this.filterBypassed = bypassed;
        if (!this.filter) return;
        
        if (bypassed) {
            // Set filter to all-pass
            if (this.params.filterType === 'lowpass') {
                this.filter.frequency.value = 20000;
            } else if (this.params.filterType === 'highpass') {
                this.filter.frequency.value = 20;
            } else {
                this.filter.frequency.value = 10000;
                this.filter.Q.value = 0.1;
            }
        } else {
            this.filter.frequency.value = this.params.filterCutoff;
            this.filter.Q.value = this.params.filterResonance;
            this.filter.type = this.params.filterType;
        }
    }
    
    setDistortionAmount(amount) {
        this.params.distortionAmount = Math.max(0, Math.min(100, amount));
        if (this.effects.distortion && !this.effectBypassed.distortion) {
            this.updateDistortionCurve(this.params.distortionAmount);
        }
    }
    
    setDistortionBypass(bypassed) {
        this.setEffectBypass('distortion', bypassed);
    }
    
    setChorusAmount(amount) {
        this.params.chorusAmount = Math.max(0, Math.min(100, amount));
        if (this.effects.chorus && !this.effectBypassed.chorus) {
            const wetLevel = this.params.chorusAmount / 100;
            this.effects.chorus.delayGain.gain.value = wetLevel;
            this.effects.chorus.dryGain.gain.value = 1 - wetLevel * 0.5; // Keep some dry signal
        }
    }
    
    setChorusBypass(bypassed) {
        this.setEffectBypass('chorus', bypassed);
    }
    
    setReverbAmount(amount) {
        this.params.reverbAmount = Math.max(0, Math.min(100, amount));
        if (this.effects.reverb && !this.effectBypassed.reverb) {
            this.effects.reverb.wetGain.gain.value = this.params.reverbAmount / 100;
            this.effects.reverb.dryGain.gain.value = 1 - (this.params.reverbAmount / 100);
        }
    }
    
    setReverbBypass(bypassed) {
        this.setEffectBypass('reverb', bypassed);
    }
    
    setCompressorBypass(bypassed) {
        this.setEffectBypass('compressor', bypassed);
    }
    
    setDelayBypass(bypassed) {
        this.setEffectBypass('delay', bypassed);
    }
    
    setLFORate(rate) {
        this.params.lfoRate = Math.max(0.1, Math.min(20, rate));
        if (this.lfo) {
            this.lfo.frequency.value = this.params.lfoRate;
        }
    }
    
    setLFODepth(depth) {
        this.params.lfoDepth = Math.max(0, Math.min(100, depth));
        if (this.lfoGain) {
            this.lfoGain.gain.value = this.params.lfoDepth / 100;
        }
    }
    
    setLFOWaveType(type) {
        this.params.lfoWaveType = type;
        if (this.lfo) {
            this.lfo.type = type;
        }
    }
    
    setLFOTarget(target) {
        this.params.lfoTarget = target;
        this.routeLFO();
    }
    
    setMasterDetune(cents) {
        this.params.masterDetune = Math.max(-100, Math.min(100, cents));
    }
    
    // ===== UTILITY METHODS =====
    
    async resumeAudio() {
        await this.init();
        if (this.context.state !== 'running') {
            await this.context.resume();
        }
    }
    
    getWaveformData() {
        if (!this.analyser || !this.waveformData) return null;
        this.analyser.getByteTimeDomainData(this.waveformData);
        return this.waveformData;
    }
    
    getActiveNoteCount() {
        return this.activeVoices.size;
    }
    
    isNotePlaying(noteKey) {
        return this.activeVoices.has(noteKey);
    }
    
    /**
     * Get the frequency of the first active note (for oscilloscope stabilization)
     */
    getPrimaryActiveFrequency() {
        if (this.activeVoices.size === 0) return null;
        
        // Get first active voice
        const firstVoice = this.activeVoices.values().next().value;
        if (firstVoice && firstVoice.oscillator) {
            return firstVoice.oscillator.frequency.value;
        }
        
        return null;
    }
    
    // Recording methods (same as before)
    startRecording() {
        if (!this.recordingDestination) return;
        if (this.isRecording) return;
        
        try {
            this.recordedChunks = [];
            let mimeType = 'audio/webm';
            
            const supportedTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'];
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
            
            this.mediaRecorder = new MediaRecorder(this.recordingDestination.stream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Recording failed:', error);
        }
    }
    
    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return null;
        
        this.isRecording = false;
        
        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
                this.recordedChunks = [];
                
                if (audioBlob.size === 0) {
                    resolve(null);
                    return;
                }
                
                const url = URL.createObjectURL(audioBlob);
                resolve(url);
            };
            
            this.mediaRecorder.stop();
        });
    }
    
    setMetronomeEnabled(enabled) {
        this.metronomeEnabled = enabled;
    }
    
    isMetronomeEnabled() {
        return this.metronomeEnabled;
    }
    
    playMetronomeClick(frequency = 800, duration = 0.1) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }
    
    // Static utility methods
    static midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    static frequencyToMidi(frequency) {
        return Math.round(12 * Math.log2(frequency / 440) + 69);
    }
}

