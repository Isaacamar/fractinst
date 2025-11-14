/**
 * Keyboard Help Modal - Visualizes keyboard controls in real-time
 * Shows piano-style keyboard layout with color-coded keys and live press feedback
 */

class KeyboardHelp {
    constructor(keyboardController) {
        this.keyboardController = keyboardController;
        this.isOpen = false;
        this.pressedKeys = new Set();

        // Key definitions matching the new piano layout
        this.keyDefinitions = this.buildKeyDefinitions();

        this.createModal();
        this.attachEvents();
    }

    /**
     * Build comprehensive key definitions
     */
    buildKeyDefinitions() {
        return {
            // White keys (A to K = C to C)
            'KeyA': { label: 'A', type: 'white', note: 'C', position: 0 },
            'KeyS': { label: 'S', type: 'white', note: 'D', position: 1 },
            'KeyD': { label: 'D', type: 'white', note: 'E', position: 2 },
            'KeyF': { label: 'F', type: 'white', note: 'F', position: 3 },
            'KeyG': { label: 'G', type: 'white', note: 'G', position: 4 },
            'KeyH': { label: 'H', type: 'white', note: 'A', position: 5 },
            'KeyJ': { label: 'J', type: 'white', note: 'B', position: 6 },
            'KeyK': { label: 'K', type: 'white', note: 'C', position: 7 },

            // Black keys (W E T Y U) - positioned between white keys
            // White keys are at positions: A=0, S=1, D=2, F=3, G=4, H=5, J=6, K=7
            // Black keys sit between: A-S, S-D, F-G, G-H, H-J (no black between D-F or J-K)
            'KeyW': { label: 'W', type: 'black', note: 'C#', betweenKeys: [0, 1] },  // Between A(C) and S(D)
            'KeyE': { label: 'E', type: 'black', note: 'D#', betweenKeys: [1, 2] },  // Between S(D) and D(E)
            'KeyT': { label: 'T', type: 'black', note: 'F#', betweenKeys: [3, 4] },  // Between F(F) and G(G)
            'KeyY': { label: 'Y', type: 'black', note: 'G#', betweenKeys: [4, 5] },  // Between G(G) and H(A)
            'KeyU': { label: 'U', type: 'black', note: 'A#', betweenKeys: [5, 6] },  // Between H(A) and J(B)

            // Chord keys (Number row)
            'Digit1': { label: '1', type: 'chord', name: 'Major' },
            'Digit2': { label: '2', type: 'chord', name: 'Minor' },
            'Digit3': { label: '3', type: 'chord', name: 'Dim' },
            'Digit4': { label: '4', type: 'chord', name: 'Aug' },
            'Digit5': { label: '5', type: 'chord', name: 'Maj7' },
            'Digit6': { label: '6', type: 'chord', name: 'Min7' },
            'Digit7': { label: '7', type: 'chord', name: 'Dom7' },
            'Digit8': { label: '8', type: 'chord', name: 'Sus4' },
            'Digit9': { label: '9', type: 'chord', name: 'Sus2' },
            'Digit0': { label: '0', type: 'chord', name: 'Power' },

            // Function keys
            'Equal': { label: '+', type: 'function', desc: 'Octave Up' },
            'Minus': { label: '-', type: 'function', desc: 'Octave Down' },
        };
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'keyboard-help-modal';
        modal.className = 'keyboard-help-modal';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="keyboard-help-content">
                <div class="keyboard-help-header">
                    <h2>KEYBOARD CONTROLS</h2>
                    <button id="keyboard-help-close" class="keyboard-help-close">✕</button>
                </div>

                <div class="keyboard-help-body">
                    <div class="keyboard-info-text">
                        <p><strong>Chords:</strong> Number keys 1-0 play chord presets</p>
                        <p><strong>Piano Keys:</strong> A S D F G H J K = White keys (C D E F G A B C)</p>
                        <p><strong>Sharps/Flats:</strong> W E T Y U = Black keys (C# D# F# G# A#)</p>
                        <p><strong>Octave:</strong> + / - keys to move up/down octaves</p>
                    </div>

                    <div class="piano-keyboard-container">
                        ${this.createChordKeys()}
                        ${this.createPianoKeyboard()}
                    </div>

                    <div class="keyboard-help-footer">
                        <p>Press keys to see them light up in real-time!</p>
                        <p>Current Octave: <span id="keyboard-help-octave">C4</span></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
    }

    /**
     * Create chord keys HTML (number row)
     */
    createChordKeys() {
        const chordKeys = [
            'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
            'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'
        ];

        let html = '<div class="chord-keys-row">';

        chordKeys.forEach(keyCode => {
            const keyDef = this.keyDefinitions[keyCode];
            html += `
                <div class="chord-key" data-key="${keyCode}">
                    <span class="chord-key-label">${keyDef.label}</span>
                    <span class="chord-key-name">${keyDef.name}</span>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Create piano keyboard HTML
     */
    createPianoKeyboard() {
        const whiteKeys = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'];
        const blackKeys = ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'];

        let html = '<div class="piano-keyboard">';

        // Create white keys
        html += '<div class="white-keys-row">';
        whiteKeys.forEach(keyCode => {
            const keyDef = this.keyDefinitions[keyCode];
            html += `
                <div class="piano-key white-key" data-key="${keyCode}">
                    <span class="piano-key-label">${keyDef.label}</span>
                    <span class="piano-key-note">${keyDef.note}</span>
                </div>
            `;
        });
        html += '</div>';

        // Create black keys with positioning
        // Calculate position based on which white keys they're between
        html += '<div class="black-keys-row">';
        blackKeys.forEach(keyCode => {
            const keyDef = this.keyDefinitions[keyCode];
            // Each white key takes 12.5% width (100% / 8 keys)
            // Black key should be positioned at the midpoint between two white keys
            const whiteKeyWidth = 100 / 8; // 12.5%
            const [leftWhiteKey, rightWhiteKey] = keyDef.betweenKeys;
            // Position at the boundary between the two white keys
            const leftPercent = ((leftWhiteKey + 1) * whiteKeyWidth);
            html += `
                <div class="piano-key black-key" data-key="${keyCode}" style="left: ${leftPercent}%">
                    <span class="piano-key-label">${keyDef.label}</span>
                    <span class="piano-key-note">${keyDef.note}</span>
                </div>
            `;
        });
        html += '</div>';

        html += '</div>';

        // Add function keys section
        html += `
            <div class="function-keys-section">
                <div class="function-key" data-key="Minus">
                    <span class="key-label">-</span>
                    <span class="key-desc">Octave Down</span>
                </div>
                <div class="function-key" data-key="Equal">
                    <span class="key-label">+</span>
                    <span class="key-desc">Octave Up</span>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Attach event listeners
     */
    attachEvents() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'keyboard-help-close') {
                this.close();
            }
            // Close when clicking outside the modal content
            if (e.target.id === 'keyboard-help-modal') {
                this.close();
            }
        });

        // Keyboard events for real-time visualization
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Handle key down for visualization
     */
    onKeyDown(event) {
        if (!this.isOpen) return;

        const keyCode = event.code;
        if (this.pressedKeys.has(keyCode)) return;

        this.pressedKeys.add(keyCode);
        this.highlightKey(keyCode, true);
    }

    /**
     * Handle key up for visualization
     */
    onKeyUp(event) {
        if (!this.isOpen) return;

        const keyCode = event.code;
        if (!this.pressedKeys.has(keyCode)) return;

        this.pressedKeys.delete(keyCode);
        this.highlightKey(keyCode, false);
    }

    /**
     * Highlight or unhighlight a key
     */
    highlightKey(keyCode, isPressed) {
        const keyElement = this.modal.querySelector(`[data-key="${keyCode}"]`);
        if (keyElement) {
            if (isPressed) {
                keyElement.classList.add('key-pressed');
            } else {
                keyElement.classList.remove('key-pressed');
            }
        }
    }

    /**
     * Update octave display
     */
    updateOctaveDisplay() {
        const octaveElement = this.modal.querySelector('#keyboard-help-octave');
        if (octaveElement && this.keyboardController) {
            const octave = this.keyboardController.getOctave();
            octaveElement.textContent = `C${octave}`;
        }
    }

    /**
     * Open the modal
     */
    open() {
        this.modal.style.display = 'flex';
        this.isOpen = true;
        this.updateOctaveDisplay();

        // Start updating octave display periodically
        this.octaveUpdateInterval = setInterval(() => {
            this.updateOctaveDisplay();
        }, 500);
    }

    /**
     * Close the modal
     */
    close() {
        this.modal.style.display = 'none';
        this.isOpen = false;

        // Clear all pressed keys
        this.pressedKeys.forEach(keyCode => {
            this.highlightKey(keyCode, false);
        });
        this.pressedKeys.clear();

        // Stop updating octave display
        if (this.octaveUpdateInterval) {
            clearInterval(this.octaveUpdateInterval);
            this.octaveUpdateInterval = null;
        }
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}
