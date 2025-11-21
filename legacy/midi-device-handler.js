/**
 * MIDI Device Handler - Connects hardware MIDI devices via Web MIDI API
 * Routes MIDI note-on/note-off events to the synth engine and DAW core
 */

class MidiDeviceHandler {
    constructor(synthEngine, dawCore = null) {
        this.synthEngine = synthEngine;
        this.dawCore = dawCore;
        this.midiAccess = null;
        this.inputs = new Map(); // Map of MIDI input ports
        this.enabled = false;
        
        // Track active notes for proper note-off handling
        this.activeNotes = new Map(); // midiNote -> { frequency, noteKey }
    }

    /**
     * Request access to MIDI devices
     */
    async initialize() {
        if (!navigator.requestMIDIAccess) {
            console.warn('Web MIDI API not supported in this browser');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            this.setupMidiInputs();
            
            // Listen for new MIDI devices being connected
            this.midiAccess.onstatechange = () => {
                this.setupMidiInputs();
            };
            
            console.log('MIDI device access granted');
            return true;
        } catch (error) {
            console.error('Failed to access MIDI devices:', error);
            return false;
        }
    }

    /**
     * Setup MIDI input ports
     */
    setupMidiInputs() {
        if (!this.midiAccess) return;

        // Clear existing inputs
        this.inputs.clear();

        // Get all MIDI input ports
        const inputs = this.midiAccess.inputs.values();
        
        for (const input of inputs) {
            if (!this.inputs.has(input.id)) {
                input.onmidimessage = (event) => {
                    if (this.enabled) {
                        this.handleMidiMessage(event);
                    }
                };
                this.inputs.set(input.id, input);
                console.log('MIDI input connected:', input.name, input.manufacturer);
            }
        }

        if (this.inputs.size === 0) {
            console.log('No MIDI input devices found');
        }
    }

    /**
     * Handle incoming MIDI messages
     */
    handleMidiMessage(event) {
        const [status, note, velocity] = event.data;
        const messageType = status & 0xf0; // Upper nibble
        const channel = status & 0x0f; // Lower nibble (we ignore this for now)

        // Note On (0x90) or Note Off (0x80)
        if (messageType === 0x90 && velocity > 0) {
            // Note On
            this.handleNoteOn(note, velocity);
        } else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
            // Note Off (either explicit 0x80 or note-on with velocity 0)
            this.handleNoteOff(note);
        }
        // Could add support for other MIDI messages here:
        // - Control Change (0xB0)
        // - Program Change (0xC0)
        // - Pitch Bend (0xE0)
        // - etc.
    }

    /**
     * Handle MIDI note-on event
     */
    handleNoteOn(midiNote, velocity) {
        // Convert MIDI note to frequency
        const frequency = LowLatencySynthEngine.midiToFrequency(midiNote);
        
        // Create a unique note key for this MIDI note
        const noteKey = `midi-${midiNote}`;
        
        // Store active note
        this.activeNotes.set(midiNote, { frequency, noteKey });
        
        // Normalize velocity (0-127) to 0-1 range for audio engine
        const normalizedVelocity = velocity / 127;
        
        console.log('MIDI Note On:', midiNote, 'Frequency:', frequency.toFixed(2), 'Velocity:', velocity);
        
        // Play note on synth engine
        if (this.synthEngine) {
            this.synthEngine.playNote(frequency, noteKey, normalizedVelocity);
        }
        
        // Record MIDI note if recording
        if (this.dawCore) {
            this.dawCore.recordMidiNote({
                frequency: frequency,
                noteKey: noteKey,
                midiNote: midiNote,
                velocity: velocity // Store raw MIDI velocity (0-127)
            });
        }
    }

    /**
     * Handle MIDI note-off event
     */
    handleNoteOff(midiNote) {
        const noteData = this.activeNotes.get(midiNote);
        
        if (!noteData) {
            // Note wasn't tracked, might have been started before we enabled MIDI
            return;
        }
        
        console.log('MIDI Note Off:', midiNote);
        
        // Release note on synth engine
        if (this.synthEngine) {
            this.synthEngine.releaseNote(noteData.noteKey);
        }
        
        // Record MIDI note release if recording
        if (this.dawCore) {
            this.dawCore.recordMidiNoteRelease(noteData.noteKey);
        }
        
        // Remove from active notes
        this.activeNotes.delete(midiNote);
    }

    /**
     * Enable MIDI input processing
     */
    enable() {
        this.enabled = true;
        console.log('MIDI device handler enabled');
    }

    /**
     * Disable MIDI input processing
     */
    disable() {
        this.enabled = false;
        // Release all active notes
        for (const [midiNote, noteData] of this.activeNotes) {
            if (this.synthEngine) {
                this.synthEngine.releaseNote(noteData.noteKey);
            }
        }
        this.activeNotes.clear();
        console.log('MIDI device handler disabled');
    }

    /**
     * Set DAW core reference (for recording)
     */
    setDawCore(dawCore) {
        this.dawCore = dawCore;
    }

    /**
     * Get list of connected MIDI input devices
     */
    getInputDevices() {
        const devices = [];
        for (const [id, input] of this.inputs) {
            devices.push({
                id: id,
                name: input.name,
                manufacturer: input.manufacturer
            });
        }
        return devices;
    }
}

