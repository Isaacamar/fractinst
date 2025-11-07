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
            recordingStop: [],
            midiNoteRecorded: []
        };

        // MIDI note recording
        this.midiNotes = []; // Array of recorded MIDI notes
        this.isRecordingMidi = false;

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
        this.isRecordingMidi = false; // Will enable after lead-in
        this.midiNotes = []; // Clear previous MIDI notes
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
                this.isRecordingMidi = true; // Enable MIDI recording
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
        this.isRecordingMidi = false;

        if (this.synthEngine) {
            const recordingPromise = this.synthEngine.stopRecording();
            if (recordingPromise && recordingPromise.then) {
                recordingPromise.then((recordingUrl) => {
                    this.emit('recordingStop', { recordingUrl, midiNotes: this.midiNotes });
                }).catch((error) => {
                    console.error('Error stopping recording:', error);
                    this.emit('recordingStop', { midiNotes: this.midiNotes });
                });
            } else {
                this.emit('recordingStop', { midiNotes: this.midiNotes });
            }
        } else {
            this.emit('recordingStop', { midiNotes: this.midiNotes });
        }
    }

    /**
     * Record a MIDI note event
     */
    recordMidiNote(noteData) {
        if (!this.isRecordingMidi) return;

        const note = {
            frequency: noteData.frequency,
            noteKey: noteData.noteKey,
            startBeat: this.currentBeat,
            velocity: noteData.velocity || 100,
            noteOn: true
        };

        this.midiNotes.push(note);
        this.emit('midiNoteRecorded', note);
        console.log('MIDI note recorded:', note);
    }

    /**
     * Record MIDI note release
     */
    recordMidiNoteRelease(noteKey) {
        if (!this.isRecordingMidi) return;

        // Find the most recent note with this key
        for (let i = this.midiNotes.length - 1; i >= 0; i--) {
            if (this.midiNotes[i].noteKey === noteKey && this.midiNotes[i].noteOn) {
                const duration = this.currentBeat - this.midiNotes[i].startBeat;
                this.midiNotes[i].duration = Math.max(0.01, duration); // Minimum 0.01 beats
                this.midiNotes[i].noteOn = false;
                console.log('MIDI note release:', noteKey, 'Duration:', duration);
                break;
            }
        }
    }

    /**
     * Get recorded MIDI notes
     */
    getMidiNotes() {
        return this.midiNotes;
    }

    /**
     * Clear MIDI notes
     */
    clearMidiNotes() {
        this.midiNotes = [];
    }

    /**
     * Set MIDI notes (for loading/playback)
     */
    setMidiNotes(notes) {
        this.midiNotes = notes || [];
    }

    /**
     * Playback recorded MIDI notes (optimized - only check notes that should be active)
     * Triggers notes at appropriate beat positions during playback
     */
    playbackMidiNotes() {
        if (!this.synthEngine || this.midiNotes.length === 0 || !this.isPlaying) return;

        const currentBeat = this.currentBeat;
        const noteStartThreshold = 0.05;

        // Only iterate through notes (no forEach overhead, use for loop)
        for (let i = 0; i < this.midiNotes.length; i++) {
            const note = this.midiNotes[i];
            const noteEnd = note.startBeat + note.duration;

            // Skip if note is already past its end
            if (currentBeat >= noteEnd && note.isPlaying) {
                this.synthEngine.releaseNote(`midi-${note.noteKey}`);
                note.isPlaying = false;
                continue;
            }

            // Skip if we're past this note's window
            if (currentBeat > note.startBeat + noteStartThreshold) {
                if (!note.isPlaying && currentBeat < noteEnd) {
                    // Late trigger - still in duration window
                    this.synthEngine.playNote(note.frequency, `midi-${note.noteKey}`);
                    note.isPlaying = true;
                }
                continue;
            }

            // Check if we've just reached this note's start time
            if (
                currentBeat >= note.startBeat &&
                currentBeat < note.startBeat + noteStartThreshold &&
                !note.isPlaying
            ) {
                this.synthEngine.playNote(note.frequency, `midi-${note.noteKey}`);
                note.isPlaying = true;
            }
        }
    }

    /**
     * Reset MIDI note playback state
     */
    resetMidiPlaybackState() {
        this.midiNotes.forEach((note) => {
            note.isPlaying = false;
        });
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
     * Internal timing loop - runs every frame (highly optimized)
     */
    startTimingLoop() {
        let lastBeatChangedEmit = -1; // Cache last beat to avoid duplicate emissions

        const update = () => {
            if (!this.isPlaying) return;

            const now = this.audioContext ? this.audioContext.currentTime : performance.now() / 1000;
            const deltaTime = now - this.lastTimestamp;
            this.lastTimestamp = now;

            // Calculate beat increment based on BPM and delta time
            const beatsPerSecond = this.bpm / 60;
            this.currentBeat += beatsPerSecond * deltaTime;

            // Handle loop wrap-around
            if (this.currentBeat >= this.loopLengthBeats) {
                this.currentBeat = 0;
                this.currentBar = 0;
                this.resetMidiPlaybackState();
                this.emit('loopComplete');
            } else {
                this.currentBar = Math.floor(this.currentBeat / this.beatsPerBar);
            }

            // Playback MIDI notes if we have any (only when not recording)
            if (!this.isRecordingMidi && this.midiNotes.length > 0) {
                this.playbackMidiNotes();
            }

            // Emit beatChanged only when beat actually changes
            const currentBeatFloor = Math.floor(this.currentBeat);
            if (currentBeatFloor !== lastBeatChangedEmit) {
                this.emit('beatChanged', {
                    beat: currentBeatFloor,
                    bar: this.currentBar,
                    subBeat: this.currentBeat % 1
                });
                lastBeatChangedEmit = currentBeatFloor;

                // Play metronome click if enabled
                if ((this.metronomeEnabled || this.isRecordingLeadIn) && this.synthEngine) {
                    const beatInBar = currentBeatFloor % this.beatsPerBar;
                    const frequency = beatInBar === 0 ? 1000 : 600;
                    this.synthEngine.playMetronomeClick(frequency, 0.1);
                }
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
