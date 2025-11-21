/**
 * DAW Core - Wrapper around Transport, MidiRecorder, and PlaybackScheduler
 * Provides high-level DAW functionality and event system
 * Maintains backward compatibility with existing code
 */

class DAWCore {
    constructor() {
        // Will be initialized when audio context is available
        this.transport = null;
        this.midiRecorder = null;
        this.playbackScheduler = null;
        this.synthEngine = null;
        this.audioContext = null;

        // Event system (for backward compatibility)
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

        // Metronome
        this.metronomeEnabled = false;
        this.lastMetronomeBeat = -1;
    }

    /**
     * Initialize with audio context and synth engine
     */
    initialize(audioContext, synthEngine) {
        this.audioContext = audioContext;
        this.synthEngine = synthEngine;

        // Create transport
        this.transport = new Transport(audioContext);
        this.transport.setBpm(120);
        this.transport.setLoopLengthBars(4);

        // Create MIDI recorder
        this.midiRecorder = new MidiRecorder(this.transport, synthEngine);

        // Create playback scheduler
        this.playbackScheduler = new PlaybackScheduler(this.transport, synthEngine, this.midiRecorder);

        // Setup transport callbacks for event system
        this.setupTransportCallbacks();

        console.log('DAW Core initialized with new Transport system');
    }

    /**
     * Setup transport callbacks to emit events
     */
    setupTransportCallbacks() {
        let lastBeat = -1;
        let lastBar = -1;
        let leadInBeatCount = 0;
        let isLeadIn = false;

        this.transport.onUpdate((timeSeconds) => {
            const currentBeat = Math.floor(this.transport.getCurrentBeat());
            const currentBar = this.transport.getCurrentBar();

            // Emit beat changed event
            if (currentBeat !== lastBeat) {
                this.emit('beatChanged', {
                    beat: currentBeat,
                    bar: currentBar,
                    subBeat: this.transport.getCurrentBeat() % 1
                });
                lastBeat = currentBeat;

                // Play metronome
                if (this.metronomeEnabled && this.synthEngine) {
                    const beatInBar = currentBeat % this.transport.beatsPerBar;
                    const frequency = beatInBar === 0 ? 1000 : 600;
                    this.synthEngine.playMetronomeClick(frequency, 0.1);
                }

                // Track lead-in beats
                if (isLeadIn) {
                    leadInBeatCount++;
                    if (leadInBeatCount >= 4) {
                        isLeadIn = false;
                        leadInBeatCount = 0;
                    }
                }
            }

            // Emit bar changed event
            if (currentBar !== lastBar) {
                this.emit('barChanged', {
                    bar: currentBar,
                    beat: currentBeat % this.transport.beatsPerBar
                });
                lastBar = currentBar;
            }

            // Check for loop completion
            const loopLengthBeats = this.transport.loopLengthBars * this.transport.beatsPerBar;
            if (currentBeat >= loopLengthBeats - 1 && lastBeat < loopLengthBeats - 1) {
                this.emit('loopComplete');
            }
        });

        // Store lead-in state tracker
        this.leadInBeatCount = () => leadInBeatCount;
        this.setLeadIn = (value) => { isLeadIn = value; leadInBeatCount = 0; };
    }

    /**
     * Set audio context (backward compatibility)
     */
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
        if (this.synthEngine && !this.transport) {
            this.initialize(audioContext, this.synthEngine);
        } else if (!this.synthEngine) {
            // Will be initialized when synthEngine is set
            console.log('Audio context set, waiting for synth engine...');
        }
    }

    /**
     * Set synth engine (backward compatibility)
     */
    setSynthEngine(synthEngine) {
        this.synthEngine = synthEngine;
        if (this.audioContext && !this.transport) {
            this.initialize(this.audioContext, synthEngine);
        } else if (!this.audioContext) {
            // Will be initialized when audioContext is set
            console.log('Synth engine set, waiting for audio context...');
        }
    }
    
    /**
     * Ensure initialization is complete
     */
    ensureInitialized() {
        if (!this.transport && this.audioContext && this.synthEngine) {
            this.initialize(this.audioContext, this.synthEngine);
        }
        return !!this.transport && !!this.midiRecorder;
    }

    /**
     * Start playback
     */
    async play() {
        if (!this.transport) {
            console.error('Transport not initialized. Call setAudioContext and setSynthEngine first.');
            return;
        }

        await this.transport.play();
        this.playbackScheduler.start();
        this.emit('playbackStart');
    }

    /**
     * Stop playback
     */
    stop() {
        if (!this.transport) return;

        this.transport.stop();
        this.playbackScheduler.stop();
        this.playbackScheduler.reset();
        this.emit('playbackStop');
    }

    /**
     * Seek to a specific time (in seconds)
     */
    seek(timeSeconds) {
        if (!this.transport) return;
        
        const wasPlaying = this.transport.isPlaying;
        
        // Reset scheduler
        this.playbackScheduler.reset();
        
        // Seek transport
        this.transport.seek(timeSeconds);
        
        // Restart scheduler if was playing
        if (wasPlaying) {
            this.playbackScheduler.start();
        }
    }

    /**
     * Seek to a specific beat
     */
    seekToBeat(beat) {
        if (!this.transport) return;
        this.seek(this.transport.beatsToSeconds(beat));
    }

    /**
     * Start recording with lead-in metronome
     * Auto-starts playback if not already playing
     */
    async record() {
        if (!this.transport || !this.midiRecorder) {
            console.error('Transport or MidiRecorder not initialized.');
            console.log('Transport:', this.transport);
            console.log('MidiRecorder:', this.midiRecorder);
            throw new Error('Transport or MidiRecorder not initialized');
        }

        // If already recording, don't start again
        if (this.transport.isRecording) {
            console.log('Already recording');
            return;
        }

        console.log('=== STARTING RECORDING ===');
        console.log('Transport state before:', {
            isPlaying: this.transport.isPlaying,
            position: this.transport.position,
            currentBeat: this.transport.getCurrentBeat()
        });

        // Reset transport to start
        this.transport.seek(0);
        console.log('Reset transport to position 0');

        // ALWAYS start transport (record should auto-play)
        const wasPlaying = this.transport.isPlaying;
        if (!this.transport.isPlaying) {
            console.log('Starting transport playback...');
            await this.transport.play();
            this.playbackScheduler.start();
            this.emit('playbackStart'); // Emit so UI can update play button
            console.log('Transport started, isPlaying:', this.transport.isPlaying);
        } else {
            console.log('Transport already playing');
        }

        // Small delay to ensure transport is actually running
        await new Promise(resolve => setTimeout(resolve, 10));

        // Emit recording start (lead-in phase)
        this.transport.isRecording = true;
        this.emit('recordingStart');
        console.log('Emitted recordingStart event');

        // Lead-in: 4 beats of metronome before actual recording starts
        const leadInBeats = 4;
        const startBeat = Math.floor(this.transport.getCurrentBeat());
        const targetBeat = startBeat + leadInBeats;

        console.log('Starting lead-in: from beat', startBeat, 'to beat', targetBeat);
        console.log('Current transport time:', this.transport.getCurrentTime(), 'seconds');

        // Enable metronome for lead-in
        const wasMetronomeEnabled = this.metronomeEnabled;
        this.setMetronomeEnabled(true);
        if (this.setLeadIn) this.setLeadIn(true);
        console.log('Metronome enabled for lead-in');

        // Wait for lead-in to complete (check on beat changes)
        let checkCount = 0;
        const checkLeadIn = () => {
            checkCount++;
            
            // Safety check - ensure transport is still playing
            if (!this.transport.isPlaying) {
                console.error('Transport stopped during lead-in!');
                return;
            }
            
            const currentBeat = Math.floor(this.transport.getCurrentBeat());
            const currentTime = this.transport.getCurrentTime();
            
            // Debug every 10 frames
            if (checkCount % 10 === 0) {
                console.log(`Lead-in check ${checkCount}: beat ${currentBeat.toFixed(2)}, target ${targetBeat}`);
            }
            
            if (currentBeat >= targetBeat) {
                // Lead-in complete, start actual recording
                console.log('=== LEAD-IN COMPLETE ===');
                console.log('Starting actual recording at beat', currentBeat, 'time', currentTime);
                this.midiRecorder.startRecording();
                this.emit('recordingActualStart');
                // Restore metronome state
                this.setMetronomeEnabled(wasMetronomeEnabled);
                if (this.setLeadIn) this.setLeadIn(false);
            } else {
                // Continue checking
                if (checkCount < 10000) { // Safety limit
                    requestAnimationFrame(checkLeadIn);
                } else {
                    console.error('Lead-in check timeout after', checkCount, 'frames');
                    console.error('Final beat:', currentBeat, 'Target:', targetBeat);
                }
            }
        };
        checkLeadIn();
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.midiRecorder) {
            console.warn('MidiRecorder not initialized, cannot stop recording');
            return;
        }

        // Only stop if actually recording
        if (!this.transport.isRecording && !this.midiRecorder.isRecording) {
            return;
        }

        const clip = this.midiRecorder.stopRecording();
        this.transport.isRecording = false;

        console.log('Recording stopped. Clip:', clip);

        this.emit('recordingStop', {
            clip: clip,
            clips: this.midiRecorder.getClips()
        });
    }

    /**
     * Record a MIDI note (called from keyboard controller)
     */
    recordMidiNote(noteData) {
        if (!this.midiRecorder) return;
        this.midiRecorder.recordNoteOn(noteData);
        this.emit('midiNoteRecorded', noteData);
    }

    /**
     * Record MIDI note release (called from keyboard controller)
     */
    recordMidiNoteRelease(noteKey) {
        if (!this.midiRecorder) return;
        this.midiRecorder.recordNoteOff(noteKey);
    }

    /**
     * Set BPM
     */
    setBPM(bpm) {
        if (this.transport) {
            this.transport.setBpm(bpm);
        }
    }

    /**
     * Set loop length in bars
     */
    setLoopLengthBars(bars) {
        if (this.transport) {
            this.transport.setLoopLengthBars(bars);
        }
    }

    /**
     * Toggle metronome
     */
    toggleMetronome() {
        this.metronomeEnabled = !this.metronomeEnabled;
        if (this.synthEngine) {
            this.synthEngine.setMetronomeEnabled(this.metronomeEnabled);
        }
        return this.metronomeEnabled;
    }

    /**
     * Set metronome enabled
     */
    setMetronomeEnabled(enabled) {
        this.metronomeEnabled = enabled;
        if (this.synthEngine) {
            this.synthEngine.setMetronomeEnabled(enabled);
        }
    }

    /**
     * Get formatted time string
     */
    getFormattedTime() {
        if (!this.transport) return '00:00:0.0';
        return this.transport.formatTime();
    }

    /**
     * Get current beat
     */
    get currentBeat() {
        if (!this.transport) return 0;
        return this.transport.getCurrentBeat();
    }

    /**
     * Get current bar
     */
    get currentBar() {
        if (!this.transport) return 0;
        return this.transport.getCurrentBar();
    }

    /**
     * Get loop length beats
     */
    get loopLengthBeats() {
        if (!this.transport) return 16;
        return this.transport.loopLengthBars * this.transport.beatsPerBar;
    }

    /**
     * Get loop length bars
     */
    get loopLengthBars() {
        if (!this.transport) return 4;
        return this.transport.loopLengthBars;
    }

    /**
     * Get BPM
     */
    get bpm() {
        if (!this.transport) return 120;
        return this.transport.bpm;
    }

    /**
     * Get isPlaying state
     */
    get isPlaying() {
        if (!this.transport) return false;
        return this.transport.isPlaying;
    }

    /**
     * Get isRecording state
     */
    get isRecording() {
        if (!this.transport) return false;
        return this.transport.isRecording;
    }

    /**
     * Get MIDI notes (backward compatibility)
     */
    getMidiNotes() {
        // Convert clips to old format for backward compatibility
        const clips = this.midiRecorder ? this.midiRecorder.getClips() : [];
        const notes = [];

        for (const clip of clips) {
            const notePairs = new Map();
            
            for (const event of clip.events) {
                if (event.type === 'noteOn') {
                    notePairs.set(event.noteKey, {
                        frequency: event.frequency,
                        noteKey: event.noteKey,
                        startBeat: this.transport.secondsToBeats(clip.startTime + event.time),
                        duration: 0.5,
                        velocity: event.velocity
                    });
                } else if (event.type === 'noteOff') {
                    const note = notePairs.get(event.noteKey);
                    if (note) {
                        note.duration = this.transport.secondsToBeats(clip.startTime + event.time) - note.startBeat;
                    }
                }
            }

            notes.push(...Array.from(notePairs.values()));
        }

        return notes;
    }

    /**
     * Clear MIDI notes
     */
    clearMidiNotes() {
        if (this.midiRecorder) {
            this.midiRecorder.clearClips();
        }
    }

    /**
     * Update MIDI part (backward compatibility - no-op now)
     */
    updateMidiPart() {
        // No-op - playback scheduler handles this automatically
    }

    /**
     * Event system methods
     */
    on(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].push(callback);
        }
    }

    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                (cb) => cb !== callback
            );
        }
    }

    emit(eventName, data = null) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach((callback) => {
                callback(data);
            });
        }
    }

    /**
     * Get DAW state
     */
    getState() {
        if (!this.transport) {
            return {
                bpm: 120,
                beatsPerBar: 4,
                loopLengthBars: 4,
                loopLengthBeats: 16,
                isPlaying: false,
                isRecording: false,
                currentBeat: 0,
                currentBar: 0,
                formattedTime: '00:00:0.0',
                progress: 0
            };
        }

        const state = this.transport.getState();
        const loopLengthBeats = state.loopLengthBars * this.transport.beatsPerBar;
        
        return {
            ...state,
            beatsPerBar: this.transport.beatsPerBar,
            loopLengthBeats: loopLengthBeats,
            formattedTime: this.getFormattedTime(),
            progress: (state.currentBeat / loopLengthBeats) * 100
        };
    }
}
