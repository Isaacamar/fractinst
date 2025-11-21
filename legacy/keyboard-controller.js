/**
 * Keyboard Controller - Maps computer keyboard to MIDI notes
 * Piano layout: QWERTY style (2 octaves)
 */

class KeyboardController {
    constructor(synthEngine, options = {}) {
        this.synthEngine = synthEngine;
        this.dawCore = options.dawCore || null; // For MIDI recording
        this.onOctaveChange = options.onOctaveChange || null; // Callback for octave changes

        // Configuration
        this.octaveOffset = options.octaveOffset || 4; // C4 = MIDI 60
        this.keyboardLayout = options.layout || 'qwerty'; // Can be 'qwerty', 'zxcv', or 'full'

        // Track pressed keys to prevent re-triggering
        this.pressedKeys = new Set();
        this.activeChords = new Set(); // Track active chord keys

        // Note mapping: Key code -> MIDI note offset
        // Relative to octaveOffset
        this.keyMap = this.getKeyMapForLayout(this.keyboardLayout);

        // Chord definitions (intervals from root)
        this.chordMap = {
            'Digit1': { name: 'Major', intervals: [0, 4, 7] },           // Major triad
            'Digit2': { name: 'Minor', intervals: [0, 3, 7] },           // Minor triad
            'Digit3': { name: 'Dim', intervals: [0, 3, 6] },             // Diminished
            'Digit4': { name: 'Aug', intervals: [0, 4, 8] },             // Augmented
            'Digit5': { name: 'Maj7', intervals: [0, 4, 7, 11] },        // Major 7th
            'Digit6': { name: 'Min7', intervals: [0, 3, 7, 10] },        // Minor 7th
            'Digit7': { name: 'Dom7', intervals: [0, 4, 7, 10] },        // Dominant 7th
            'Digit8': { name: 'Sus4', intervals: [0, 5, 7] },            // Suspended 4th
            'Digit9': { name: 'Sus2', intervals: [0, 2, 7] },            // Suspended 2nd
            'Digit0': { name: 'Power', intervals: [0, 7, 12] }           // Power chord
        };

        // Visual feedback
        this.keyElements = new Map(); // DOM elements for visual feedback
        this.keyLabels = new Map(); // Key -> Note name mapping

        this.attachEvents();
    }

    /**
     * Get keyboard layout mapping
     */
    getKeyMapForLayout(layout) {
        if (layout === 'zxcv') {
            return this.getZXCVLayout();
        } else if (layout === 'full') {
            return this.getFullLayout();
        }
        // Default: QWERTY layout
        return this.getQWERTYLayout();
    }

    /**
     * QWERTY Layout (Piano-style)
     * White keys: A S D F G H J K (C D E F G A B C)
     * Black keys: W E T Y U (C# D# F# G# A#)
     */
    getQWERTYLayout() {
        return {
            // White keys (A to K = C to C)
            'KeyA': { offset: 0, note: 'C' },     // C
            'KeyS': { offset: 2, note: 'D' },     // D
            'KeyD': { offset: 4, note: 'E' },     // E
            'KeyF': { offset: 5, note: 'F' },     // F
            'KeyG': { offset: 7, note: 'G' },     // G
            'KeyH': { offset: 9, note: 'A' },     // A
            'KeyJ': { offset: 11, note: 'B' },    // B
            'KeyK': { offset: 12, note: 'C' },    // C (octave +1)

            // Black keys (W E T Y U = C# D# F# G# A#)
            'KeyW': { offset: 1, note: 'C#' },    // C#
            'KeyE': { offset: 3, note: 'D#' },    // D#
            'KeyT': { offset: 6, note: 'F#' },    // F#
            'KeyY': { offset: 8, note: 'G#' },    // G#
            'KeyU': { offset: 10, note: 'A#' }    // A#
        };
    }

    /**
     * ZXCV Layout (chromatic, single octave - good for beginners)
     */
    getZXCVLayout() {
        return {
            'KeyZ': { offset: 0, note: 'C' },
            'KeyX': { offset: 1, note: 'C#' },
            'KeyC': { offset: 2, note: 'D' },
            'KeyV': { offset: 3, note: 'D#' },
            'KeyB': { offset: 4, note: 'E' },
            'KeyN': { offset: 5, note: 'F' },
            'KeyM': { offset: 6, note: 'F#' },
            'Comma': { offset: 7, note: 'G' },
            'Period': { offset: 8, note: 'G#' },
            'Slash': { offset: 9, note: 'A' },
            'KeyA': { offset: 10, note: 'A#' },
            'KeyS': { offset: 11, note: 'B' }
        };
    }

    /**
     * Full 3-octave chromatic layout
     */
    getFullLayout() {
        const layout = {};
        const keySequence = [
            'KeyQ', 'Digit1', 'KeyW', 'Digit2', 'KeyE', 'KeyR', 'Digit3', 'KeyT', 'Digit4', 'KeyY', 'Digit5', 'KeyU',
            'KeyA', 'Digit6', 'KeyS', 'Digit7', 'KeyD', 'KeyF', 'Digit8', 'KeyG', 'Digit9', 'KeyH', 'Digit0', 'KeyJ',
            'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'
        ];

        const notes = [
            'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
        ];

        let offset = 0;
        keySequence.forEach((key, index) => {
            layout[key] = {
                offset: offset,
                note: notes[offset % 12]
            };
            offset++;
        });

        return layout;
    }

    /**
     * Attach keyboard events
     */
    attachEvents() {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    /**
     * Handle key down
     */
    onKeyDown(event) {
        const keyCode = event.code;

        // Check if it's an octave control key
        if (keyCode === 'Equal') { // + key
            event.preventDefault();
            this.octaveUp();
            return;
        }
        if (keyCode === 'Minus') { // - key
            event.preventDefault();
            this.octaveDown();
            return;
        }

        // Check if it's a chord key
        if (this.chordMap[keyCode]) {
            if (this.activeChords.has(keyCode)) return;
            event.preventDefault();
            this.playChord(keyCode);
            return;
        }

        // Ignore if key is already pressed or not in map
        if (this.pressedKeys.has(keyCode) || !this.keyMap[keyCode]) {
            return;
        }

        event.preventDefault();

        this.pressedKeys.add(keyCode);

        const mapping = this.keyMap[keyCode];
        const midiNote = (this.octaveOffset * 12) + mapping.offset;
        // Use static method from LowLatencySynthEngine or fallback calculation
        const frequency = (typeof LowLatencySynthEngine !== 'undefined' && LowLatencySynthEngine.midiToFrequency) 
            ? LowLatencySynthEngine.midiToFrequency(midiNote)
            : 440 * Math.pow(2, (midiNote - 69) / 12);

        console.log('Key pressed:', keyCode, 'Note:', mapping.note, 'Frequency:', frequency);

        // Record MIDI note if recording
        if (this.dawCore) {
            this.dawCore.recordMidiNote({
                frequency: frequency,
                noteKey: keyCode,
                midiNote: midiNote,
                velocity: 100
            });
        }

        // Ensure audio is initialized
        if (!this.synthEngine.audioContext) {
            console.log('Audio context not initialized on keyboard press, initializing now...');
            this.synthEngine.resumeAudio().then(() => {
                this.synthEngine.playNote(frequency, keyCode);
                this.visualizeKeyPress(keyCode, mapping.note, true);
            });
        } else {
            // Play note
            this.synthEngine.playNote(frequency, keyCode); // Use keyCode as unique noteKey
            // Visual feedback
            this.visualizeKeyPress(keyCode, mapping.note, true);
        }
    }

    /**
     * Handle key up
     */
    onKeyUp(event) {
        const keyCode = event.code;

        // Check if it's a chord key
        if (this.chordMap[keyCode]) {
            if (!this.activeChords.has(keyCode)) return;
            event.preventDefault();
            this.releaseChord(keyCode);
            return;
        }

        if (!this.pressedKeys.has(keyCode)) {
            return;
        }

        event.preventDefault();

        this.pressedKeys.delete(keyCode);

        // Record MIDI note release if recording
        if (this.dawCore) {
            this.dawCore.recordMidiNoteRelease(keyCode);
        }

        // Release note
        this.synthEngine.releaseNote(keyCode);

        // Visual feedback
        const mapping = this.keyMap[keyCode];
        if (mapping) {
            this.visualizeKeyPress(keyCode, mapping.note, false);
        }
    }

    /**
     * Play a chord
     */
    playChord(keyCode) {
        const chord = this.chordMap[keyCode];
        if (!chord) return;

        this.activeChords.add(keyCode);

        // Root note is C at current octave
        const rootMidi = (this.octaveOffset * 12);

        console.log(`Playing ${chord.name} chord:`, chord.intervals);

        // Ensure audio is initialized
        if (!this.synthEngine.audioContext) {
            this.synthEngine.resumeAudio().then(() => {
                this.playChordNotes(keyCode, rootMidi, chord);
            });
        } else {
            this.playChordNotes(keyCode, rootMidi, chord);
        }
    }

    /**
     * Play individual chord notes
     */
    playChordNotes(keyCode, rootMidi, chord) {
        chord.intervals.forEach((interval, index) => {
            const midiNote = rootMidi + interval;
            const frequency = (typeof LowLatencySynthEngine !== 'undefined' && LowLatencySynthEngine.midiToFrequency) 
                ? LowLatencySynthEngine.midiToFrequency(midiNote)
                : 440 * Math.pow(2, (midiNote - 69) / 12);
            const noteKey = `${keyCode}_${index}`;

            this.synthEngine.playNote(frequency, noteKey);

            // Record chord notes if recording
            if (this.dawCore) {
                this.dawCore.recordMidiNote({
                    frequency: frequency,
                    noteKey: noteKey,
                    midiNote: midiNote,
                    velocity: 100
                });
            }
        });
    }

    /**
     * Release a chord
     */
    releaseChord(keyCode) {
        const chord = this.chordMap[keyCode];
        if (!chord) return;

        this.activeChords.delete(keyCode);

        // Release all notes in the chord
        chord.intervals.forEach((interval, index) => {
            const noteKey = `${keyCode}_${index}`;
            this.synthEngine.releaseNote(noteKey);

            // Record release if recording
            if (this.dawCore) {
                this.dawCore.recordMidiNoteRelease(noteKey);
            }
        });
    }

    /**
     * Visual feedback for key press
     */
    visualizeKeyPress(keyCode, noteName, isPressed) {
        // Get or create key element
        if (!this.keyElements.has(keyCode)) {
            const keyElement = document.querySelector(`[data-key-code="${keyCode}"]`);
            if (keyElement) {
                this.keyElements.set(keyCode, keyElement);
            }
        }

        const element = this.keyElements.get(keyCode);
        if (element) {
            if (isPressed) {
                element.classList.add('key-active');
            } else {
                element.classList.remove('key-active');
            }
        }
    }

    /**
     * Get MIDI note for a key code
     */
    getMidiNoteForKey(keyCode) {
        const mapping = this.keyMap[keyCode];
        if (!mapping) return null;
        return (this.octaveOffset * 12) + mapping.offset;
    }

    /**
     * Get note name for a key code
     */
    getNoteNameForKey(keyCode) {
        const mapping = this.keyMap[keyCode];
        if (!mapping) return null;
        return `${mapping.note}${this.octaveOffset + Math.floor(mapping.offset / 12)}`;
    }

    /**
     * Change octave up
     */
    octaveUp() {
        this.octaveOffset = Math.min(8, this.octaveOffset + 1);
        if (this.onOctaveChange) {
            this.onOctaveChange();
        }
        console.log('Octave up:', this.octaveOffset);
    }

    /**
     * Change octave down
     */
    octaveDown() {
        this.octaveOffset = Math.max(0, this.octaveOffset - 1);
        if (this.onOctaveChange) {
            this.onOctaveChange();
        }
        console.log('Octave down:', this.octaveOffset);
    }

    /**
     * Release all pressed keys
     */
    releaseAll() {
        this.pressedKeys.forEach((keyCode) => {
            this.synthEngine.releaseNote(keyCode);
            const mapping = this.keyMap[keyCode];
            if (mapping) {
                this.visualizeKeyPress(keyCode, mapping.note, false);
            }
        });
        this.pressedKeys.clear();
    }

    /**
     * Get current octave
     */
    getOctave() {
        return this.octaveOffset;
    }

    /**
     * Set octave
     */
    setOctave(octave) {
        this.octaveOffset = Math.max(0, Math.min(8, octave));
    }

    /**
     * Get all available key codes for the current layout
     */
    getAvailableKeys() {
        return Object.keys(this.keyMap);
    }

    /**
     * Get human-readable key name
     */
    getKeyLabel(keyCode) {
        const keyLabels = {
            'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R', 'KeyT': 'T', 'KeyY': 'Y', 'KeyU': 'U',
            'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D', 'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyJ': 'J',
            'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V', 'KeyB': 'B', 'KeyN': 'N', 'KeyM': 'M',
            'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
            'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
            'Comma': ',', 'Period': '.', 'Slash': '/'
        };
        return keyLabels[keyCode] || keyCode;
    }
}
