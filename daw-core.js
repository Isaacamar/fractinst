/**
 * DAW Core - Global state management and timing
 * Uses Tone.Transport for professional-grade MIDI scheduling
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

        // Tone.Transport integration
        this.transport = null;
        this.midiPart = null;
        this.metronomeLoop = null;
        this.uiUpdateLoop = null;
        this.lastEmittedBeat = -1;

        // Initialize Tone.Transport
        this.initializeTransport();
    }

    /**
     * Initialize Tone.Transport and set up MIDI scheduling
     */
    initializeTransport() {
        this.transport = Tone.Transport;

        // Set initial BPM
        this.transport.bpm.value = this.bpm;

        // Set loop length on transport
        this.transport.loopEnd = `${this.loopLengthBeats}q`;
        this.transport.loop = true;

        // Create MIDI part for note playback
        this.midiPart = new Tone.Part((time, note) => {
            if (!this.synthEngine) return;

            const noteId = `midi-${note.noteKey}`;

            // Play the note at the scheduled time
            this.synthEngine.playNote(note.frequency, noteId);

            // Schedule note release
            const noteDurationSeconds = Tone.Time(note.duration, 'quarters').toSeconds();
            Tone.Transport.scheduleOnce(() => {
                if (this.synthEngine) {
                    this.synthEngine.releaseNote(noteId);
                }
            }, time + noteDurationSeconds);

        }, []);

        // Start metronome and UI update loops
        this.setupTransportCallbacks();
    }

    /**
     * Set up callbacks for Tone.Transport events
     */
    setupTransportCallbacks() {
        // Clear existing loops if they exist
        if (this.metronomeLoop) {
            this.metronomeLoop.stop();
            this.metronomeLoop.dispose();
        }
        if (this.uiUpdateLoop) {
            this.uiUpdateLoop.stop();
            this.uiUpdateLoop.dispose();
        }

        // Metronome loop - play clicks on beat boundaries
        this.metronomeLoop = new Tone.Loop((time) => {
            if ((this.metronomeEnabled || this.isRecordingLeadIn) && this.synthEngine) {
                // Get beat from transport position string (format: "bars:quarters:sixteenths")
                const posStr = this.transport.position;
                const parts = posStr.split(':');
                const beatInBar = parseInt(parts[1]) % this.beatsPerBar;
                const frequency = beatInBar === 0 ? 1000 : 600;
                this.synthEngine.playMetronomeClick(frequency, 0.1);
            }
        }, '1q'); // Every beat (quarter note)
        this.metronomeLoop.start(0);

        // UI update loop - emit beat change events and update state
        this.uiUpdateLoop = new Tone.Loop((time) => {
            // Update current beat from Tone.Transport
            const transportPos = this.transport.position;
            const parts = transportPos.split(':');
            const bar = parseFloat(parts[0]);
            const beat = parseFloat(parts[1]);
            const sixteenth = parseFloat(parts[2]) || 0;

            this.currentBeat = bar * this.beatsPerBar + beat + (sixteenth / 4);
            this.currentBar = Math.floor(bar);

            // Emit beat changed event only when beat actually changes
            const currentBeatFloor = Math.floor(this.currentBeat);
            if (currentBeatFloor !== this.lastEmittedBeat) {
                this.emit('beatChanged', {
                    beat: currentBeatFloor,
                    bar: this.currentBar,
                    subBeat: this.currentBeat % 1
                });
                this.lastEmittedBeat = currentBeatFloor;
            }
        }, '16n'); // Update every 16th note for smooth updates

        this.uiUpdateLoop.start(0);

        // Handle transport loop event
        this.transport.on('loop', () => {
            this.emit('loopComplete');
        });
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
    async play() {
        if (this.isPlaying) return;

        try {
            // Ensure Tone.js is started
            if (Tone.getContext().state !== 'running') {
                await Tone.getContext().resume();
            }

            // Start Tone.Transport
            Tone.Transport.start();
            this.isPlaying = true;
            console.log('Playback started - Tone.Transport running');
            this.emit('playbackStart');
        } catch (error) {
            console.error('Error starting playback:', error);
        }
    }

    /**
     * Stop playback
     */
    stop() {
        if (!this.isPlaying) return;

        try {
            // Stop Tone.Transport
            Tone.Transport.stop();
            Tone.Transport.position = 0; // Reset to beginning
            this.isPlaying = false;
            this.currentBeat = 0;
            this.currentBar = 0;
            this.lastEmittedBeat = -1;

            console.log('Playback stopped - Tone.Transport paused');
            this.emit('playbackStop');
        } catch (error) {
            console.error('Error stopping playback:', error);
        }
    }

    /**
     * Start recording with lead-in metronome clicks
     */
    async record() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.isRecordingLeadIn = true;
        this.isRecordingMidi = false; // Will enable after lead-in
        this.midiNotes = []; // Clear previous MIDI notes
        console.log('Recording started with lead-in');

        // Disable MIDI part playback during recording (we're recording, not playing back)
        if (this.midiPart) {
            this.midiPart.mute = true;
        }

        await this.play(); // Start playback if not already

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

        // Re-enable MIDI part playback (now that recording is done)
        if (this.midiPart) {
            this.midiPart.mute = false;
        }

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
            noteOn: true,
            duration: 0.5 // Default duration, will be updated on release
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

                // Update the MIDI part with the new note
                this.updateMidiPart();
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
        if (this.midiPart) {
            this.midiPart.removeAll();
        }
    }

    /**
     * Set MIDI notes (for loading/playback)
     */
    setMidiNotes(notes) {
        this.midiNotes = notes || [];
        this.updateMidiPart();
    }

    /**
     * Update MIDI part with current notes
     * Called after MIDI notes change to sync with Tone.Part
     */
    updateMidiPart() {
        if (!this.midiPart) return;

        // Clear existing notes
        this.midiPart.removeAll();

        // Add notes to the part with proper timing
        this.midiNotes.forEach((note) => {
            // Convert beat position to Tone time format (quarters = beats)
            const time = `${note.startBeat}q`;
            this.midiPart.add(time, note);
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
        this.transport.bpm.value = this.bpm;
    }

    /**
     * Set loop length in bars
     */
    setLoopLengthBars(bars) {
        this.loopLengthBars = Math.max(1, bars);
        this.loopLengthBeats = this.beatsPerBar * this.loopLengthBars;

        // Update Tone.Transport loop length
        if (this.midiPart) {
            this.midiPart.loopEnd = `${this.loopLengthBeats}q`;
        }
        this.transport.loopEnd = `${this.loopLengthBeats}q`;
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

    /**
     * Debug method - log MIDI part information
     */
    debugMidiPart() {
        console.group('🎹 MIDI Part Debug Info');
        console.log('Total MIDI Notes:', this.midiNotes.length);
        console.log('MIDI Notes:', this.midiNotes);
        console.log('Tone.Transport Running:', Tone.Transport.state === 'started');
        console.log('Tone.Transport Position:', Tone.Transport.position);
        console.log('Tone.Transport BPM:', Tone.Transport.bpm.value);
        console.log('MIDI Part Loop:', this.midiPart?.loop);
        console.log('MIDI Part Loop End:', this.midiPart?.loopEnd);
        console.log('Current Beat:', this.currentBeat.toFixed(2));
        console.log('Current Bar:', this.currentBar);
        console.groupEnd();
    }
}
