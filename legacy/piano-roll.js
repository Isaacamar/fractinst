/**
 * Piano Roll Editor - Visual sequencer for recording and editing notes
 * Refactored to use Transport system with seconds-based timing
 * Supports real-time recording, quantization, and note editing
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

        // Quantization
        this.quantizeGrid = 64; // 1/64 note quantization
        this.quantizeEnabled = true;

        // State
        this.isDraggingPlayhead = false;
        this.dragStartX = 0;
        this.playbackLine = null;
        this.gridContainer = null;
        this.gridElement = null;
        
        // Note editing state
        this.draggedNote = null;
        this.dragStartPos = null;
        this.isDraggingNote = false;
        
        // Cached note elements
        this.noteElements = new Map(); // clipId -> Set of note elements
        this.noteDataMap = new Map(); // noteElement -> note data

        this.initializePianoRoll();
        this.setupPlaybackLineSync();
        this.setupRealTimeRecording();
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
     * Setup real-time recording updates
     */
    setupRealTimeRecording() {
        // Update piano roll in real-time during recording
        let lastUpdateTime = 0;
        const updateInterval = 50; // Update every 50ms

        const updateRecording = () => {
            if (this.midiRecorder && this.midiRecorder.isRecording && this.midiRecorder.currentClip) {
                const now = performance.now();
                if (now - lastUpdateTime > updateInterval) {
                    // Render current clip in real-time
                    const clips = [this.midiRecorder.currentClip];
                    this.displayClips(clips);
                    lastUpdateTime = now;
                }
            }
            requestAnimationFrame(updateRecording);
        };
        updateRecording();
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

                // Create beat cells with 1/64 quantization grid
                for (let beat = 0; beat < this.beatsPerBar; beat++) {
                    const cell = document.createElement('div');
                    cell.className = 'piano-roll-beat';
                    cell.style.flex = '1';
                    cell.style.borderRight = '1px solid #333';
                    cell.style.position = 'relative';
                    cell.dataset.bar = bar;
                    cell.dataset.beat = beat;
                    cell.dataset.midiNote = midiNote;

                    // Add 1/64 grid lines (16 subdivisions per beat)
                    for (let i = 1; i < 16; i++) {
                        const gridLine = document.createElement('div');
                        gridLine.style.position = 'absolute';
                        gridLine.style.left = `${(i / 16) * 100}%`;
                        gridLine.style.top = '0';
                        gridLine.style.width = '1px';
                        gridLine.style.height = '100%';
                        gridLine.style.background = 'rgba(255, 255, 255, 0.05)';
                        gridLine.style.pointerEvents = 'none';
                        cell.appendChild(gridLine);
                    }

                    barContainer.appendChild(cell);
                }

                row.appendChild(barContainer);
            }

            grid.appendChild(row);
        }
    }

    /**
     * Quantize time to grid (1/64 notes)
     */
    quantizeTime(timeSeconds) {
        if (!this.quantizeEnabled) return timeSeconds;
        
        const beats = this.transport.secondsToBeats(timeSeconds);
        const quantizedBeats = Math.round(beats * this.quantizeGrid) / this.quantizeGrid;
        return this.transport.beatsToSeconds(quantizedBeats);
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

            // Quantize start time if enabled
            let startTime = noteOn.time;
            if (this.quantizeEnabled) {
                startTime = this.quantizeTime(clip.startTime + startTime) - clip.startTime;
            }

            // Calculate position on timeline
            const absoluteStartTime = clip.startTime + startTime;
            const absoluteEndTime = absoluteStartTime + duration;

            // Convert to pixels
            const startPixels = absoluteStartTime * this.pixelsPerSecond;
            const durationPixels = duration * this.pixelsPerSecond;

            // Find the row for this MIDI note
            const row = grid.querySelector(`[data-midi-note="${noteOn.note}"]`);
            if (!row) continue;

            // Check if note element already exists (for real-time updates)
            let noteEl = Array.from(this.noteDataMap.keys()).find(el => 
                el.dataset.noteKey === noteKey && 
                el.dataset.clipId === clip.id
            );

            if (!noteEl) {
                // Create note element
                noteEl = document.createElement('div');
            noteEl.className = 'midi-note';
            noteEl.style.position = 'absolute';
                noteEl.style.cursor = 'move';
                noteEl.dataset.clipId = clip.id;
                noteEl.dataset.noteKey = noteKey;
                noteEl.dataset.midiNote = noteOn.note;
                
                // Store note data
                this.noteDataMap.set(noteEl, {
                    clip: clip,
                    noteOn: noteOn,
                    noteOff: noteOff,
                    noteKey: noteKey
                });

                // Setup note dragging
                this.setupNoteDragging(noteEl);
                
                row.appendChild(noteEl);
            }

            // Update note position and size
            noteEl.style.left = startPixels + 'px';
            noteEl.style.top = '0';
            noteEl.style.width = Math.max(4, durationPixels) + 'px';
            noteEl.style.height = this.keyHeight + 'px';
            noteEl.title = `${this.midiToNoteName(noteOn.note)} (${duration.toFixed(2)}s)`;

            clipNoteElements.add(noteEl);
        }

        // Store note elements for this clip
        this.noteElements.set(clip.id, clipNoteElements);
    }

    /**
     * Setup note dragging for editing
     */
    setupNoteDragging(noteEl) {
        let startX = 0;
        let startLeft = 0;
        let startNote = 0;

        noteEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isDraggingNote = true;
            this.draggedNote = noteEl;
            startX = e.clientX;
            startLeft = parseFloat(noteEl.style.left) || 0;
            
            const noteData = this.noteDataMap.get(noteEl);
            if (noteData) {
                startNote = noteData.noteOn.note;
            }

            noteEl.style.opacity = '0.7';
            noteEl.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDraggingNote || !this.draggedNote) return;

            const deltaX = e.clientX - startX;
            const deltaPixels = deltaX;
            const deltaSeconds = deltaPixels / this.pixelsPerSecond;
            
            const noteData = this.noteDataMap.get(this.draggedNote);
            if (!noteData) return;

            // Calculate new start time
            const originalStartTime = noteData.clip.startTime + noteData.noteOn.time;
            let newStartTime = originalStartTime + deltaSeconds;
            
            // Quantize if enabled
            if (this.quantizeEnabled) {
                newStartTime = this.quantizeTime(newStartTime);
            }

            // Update visual position
            const relativeTime = newStartTime - noteData.clip.startTime;
            const newPixels = relativeTime * this.pixelsPerSecond;
            this.draggedNote.style.left = newPixels + 'px';

            // Check if dragging vertically (change note)
            const gridRect = this.gridContainer.getBoundingClientRect();
            const mouseY = e.clientY - gridRect.top;
            const rowIndex = Math.floor(mouseY / this.keyHeight);
            const newMidiNote = this.lowestNote + (this.noteRange - 1 - rowIndex);
            
            if (newMidiNote >= this.lowestNote && newMidiNote <= this.highestNote && newMidiNote !== startNote) {
                // Update note visually
                const newRow = this.gridElement.querySelector(`[data-midi-note="${newMidiNote}"]`);
                if (newRow && this.draggedNote.parentElement !== newRow) {
                    this.draggedNote.remove();
                    newRow.appendChild(this.draggedNote);
                    noteData.noteOn.note = newMidiNote;
                    noteData.noteOff.note = newMidiNote;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (!this.isDraggingNote || !this.draggedNote) return;

            const noteData = this.noteDataMap.get(this.draggedNote);
            if (noteData) {
                // Update note data with new position
                const newLeft = parseFloat(this.draggedNote.style.left) || 0;
                const newStartTime = noteData.clip.startTime + (newLeft / this.pixelsPerSecond);
                
                // Quantize if enabled
                let finalStartTime = newStartTime;
                if (this.quantizeEnabled) {
                    finalStartTime = this.quantizeTime(newStartTime);
                    // Update visual position to snapped position
                    const snappedRelativeTime = finalStartTime - noteData.clip.startTime;
                    const snappedPixels = snappedRelativeTime * this.pixelsPerSecond;
                    this.draggedNote.style.left = snappedPixels + 'px';
                }
                
                const relativeTime = finalStartTime - noteData.clip.startTime;
                noteData.noteOn.time = Math.max(0, relativeTime);

                // Update note-off time to maintain duration
                if (noteData.noteOff) {
                    const duration = noteData.noteOff.time - noteData.noteOn.time;
                    noteData.noteOff.time = noteData.noteOn.time + Math.max(0.01, duration);
                }
            }

            this.draggedNote.style.opacity = '0.9';
            this.draggedNote.classList.remove('dragging');
            this.isDraggingNote = false;
            this.draggedNote = null;
        });
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
        this.noteDataMap.clear();
    }

    /**
     * Update playback line position based on transport time
     */
    updatePlaybackLine(timeSeconds) {
        if (!this.playbackLine || this.isDraggingPlayhead || this.isDraggingNote) return;

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
            // Don't start scrubbing if clicking on a note
            if (e.target.classList.contains('midi-note')) return;
            
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
