/**
 * Piano Roll Editor - Visual sequencer for recording and editing notes
 * Refactored to use Transport system with seconds-based timing
 */

class PianoRoll {
    constructor(transport, synthEngine, midiRecorder, dawCore = null) {
        this.transport = transport;
        this.synthEngine = synthEngine;
        this.midiRecorder = midiRecorder;
        this.dawCore = dawCore; // Optional reference for seeking

        // Configuration
        this.numBars = 4;
        this.beatsPerBar = 4;
        this.lowestNote = 24; // C1
        this.highestNote = 96; // C7
        this.noteRange = this.highestNote - this.lowestNote + 1; // 73 notes

        // Layout - using pixels per second for more accurate scaling
        this.pixelsPerSecond = 50; // Will be recalculated based on BPM
        this.keyHeight = 20;

        // State
        this.isDraggingPlayhead = false;
        this.dragStartX = 0;
        this.playbackLine = null;
        this.gridContainer = null;
        this.gridElement = null;
        
        // Cached note elements
        this.noteElements = new Map(); // clipId -> Set of note elements

        this.initializePianoRoll();
        this.setupPlaybackLineSync();
        this.updatePixelsPerSecond();
    }

    /**
     * Update pixels per second based on current BPM
     */
    updatePixelsPerSecond() {
        // Calculate pixels per beat, then convert to pixels per second
        const pixelsPerBeat = 100;
        const secondsPerBeat = 60 / this.transport.bpm;
        this.pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
    }

    /**
     * Initialize piano roll UI elements
     */
    initializePianoRoll() {
        this.renderPianoKeys();
        this.renderTimeRuler();
        this.renderGrid();
        this.setupPlaybackLineDragging();
    }

    /**
     * Render piano keys on the left sidebar
     */
    renderPianoKeys() {
        const keysList = document.getElementById('piano-keys-list');
        if (!keysList) return;
        
        keysList.innerHTML = '';

        // Create keys from lowest to highest (reversed because flex-direction: column-reverse)
        for (let midiNote = this.lowestNote; midiNote <= this.highestNote; midiNote++) {
            const keyEl = document.createElement('div');
            keyEl.className = 'piano-key';
            keyEl.dataset.midiNote = midiNote;

            // Get note name
            const noteName = this.midiToNoteName(midiNote);
            keyEl.textContent = noteName;

            // Highlight C notes
            if (noteName.startsWith('C')) {
                keyEl.style.background = '#333';
                keyEl.style.color = '#fff';
            }

            // Click to play note
            keyEl.addEventListener('mousedown', () => {
                const frequency = LowLatencySynthEngine.midiToFrequency(midiNote);
                this.synthEngine.playNote(frequency, `piano-roll-${midiNote}`);
                keyEl.classList.add('active');
            });

            keyEl.addEventListener('mouseup', () => {
                this.synthEngine.releaseNote(`piano-roll-${midiNote}`);
                keyEl.classList.remove('active');
            });

            keyEl.addEventListener('mouseleave', () => {
                this.synthEngine.releaseNote(`piano-roll-${midiNote}`);
                keyEl.classList.remove('active');
            });

            keysList.appendChild(keyEl);
        }
    }

    /**
     * Render time ruler at the top
     */
    renderTimeRuler() {
        const ruler = document.getElementById('time-ruler');
        if (!ruler) return;
        
        ruler.innerHTML = '';

        // Create bar sections
        for (let bar = 0; bar < this.numBars; bar++) {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.flex = '1';
            barContainer.style.borderRight = '2px solid #fff';

            // Create beats per bar
            for (let beat = 0; beat < this.beatsPerBar; beat++) {
                const marker = document.createElement('div');
                marker.className = 'time-marker';
                marker.style.flex = '1';
                marker.style.borderRight = '1px solid #666';

                if (beat === 0) {
                    marker.textContent = bar + 1;
                    marker.style.fontWeight = 'bold';
                    marker.style.color = '#fff';
                }

                barContainer.appendChild(marker);
            }

            ruler.appendChild(barContainer);
        }
    }

    /**
     * Render the main grid
     */
    renderGrid() {
        const grid = document.getElementById('piano-roll-grid');
        if (!grid) return;
        
        this.gridElement = grid;
        grid.innerHTML = '';

        // Set grid as relative positioning container for absolute-positioned notes
        grid.style.position = 'relative';

        // Calculate grid width in seconds
        const totalSeconds = this.transport.beatsToSeconds(this.numBars * this.beatsPerBar);
        const gridWidth = totalSeconds * this.pixelsPerSecond;
        grid.style.width = gridWidth + 'px';

        // Create a row for each note
        for (let midiNote = this.lowestNote; midiNote <= this.highestNote; midiNote++) {
            const row = document.createElement('div');
            row.className = 'piano-roll-row';
            row.dataset.midiNote = midiNote;
            row.style.display = 'flex';
            row.style.height = this.keyHeight + 'px';
            row.style.position = 'relative';

            // Create bar containers for visual structure
            for (let bar = 0; bar < this.numBars; bar++) {
                const barContainer = document.createElement('div');
                barContainer.style.display = 'flex';
                barContainer.style.flex = '1';
                barContainer.style.borderRight = '2px solid #fff';
                barContainer.style.position = 'relative';

                // Create beat cells
                for (let beat = 0; beat < this.beatsPerBar; beat++) {
                    const cell = document.createElement('div');
                    cell.className = 'piano-roll-beat';
                    cell.style.flex = '1';
                    cell.style.borderRight = '1px solid #333';
                    cell.dataset.bar = bar;
                    cell.dataset.beat = beat;
                    cell.dataset.midiNote = midiNote;

                    barContainer.appendChild(cell);
                }

                row.appendChild(barContainer);
            }

            grid.appendChild(row);
        }
    }

    /**
     * Display MIDI clips on the piano roll
     */
    displayClips(clips) {
        if (!clips || clips.length === 0) {
            this.clearAllNotes();
            return;
        }

        const grid = this.gridElement;
        if (!grid) return;

        // Clear previous notes
        this.clearAllNotes();

        // Render each clip
        for (const clip of clips) {
            this.renderClip(clip);
        }
    }

    /**
     * Render a single clip
     */
    renderClip(clip) {
        const grid = this.gridElement;
        if (!grid || !clip.events || clip.events.length === 0) return;

        const clipNoteElements = new Set();

        // Group note-ons with their note-offs
        const notePairs = new Map(); // noteKey -> { noteOn, noteOff }

        for (const event of clip.events) {
            if (event.type === 'noteOn') {
                notePairs.set(event.noteKey, { noteOn: event, noteOff: null });
            } else if (event.type === 'noteOff') {
                const pair = notePairs.get(event.noteKey);
                if (pair) {
                    pair.noteOff = event;
                }
            }
        }

        // Render each note pair
        for (const [noteKey, pair] of notePairs.entries()) {
            if (!pair.noteOn) continue;

            const noteOn = pair.noteOn;
            const noteOff = pair.noteOff;

            // Calculate note duration
            let duration = 0.5; // Default duration
            if (noteOff) {
                duration = noteOff.time - noteOn.time;
            }

            // Calculate position on timeline
            const absoluteStartTime = clip.startTime + noteOn.time;
            const absoluteEndTime = absoluteStartTime + duration;

            // Convert to pixels
            const startPixels = absoluteStartTime * this.pixelsPerSecond;
            const durationPixels = duration * this.pixelsPerSecond;

            // Find the row for this MIDI note
            const row = grid.querySelector(`[data-midi-note="${noteOn.note}"]`);
            if (!row) continue;

            // Create note element
            const noteEl = document.createElement('div');
            noteEl.className = 'midi-note';
            noteEl.style.position = 'absolute';
            noteEl.style.left = startPixels + 'px';
            noteEl.style.top = '0';
            noteEl.style.width = Math.max(4, durationPixels) + 'px';
            noteEl.style.height = this.keyHeight + 'px';
            noteEl.title = `${this.midiToNoteName(noteOn.note)} (${duration.toFixed(2)}s)`;
            noteEl.dataset.clipId = clip.id;
            noteEl.dataset.noteKey = noteKey;

            row.appendChild(noteEl);
            clipNoteElements.add(noteEl);
        }

        // Store note elements for this clip
        this.noteElements.set(clip.id, clipNoteElements);
    }

    /**
     * Clear all notes
     */
    clearAllNotes() {
        const grid = this.gridElement;
        if (!grid) return;

        const oldNotes = grid.querySelectorAll('.midi-note');
        oldNotes.forEach(el => el.remove());
        this.noteElements.clear();
    }

    /**
     * Update playback line position based on transport time
     */
    updatePlaybackLine(timeSeconds) {
        if (!this.playbackLine || this.isDraggingPlayhead) return;

        // Calculate position as percentage of total timeline
        const totalSeconds = this.transport.beatsToSeconds(this.numBars * this.beatsPerBar);
        const percentage = Math.max(0, Math.min(100, (timeSeconds / totalSeconds) * 100));

        // Update position smoothly
        this.playbackLine.style.left = percentage.toFixed(3) + '%';
    }

    /**
     * Setup playback line dragging and scrubbing
     */
    setupPlaybackLineDragging() {
        this.playbackLine = document.getElementById('playback-line');
        this.gridContainer = document.querySelector('.piano-roll-grid-container') || 
                             document.querySelector('.piano-roll-area');

        if (!this.playbackLine || !this.gridContainer) return;

        // Mouse down on playback line or grid
        const handleMouseDown = (e) => {
            // Check if clicking on playback line or grid area
            if (e.target === this.playbackLine || 
                e.target.classList.contains('piano-roll-grid') ||
                e.target.classList.contains('piano-roll-beat')) {
                this.isDraggingPlayhead = true;
                this.dragStartX = e.clientX;
                this.playbackLine.classList.add('dragging');
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Mouse move to drag playback line
        const handleMouseMove = (e) => {
            if (!this.isDraggingPlayhead) return;

            const rect = this.gridContainer.getBoundingClientRect();
            const x = e.clientX - rect.left + this.gridContainer.scrollLeft;

            // Calculate time from mouse position
            const totalSeconds = this.transport.beatsToSeconds(this.numBars * this.beatsPerBar);
            const totalPixels = totalSeconds * this.pixelsPerSecond;
            const timeSeconds = Math.max(0, Math.min(totalSeconds, x / this.pixelsPerSecond));

            // Update visual position
            const percentage = (timeSeconds / totalSeconds) * 100;
            this.playbackLine.style.left = percentage.toFixed(3) + '%';

            // Store for seek on mouseup
            this.scrubTime = timeSeconds;
        };

        // Mouse up to seek transport
        const handleMouseUp = () => {
            if (this.isDraggingPlayhead) {
                this.isDraggingPlayhead = false;
                this.playbackLine.classList.remove('dragging');

                // Seek transport to scrubbed position
                if (this.scrubTime !== undefined) {
                    const wasPlaying = this.transport.isPlaying;
                    
                    // Use dawCore.seek if available (handles scheduler reset)
                    if (this.dawCore) {
                        this.dawCore.seek(this.scrubTime);
                    } else {
                        // Fallback to direct transport seek
                        this.transport.seek(this.scrubTime);
                        if (wasPlaying) {
                            this.transport.play();
                        }
                    }
                    
                    delete this.scrubTime;
                }
            }
        };

        this.gridContainer.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Setup syncing playback line with Transport
     */
    setupPlaybackLineSync() {
        // Register with transport for smooth updates
        this.transport.onUpdate((timeSeconds) => {
            this.updatePlaybackLine(timeSeconds);
        });
    }

    /**
     * Update display when BPM changes
     */
    onBpmChange() {
        this.updatePixelsPerSecond();
        this.renderGrid();
        // Re-render clips with new scaling
        const clips = this.midiRecorder.getClips();
        this.displayClips(clips);
    }

    /**
     * Convert MIDI note to note name
     */
    midiToNoteName(midiNote) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const note = notes[midiNote % 12];
        return note + octave;
    }

    /**
     * Show/hide piano roll view
     */
    show() {
        const instrumentView = document.querySelector('.daw-layout');
        const pianoRollView = document.getElementById('piano-roll-view');
        
        console.log('PianoRoll.show() called');
        console.log('Instrument view:', instrumentView);
        console.log('Piano roll view:', pianoRollView);
        
        if (instrumentView) {
            instrumentView.style.display = 'none';
            console.log('Hid instrument view');
        } else {
            console.warn('Instrument view not found');
        }
        
        if (pianoRollView) {
            pianoRollView.style.display = 'flex';
            console.log('Showed piano roll view');
        } else {
            console.error('Piano roll view element not found!');
        }
    }

    /**
     * Switch back to instrument view
     */
    hide() {
        const instrumentView = document.querySelector('.daw-layout');
        const pianoRollView = document.getElementById('piano-roll-view');
        if (instrumentView) instrumentView.style.display = 'grid';
        if (pianoRollView) pianoRollView.style.display = 'none';
    }
}
