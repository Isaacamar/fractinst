/**
 * Piano Roll Editor - Visual sequencer for recording and editing notes
 */

class PianoRoll {
    constructor(dawCore, synthEngine) {
        this.dawCore = dawCore;
        this.synthEngine = synthEngine;

        // Configuration
        this.numBars = 4;
        this.beatsPerBar = 4;
        this.lowestNote = 24; // C1
        this.highestNote = 96; // C7
        this.noteRange = this.highestNote - this.lowestNote + 1; // 73 notes

        // Layout
        this.pixelsPerBeat = 100; // Larger for better spacing
        this.keyHeight = 20;

        // State
        this.isDraggingPlayhead = false;
        this.currentPosition = 0; // In beats
        this.playbackLine = null;
        this.gridContainer = null;

        this.initializePianoRoll();
        this.setupPlaybackLineSync();
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
                const frequency = this.synthEngine.constructor.midiToFrequency(midiNote);
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
     * Render time ruler at the top (4 sections, 4 beats each)
     */
    renderTimeRuler() {
        const ruler = document.getElementById('time-ruler');
        ruler.innerHTML = '';

        // Create 4 bar sections
        for (let bar = 0; bar < this.numBars; bar++) {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.flex = '1';
            barContainer.style.borderRight = '2px solid #fff';

            // Create 4 beats per bar
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
     * Render the main grid (4 bars, 4 beats each)
     */
    renderGrid() {
        const grid = document.getElementById('piano-roll-grid');
        grid.innerHTML = '';

        // Create a row for each note
        for (let midiNote = this.lowestNote; midiNote <= this.highestNote; midiNote++) {
            const row = document.createElement('div');
            row.className = 'piano-roll-row';
            row.dataset.midiNote = midiNote;

            // Create 4 bars
            for (let bar = 0; bar < this.numBars; bar++) {
                const barContainer = document.createElement('div');
                barContainer.style.display = 'flex';
                barContainer.style.flex = '1';
                barContainer.style.borderRight = '2px solid #fff';

                // Create 4 beats per bar
                for (let beat = 0; beat < this.beatsPerBar; beat++) {
                    const cell = document.createElement('div');
                    cell.className = 'piano-roll-beat';
                    cell.style.flex = '1';
                    cell.style.borderRight = '1px solid #333';
                    cell.dataset.bar = bar;
                    cell.dataset.beat = beat;
                    cell.dataset.midiNote = midiNote;

                    // Click to add note
                    cell.addEventListener('click', () => {
                        this.addNote(midiNote, bar * this.beatsPerBar + beat);
                    });

                    barContainer.appendChild(cell);
                }

                row.appendChild(barContainer);
            }

            grid.appendChild(row);
        }

        // Set grid dimensions
        const totalBeats = this.numBars * this.beatsPerBar;
        const gridWidth = totalBeats * this.pixelsPerBeat;
        grid.style.width = gridWidth + 'px';
    }

    /**
     * Add a note to the grid (placeholder - will record actual notes later)
     */
    addNote(midiNote, beat) {
        console.log('Note added:', this.midiToNoteName(midiNote), 'at beat', beat);
        // This will be extended to actually record the note
    }

    /**
     * Setup playback line dragging with better UX
     */
    setupPlaybackLineDragging() {
        this.playbackLine = document.getElementById('playback-line');
        this.gridContainer = document.getElementById('piano-roll-grid-container');

        if (!this.playbackLine || !this.gridContainer) return;

        // Mouse down on playback line - larger hit area
        this.playbackLine.addEventListener('mousedown', (e) => {
            this.isDraggingPlayhead = true;
            this.playbackLine.classList.add('dragging');
            e.preventDefault();
            console.log('Started dragging playback line');
        });

        // Mouse move to drag playback line
        document.addEventListener('mousemove', (e) => {
            if (!this.isDraggingPlayhead) return;

            this.scrubToMousePosition(e);
        });

        // Mouse up anywhere to stop dragging
        document.addEventListener('mouseup', () => {
            if (this.isDraggingPlayhead) {
                this.isDraggingPlayhead = false;
                this.playbackLine.classList.remove('dragging');
                console.log('Stopped dragging playback line');
            }
        });

        // Also allow clicking anywhere in the grid to scrub
        this.gridContainer.addEventListener('click', (e) => {
            // Only scrub if not clicking on a grid cell (future note editing)
            if (e.target === this.gridContainer || e.target.classList.contains('piano-roll-grid')) {
                this.scrubToMousePosition(e);
            }
        });
    }

    /**
     * Scrub to mouse position
     */
    scrubToMousePosition(e) {
        const rect = this.gridContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + this.gridContainer.scrollLeft;

        // Calculate position as percentage of scroll width
        const scrollWidth = this.gridContainer.scrollWidth;
        const percentage = Math.max(0, Math.min(100, (x / scrollWidth) * 100));

        // Convert to beat position
        const totalBeats = this.numBars * this.beatsPerBar;
        const beatPosition = (percentage / 100) * totalBeats;

        // Update DAW and playback line
        this.dawCore.currentBeat = Math.max(0, Math.min(totalBeats - 0.01, beatPosition));
        this.updatePlaybackLine(this.dawCore.currentBeat);

        console.log('Scrubbed to beat:', this.dawCore.currentBeat.toFixed(2));
    }

    /**
     * Update playback line position smoothly with GPU acceleration
     */
    updatePlaybackLine(beatPosition) {
        if (!this.playbackLine || !this.gridContainer) return;

        const totalBeats = this.numBars * this.beatsPerBar;
        const percentage = (beatPosition / totalBeats) * 100;

        // Use left property for positioning (more reliable for absolute positioned elements)
        this.playbackLine.style.left = percentage + '%';
    }

    /**
     * Setup syncing playback line with DAW playback
     */
    setupPlaybackLineSync() {
        // The app.js will call updatePlaybackLine on beatChanged events
        // This keeps the playback line in sync with the DAW timing
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
        if (instrumentView) instrumentView.style.display = 'none';
        if (pianoRollView) pianoRollView.style.display = 'flex';
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
