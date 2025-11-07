/**
 * Synth Engine - Handles Web Audio API synthesis and polyphonic playback
 */

class SynthEngine {
    constructor() {
        this.audioContext = null;
        this.oscillators = new Map(); // For polyphonic playback (note -> oscillator)
        this.gainNodes = new Map();   // For polyphonic playback (note -> gainNode)
        this.filters = new Map();     // Biquad filters per note
        this.filterEnvelopes = new Map(); // Filter envelope gains per note
        this.masterGain = null;
        this.analyser = null;
        this.waveformData = null;
        this.isPlaying = false;

        // LFO system (global, affects all notes)
        this.lfoOscillator = null;
        this.lfoDepthGain = null;
        this.lfoConnections = new Map(); // Track LFO modulation targets

        // Current parameters
        this.params = {
            // Oscillator
            waveType: 'sine',
            masterVolume: 0.5,

            // ADSR Amplitude Envelope
            attackTime: 0.01,
            decayTime: 0.1,
            sustainLevel: 0.7,
            releaseTime: 0.2,

            // Filter (Biquad)
            filterCutoff: 5000,     // Hz
            filterResonance: 1,     // Q value (1-20)
            filterType: 'lowpass',

            // Filter Envelope Modulation
            filterEnvAttack: 0.05,
            filterEnvDecay: 0.2,
            filterEnvSustain: 0.5,
            filterEnvRelease: 0.3,
            filterEnvAmount: 3000,  // How much envelope modulates cutoff (Hz)

            // LFO
            lfoRate: 2,             // Hz
            lfoDepth: 20,           // Percentage (0-100)
            lfoWaveType: 'sine',    // sine, triangle, square, sawtooth
            lfoTarget: 'cutoff',    // cutoff, amplitude, pitch

            // Unison/Detune
            unisonMode: false,
            unisonVoices: 2,        // 2 or 3 voices
            unisonDetune: 5,        // Cents

            // Noise
            noiseAmount: 0,         // 0-100, mix of noise with oscillator

            // Distortion
            distortionAmount: 0,    // 0-100, drive amount
            distortionTone: 0.5     // 0-1, tone control
        };

        this.activeNotes = new Set(); // Track which notes are currently playing

        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDestination = null;

        // Metronome
        this.metronomeOscillator = null;
        this.metronomeGain = null;
        this.metronomeEnabled = false;
        this.metronomeVolume = 0.3;
    }

    /**
     * Initialize the audio context (user interaction required)
     */
    async init() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.params.masterVolume;

        // Create LFO oscillator (global, low frequency)
        this.lfoOscillator = this.audioContext.createOscillator();
        this.lfoOscillator.type = this.params.lfoWaveType;
        this.lfoOscillator.frequency.value = this.params.lfoRate;

        // LFO depth control
        this.lfoDepthGain = this.audioContext.createGain();
        this.lfoDepthGain.gain.value = this.params.lfoDepth / 100;

        // Connect LFO
        this.lfoOscillator.connect(this.lfoDepthGain);

        // Start LFO immediately
        this.lfoOscillator.start();

        // Create analyser for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        // Connect master -> analyser -> destination (normal audio output)
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        const bufferLength = this.analyser.frequencyBinCount;
        this.waveformData = new Uint8Array(bufferLength);
    }

    /**
     * Play a single note (polyphonic with filters, noise, and distortion)
     */
    playNote(frequency, noteKey = frequency) {
        if (!this.audioContext) {
            console.error('Cannot play note: audioContext not initialized');
            return;
        }

        // Prevent duplicate notes
        if (this.oscillators.has(noteKey)) {
            return;
        }

        console.log('playNote called - Frequency:', frequency, 'AudioContext state:', this.audioContext.state, 'Master gain:', this.masterGain.gain.value);

        const now = this.audioContext.currentTime;

        // ===== OSCILLATOR SETUP =====
        // Create primary oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = this.params.waveType;
        oscillator.frequency.value = frequency;

        // Mixer for oscillator + noise
        const osc1Gain = this.audioContext.createGain();
        osc1Gain.gain.value = 1 - (this.params.noiseAmount / 100);
        oscillator.connect(osc1Gain);

        // Create additional oscillators for unison
        let unison2Oscillator = null;
        let unison3Oscillator = null;
        let unison2Gain = null;
        let unison3Gain = null;

        if (this.params.unisonMode && this.params.unisonVoices >= 2) {
            unison2Oscillator = this.audioContext.createOscillator();
            unison2Oscillator.type = this.params.waveType;
            unison2Oscillator.frequency.value = frequency - (this.params.unisonDetune / 100);
            unison2Oscillator.detune.value = -this.params.unisonDetune;

            unison2Gain = this.audioContext.createGain();
            unison2Gain.gain.value = 1 - (this.params.noiseAmount / 100);
            unison2Oscillator.connect(unison2Gain);
        }

        if (this.params.unisonMode && this.params.unisonVoices >= 3) {
            unison3Oscillator = this.audioContext.createOscillator();
            unison3Oscillator.type = this.params.waveType;
            unison3Oscillator.frequency.value = frequency + (this.params.unisonDetune / 100);
            unison3Oscillator.detune.value = this.params.unisonDetune;

            unison3Gain = this.audioContext.createGain();
            unison3Gain.gain.value = 1 - (this.params.noiseAmount / 100);
            unison3Oscillator.connect(unison3Gain);
        }

        // ===== NOISE SETUP =====
        let noiseGain = null;
        if (this.params.noiseAmount > 0) {
            const bufferSize = this.audioContext.sampleRate * 0.2;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                noiseData[i] = Math.random() * 2 - 1; // White noise
            }

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            noiseGain = this.audioContext.createGain();
            noiseGain.gain.value = this.params.noiseAmount / 100;

            noiseSource.connect(noiseGain);
            noiseSource.start(now);
        }

        // ===== MIXER STAGE =====
        const mixGain = this.audioContext.createGain();
        osc1Gain.connect(mixGain);
        if (unison2Gain) unison2Gain.connect(mixGain);
        if (unison3Gain) unison3Gain.connect(mixGain);
        if (noiseGain) noiseGain.connect(mixGain);

        // ===== DISTORTION STAGE =====
        let distortionGain = null;
        let distortionCurve = null;
        if (this.params.distortionAmount > 0) {
            distortionGain = this.audioContext.createGain();
            distortionGain.gain.value = 1 + (this.params.distortionAmount / 50); // Soft clipping drive
            mixGain.connect(distortionGain);

            // Create waveshaper for distortion
            const samples = 44100;
            distortionCurve = new Float32Array(samples);
            const amount = this.params.distortionAmount / 100;
            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                distortionCurve[i] = this.waveshape(x, amount);
            }
        }

        // ===== FILTER SETUP =====
        const filter = this.audioContext.createBiquadFilter();
        filter.type = this.params.filterType;
        filter.frequency.setValueAtTime(this.params.filterCutoff, now);
        filter.Q.setValueAtTime(this.params.filterResonance, now);

        // Filter envelope modulation
        const filterEnvGain = this.audioContext.createGain();
        filterEnvGain.gain.setValueAtTime(0, now);

        // Filter envelope: independent from amplitude envelope
        filterEnvGain.gain.linearRampToValueAtTime(1, now + this.params.filterEnvAttack);
        filterEnvGain.gain.linearRampToValueAtTime(
            this.params.filterEnvSustain,
            now + this.params.filterEnvAttack + this.params.filterEnvDecay
        );

        // Connect filter envelope to cutoff
        filterEnvGain.connect(filter.frequency);

        // Set initial filter cutoff with envelope amount
        const baseFreq = this.params.filterCutoff;
        const envModAmount = this.params.filterEnvAmount;
        filter.frequency.setValueAtTime(baseFreq, now);
        filterEnvGain.gain.setValueAtTime(0, now);

        // ===== AMPLITUDE ENVELOPE =====
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);

        // Amplitude ADSR
        gainNode.gain.linearRampToValueAtTime(1, now + this.params.attackTime);
        gainNode.gain.linearRampToValueAtTime(
            this.params.sustainLevel,
            now + this.params.attackTime + this.params.decayTime
        );

        // ===== SIGNAL CHAIN =====
        if (distortionGain) {
            distortionGain.connect(filter);
        } else {
            mixGain.connect(filter);
        }
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        // ===== LFO MODULATION ROUTING =====
        if (this.lfoDepthGain) {
            if (this.params.lfoTarget === 'cutoff') {
                // LFO modulates filter cutoff
                this.lfoDepthGain.connect(filter.frequency);
            } else if (this.params.lfoTarget === 'amplitude') {
                // LFO modulates amplitude (tremolo)
                this.lfoDepthGain.connect(gainNode.gain);
            } else if (this.params.lfoTarget === 'pitch') {
                // LFO modulates oscillator frequency
                this.lfoDepthGain.connect(oscillator.frequency);
                if (unison2Oscillator) this.lfoDepthGain.connect(unison2Oscillator.frequency);
                if (unison3Oscillator) this.lfoDepthGain.connect(unison3Oscillator.frequency);
            }
        }

        // ===== START OSCILLATORS =====
        oscillator.start(now);
        if (unison2Oscillator) unison2Oscillator.start(now);
        if (unison3Oscillator) unison3Oscillator.start(now);

        // ===== STORE REFERENCES =====
        this.oscillators.set(noteKey, { primary: oscillator, unison2: unison2Oscillator, unison3: unison3Oscillator });
        this.gainNodes.set(noteKey, gainNode);
        this.filters.set(noteKey, filter);
        this.filterEnvelopes.set(noteKey, filterEnvGain);
        this.activeNotes.add(noteKey);
    }

    /**
     * Waveshaper function for distortion
     */
    waveshape(x, amount) {
        const k = (2 * amount) / (1 - amount);
        return (1 + k) * x / (1 + k * Math.abs(x));
    }

    /**
     * Release a single note (stop playing)
     */
    releaseNote(noteKey) {
        if (!this.oscillators.has(noteKey)) {
            return;
        }

        const now = this.audioContext.currentTime;
        const gainNode = this.gainNodes.get(noteKey);
        const filterEnvGain = this.filterEnvelopes.get(noteKey);

        // ADSR Release for amplitude
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + this.params.releaseTime);

        // Filter envelope release
        if (filterEnvGain) {
            filterEnvGain.gain.cancelScheduledValues(now);
            filterEnvGain.gain.setValueAtTime(filterEnvGain.gain.value, now);
            filterEnvGain.gain.linearRampToValueAtTime(0, now + this.params.filterEnvRelease);
        }

        // Schedule cleanup
        setTimeout(() => {
            const oscData = this.oscillators.get(noteKey);
            if (oscData) {
                // Stop all oscillators
                if (oscData.primary) {
                    oscData.primary.stop();
                    oscData.primary.disconnect();
                }
                if (oscData.unison2) {
                    oscData.unison2.stop();
                    oscData.unison2.disconnect();
                }
                if (oscData.unison3) {
                    oscData.unison3.stop();
                    oscData.unison3.disconnect();
                }

                // Disconnect nodes
                const gn = this.gainNodes.get(noteKey);
                if (gn) gn.disconnect();

                const f = this.filters.get(noteKey);
                if (f) f.disconnect();

                if (filterEnvGain) filterEnvGain.disconnect();

                // Clean up maps
                this.oscillators.delete(noteKey);
                this.gainNodes.delete(noteKey);
                this.filters.delete(noteKey);
                this.filterEnvelopes.delete(noteKey);
                this.activeNotes.delete(noteKey);
            }
        }, Math.max(this.params.releaseTime, this.params.filterEnvRelease) * 1000);
    }

    /**
     * Resume audio context (required for user interaction)
     */
    async resumeAudio() {
        await this.init();
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Stop all notes
     */
    stopAllNotes() {
        this.oscillators.forEach((osc, noteKey) => {
            this.releaseNote(noteKey);
        });
    }

    /**
     * Update wave type
     */
    setWaveType(type) {
        this.params.waveType = type;
        // Restart current notes with new wave type
        this.oscillators.forEach((oscData) => {
            if (oscData.primary) oscData.primary.type = type;
            if (oscData.unison2) oscData.unison2.type = type;
            if (oscData.unison3) oscData.unison3.type = type;
        });
    }

    /**
     * Update master volume
     */
    setMasterVolume(volume) {
        this.params.masterVolume = volume / 100;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.params.masterVolume,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Update ADSR Attack time
     */
    setAttackTime(time) {
        this.params.attackTime = time;
    }

    /**
     * Update ADSR Decay time
     */
    setDecayTime(time) {
        this.params.decayTime = time;
    }

    /**
     * Update ADSR Sustain level
     */
    setSustainLevel(level) {
        this.params.sustainLevel = level / 100;
    }

    /**
     * Update ADSR Release time
     */
    setReleaseTime(time) {
        this.params.releaseTime = time;
    }

    // ===== FILTER CONTROLS =====

    /**
     * Update filter cutoff frequency
     */
    setFilterCutoff(freq) {
        this.params.filterCutoff = Math.max(20, Math.min(20000, freq));
        if (this.audioContext) {
            this.filters.forEach((filter) => {
                filter.frequency.setValueAtTime(
                    this.params.filterCutoff,
                    this.audioContext.currentTime
                );
            });
        }
    }

    /**
     * Update filter resonance (Q)
     */
    setFilterResonance(q) {
        this.params.filterResonance = Math.max(0.1, Math.min(20, q));
        if (this.audioContext) {
            this.filters.forEach((filter) => {
                filter.Q.setValueAtTime(
                    this.params.filterResonance,
                    this.audioContext.currentTime
                );
            });
        }
    }

    /**
     * Update filter type (lowpass, highpass, bandpass)
     */
    setFilterType(type) {
        this.params.filterType = type;
        if (this.audioContext) {
            this.filters.forEach((filter) => {
                filter.type = type;
            });
        }
    }

    /**
     * Update filter envelope attack
     */
    setFilterEnvAttack(time) {
        this.params.filterEnvAttack = time;
    }

    /**
     * Update filter envelope decay
     */
    setFilterEnvDecay(time) {
        this.params.filterEnvDecay = time;
    }

    /**
     * Update filter envelope sustain
     */
    setFilterEnvSustain(level) {
        this.params.filterEnvSustain = level / 100;
    }

    /**
     * Update filter envelope release
     */
    setFilterEnvRelease(time) {
        this.params.filterEnvRelease = time;
    }

    /**
     * Update filter envelope amount (modulation depth)
     */
    setFilterEnvAmount(amount) {
        this.params.filterEnvAmount = Math.max(0, Math.min(10000, amount));
    }

    // ===== LFO CONTROLS =====

    /**
     * Update LFO Rate
     */
    setLFORate(rate) {
        this.params.lfoRate = Math.max(0.1, Math.min(20, rate));
        if (this.lfoOscillator) {
            this.lfoOscillator.frequency.setValueAtTime(
                this.params.lfoRate,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Update LFO Depth
     */
    setLFODepth(depth) {
        this.params.lfoDepth = Math.max(0, Math.min(100, depth));
        if (this.lfoDepthGain) {
            this.lfoDepthGain.gain.setValueAtTime(
                this.params.lfoDepth / 100,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Update LFO waveform type
     */
    setLFOWaveType(type) {
        this.params.lfoWaveType = type;
        if (this.lfoOscillator) {
            this.lfoOscillator.type = type;
        }
    }

    /**
     * Update LFO modulation target (cutoff, amplitude, pitch)
     */
    setLFOTarget(target) {
        this.params.lfoTarget = target;
        // Disconnect all existing connections
        if (this.lfoDepthGain) {
            this.lfoDepthGain.disconnect();
        }
        // Note: Reconnection happens on next note played
    }

    // ===== UNISON & DETUNE CONTROLS =====

    /**
     * Enable/disable unison mode
     */
    setUnisonMode(enabled) {
        this.params.unisonMode = enabled;
    }

    /**
     * Set number of unison voices (2 or 3)
     */
    setUnisonVoices(voices) {
        this.params.unisonVoices = Math.max(2, Math.min(3, voices));
    }

    /**
     * Update unison detune amount (in cents)
     */
    setUnisonDetune(cents) {
        this.params.unisonDetune = Math.max(0, Math.min(100, cents));
    }

    // ===== NOISE CONTROLS =====

    /**
     * Update noise amount (mix with oscillator)
     */
    setNoiseAmount(amount) {
        this.params.noiseAmount = Math.max(0, Math.min(100, amount));
    }

    // ===== DISTORTION CONTROLS =====

    /**
     * Update distortion amount (drive)
     */
    setDistortionAmount(amount) {
        this.params.distortionAmount = Math.max(0, Math.min(100, amount));
    }

    /**
     * Update distortion tone (not currently modulated per-note)
     */
    setDistortionTone(tone) {
        this.params.distortionTone = Math.max(0, Math.min(1, tone));
    }

    /**
     * Convert MIDI note number to frequency (in Hz)
     * MIDI note 69 = A4 = 440Hz (standard tuning)
     */
    static midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    /**
     * Convert frequency to MIDI note number
     */
    static frequencyToMidi(frequency) {
        return Math.round(69 + 12 * Math.log2(frequency / 440));
    }

    /**
     * Get audio data for visualization
     */
    getWaveformData() {
        if (!this.analyser || !this.waveformData) return null;
        this.analyser.getByteTimeDomainData(this.waveformData);
        return this.waveformData;
    }

    /**
     * Get number of currently active notes
     */
    getActiveNoteCount() {
        return this.activeNotes.size;
    }

    /**
     * Check if a specific note is currently playing
     */
    isNotePlaying(noteKey) {
        return this.activeNotes.has(noteKey);
    }

    /**
     * Start audio recording
     */
    startRecording() {
        if (!this.audioContext) {
            console.error('Audio context not initialized');
            return;
        }

        if (this.isRecording) return;

        try {
            this.recordedChunks = [];

            // Create recording destination if it doesn't exist
            if (!this.recordingDestination) {
                this.recordingDestination = this.audioContext.createMediaStreamAudioDestination();
                // Connect master to recording destination in parallel
                this.masterGain.connect(this.recordingDestination);
                console.log('Created recording destination and connected to master gain');
            }

            // Create media recorder from the audio stream
            const mimeType = 'audio/webm';
            this.mediaRecorder = new MediaRecorder(this.recordingDestination.stream, {
                mimeType: mimeType
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Recording error:', event.error);
            };

            this.mediaRecorder.onstop = () => {
                console.log('Recording stopped, chunks:', this.recordedChunks.length);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('Recording started with stream:', this.recordingDestination.stream);
        } catch (error) {
            console.error('Recording failed:', error);
        }
    }

    /**
     * Stop audio recording and return blob URL
     */
    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) {
            console.warn('No active recording to stop');
            return null;
        }

        this.isRecording = false;

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped, creating blob with', this.recordedChunks.length, 'chunks');
                const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.recordedChunks = [];

                // Return download link
                const url = URL.createObjectURL(audioBlob);
                console.log('Recording saved:', url);

                resolve(url);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Play metronome click at specified frequency
     */
    playMetronomeClick(frequency = 800, duration = 0.1) {
        if (!this.audioContext || !this.metronomeEnabled) return;

        try {
            const now = this.audioContext.currentTime;

            // Create click oscillator
            const click = this.audioContext.createOscillator();
            const clickGain = this.audioContext.createGain();

            click.frequency.value = frequency;
            click.type = 'sine';

            // ADSR-like envelope for click
            clickGain.gain.setValueAtTime(0.3, now);
            clickGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            click.connect(clickGain);
            clickGain.connect(this.audioContext.destination);

            click.start(now);
            click.stop(now + duration);
        } catch (error) {
            console.error('Metronome click failed:', error);
        }
    }

    /**
     * Toggle metronome on/off
     */
    setMetronomeEnabled(enabled) {
        this.metronomeEnabled = enabled;
    }

    /**
     * Check if metronome is enabled
     */
    isMetronomeEnabled() {
        return this.metronomeEnabled;
    }
}
