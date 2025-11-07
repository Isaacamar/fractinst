/**
 * DAW Core - Global state management and timing
 * Manages BPM, loop timing, transport controls, and event system
 */

class DAWCore {
    constructor() {
        // Timing parameters
        this.bpm = 120;
        this.beatsPerBar = 4;
        this.loopLengthBars = 4;
        this.loopLengthBeats = this.beatsPerBar * this.loopLengthBars; // 16 beats

        // Playback state
        this.isPlaying = false;
        this.isRecording = false;
        this.currentBeat = 0; // Float: current position in beats
        this.currentBar = 0;  // Integer: current bar number

        // Audio context reference (will be set by SynthEngine)
        this.audioContext = null;
        this.lastTimestamp = null;

        // Metronome and recording
        this.synthEngine = null;
        this.metronomeEnabled = false;
        this.lastMetronomeBeat = -1;
        this.recordingLeadInBeats = 4; // Lead-in time before recording
        this.isRecordingLeadIn = false;

        // Event system
        this.eventListeners = {
            beatChanged: [],
            barChanged: [],
            loopComplete: [],
            playbackStart: [],
            playbackStop: [],
            recordingStart: [],
            recordingStop: []
        };

        // Animation frame ID for the timing loop
        this.animationFrameId = null;
    }

    /**
     * Set audio context reference (call after SynthEngine initializes)
     */
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Set synth engine reference for recording and metronome
     */
    setSynthEngine(synthEngine) {
        this.synthEngine = synthEngine;
    }

    /**
     * Start playback
     */
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.lastTimestamp = this.audioContext ? this.audioContext.currentTime : performance.now() / 1000;
        this.startTimingLoop();
        this.emit('playbackStart');
    }

    /**
     * Stop playback
     */
    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.currentBeat = 0;
        this.currentBar = 0;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.emit('playbackStop');
    }

    /**
     * Start recording with lead-in metronome clicks
     */
    record() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.isRecordingLeadIn = true;
        console.log('Recording started with lead-in');
        this.play(); // Start playback if not already

        // Start actual audio recording after lead-in
        if (this.synthEngine) {
            const leadInDuration = (this.recordingLeadInBeats / (this.bpm / 60)) * 1000;
            console.log('Lead-in duration:', leadInDuration, 'ms');
            setTimeout(() => {
                console.log('Starting actual audio recording');
                this.synthEngine.startRecording();
                this.isRecordingLeadIn = false;
                this.emit('recordingActualStart');
            }, leadInDuration);
        } else {
            console.warn('synthEngine not set, recording lead-in audio will not work');
        }

        this.emit('recordingStart');
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        this.isRecordingLeadIn = false;

        if (this.synthEngine) {
            const recordingPromise = this.synthEngine.stopRecording();
            if (recordingPromise && recordingPromise.then) {
                recordingPromise.then((recordingUrl) => {
                    this.emit('recordingStop', { recordingUrl });
                }).catch((error) => {
                    console.error('Error stopping recording:', error);
                    this.emit('recordingStop');
                });
            } else {
                this.emit('recordingStop');
            }
        } else {
            this.emit('recordingStop');
        }
    }

    /**
     * Set metronome enabled state
     */
    setMetronomeEnabled(enabled) {
        this.metronomeEnabled = enabled;
        if (this.synthEngine) {
            this.synthEngine.setMetronomeEnabled(enabled);
        }
    }

    /**
     * Toggle metronome on/off
     */
    toggleMetronome() {
        this.setMetronomeEnabled(!this.metronomeEnabled);
        return this.metronomeEnabled;
    }

    /**
     * Set BPM (beats per minute)
     */
    setBPM(bpm) {
        this.bpm = Math.max(20, Math.min(300, bpm)); // Clamp 20-300 BPM
    }

    /**
     * Set loop length in bars
     */
    setLoopLengthBars(bars) {
        this.loopLengthBars = Math.max(1, bars);
        this.loopLengthBeats = this.beatsPerBar * this.loopLengthBars;
    }

    /**
     * Internal timing loop - runs every frame
     */
    startTimingLoop() {
        const update = () => {
            if (!this.isPlaying) return;

            const now = this.audioContext ? this.audioContext.currentTime : performance.now() / 1000;
            const deltaTime = now - this.lastTimestamp;
            this.lastTimestamp = now;

            // Calculate beat increment based on BPM and delta time
            // BPM = beats per minute, so beats per second = BPM / 60
            const beatsPerSecond = this.bpm / 60;
            const beatDelta = beatsPerSecond * deltaTime;

            const previousBeat = Math.floor(this.currentBeat);
            const previousBar = this.currentBar;

            // Update beat position
            this.currentBeat += beatDelta;

            // Handle loop wrap-around
            if (this.currentBeat >= this.loopLengthBeats) {
                this.currentBeat = 0;
                this.currentBar = 0;
                this.emit('loopComplete');
            } else {
                // Update bar position
                this.currentBar = Math.floor(this.currentBeat / this.beatsPerBar);
            }

            // Emit events on beat/bar changes
            const currentBeatFloor = Math.floor(this.currentBeat);
            if (currentBeatFloor > previousBeat) {
                this.emit('beatChanged', {
                    beat: currentBeatFloor,
                    bar: this.currentBar,
                    subBeat: this.currentBeat % 1 // Fractional part
                });

                // Play metronome click if enabled (during lead-in or recording)
                if ((this.metronomeEnabled || this.isRecordingLeadIn) && this.synthEngine) {
                    const beatInBar = currentBeatFloor % this.beatsPerBar;
                    // Higher frequency on beat 1 of each bar, lower on other beats
                    const frequency = beatInBar === 0 ? 1000 : 600;
                    this.synthEngine.playMetronomeClick(frequency, 0.1);
                }
            }

            if (this.currentBar > previousBar) {
                this.emit('barChanged', { bar: this.currentBar });
            }

            this.animationFrameId = requestAnimationFrame(update);
        };

        this.animationFrameId = requestAnimationFrame(update);
    }

    /**
     * Add an event listener
     */
    on(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].push(callback);
        }
    }

    /**
     * Remove an event listener
     */
    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                (cb) => cb !== callback
            );
        }
    }

    /**
     * Emit an event to all listeners
     */
    emit(eventName, data = null) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach((callback) => {
                callback(data);
            });
        }
    }

    /**
     * Get current time as a formatted string (e.g., "02:03:1.5" = bar 2, beat 3, sub-beat 0.5)
     */
    getFormattedTime() {
        const bar = String(this.currentBar + 1).padStart(2, '0');
        const beat = String(Math.floor(this.currentBeat % this.beatsPerBar) + 1).padStart(2, '0');
        const subBeat = (this.currentBeat % 1).toFixed(1);
        return `${bar}:${beat}:${subBeat}`;
    }

    /**
     * Get current progress as percentage (0-100)
     */
    getProgress() {
        return (this.currentBeat / this.loopLengthBeats) * 100;
    }

    /**
     * Get all current DAW state
     */
    getState() {
        return {
            bpm: this.bpm,
            beatsPerBar: this.beatsPerBar,
            loopLengthBars: this.loopLengthBars,
            loopLengthBeats: this.loopLengthBeats,
            isPlaying: this.isPlaying,
            isRecording: this.isRecording,
            currentBeat: this.currentBeat,
            currentBar: this.currentBar,
            formattedTime: this.getFormattedTime(),
            progress: this.getProgress()
        };
    }
}
