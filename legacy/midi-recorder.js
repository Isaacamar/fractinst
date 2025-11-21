/**
 * MIDI Recorder - Records MIDI events with proper timestamps
 * Uses Transport's time as the reference clock
 */

class MidiRecorder {
    constructor(transport, synthEngine) {
        this.transport = transport;
        this.synthEngine = synthEngine;
        
        // Recording state
        this.isRecording = false;
        this.recordingStartTime = 0; // Transport time when recording started
        
        // Current clip being recorded
        this.currentClip = null;
        
        // Track for storing clips
        this.track = {
            id: 'track-1',
            name: 'Track 1',
            clips: []
        };
        
        // Pending note-ons (waiting for note-offs)
        this.pendingNotes = new Map(); // noteKey -> { note, startTime }
    }
    
    /**
     * Start recording a new clip
     */
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordingStartTime = this.transport.getCurrentTime();
        
        // Create new clip
        this.currentClip = {
            id: `clip-${Date.now()}`,
            startTime: this.recordingStartTime,
            length: 0, // Will be updated when recording stops
            events: []
        };
        
        this.pendingNotes.clear();
        
        console.log('MIDI recording started at', this.recordingStartTime, 'seconds');
    }
    
    /**
     * Stop recording and finalize the clip
     */
    stopRecording() {
        if (!this.isRecording) return null;
        
        const now = this.transport.getCurrentTime();
        
        // Close any pending notes
        for (const [noteKey, pending] of this.pendingNotes.entries()) {
            this.recordNoteOff(noteKey, now);
        }
        
        // Finalize clip length
        if (this.currentClip && this.currentClip.events.length > 0) {
            const lastEvent = this.currentClip.events[this.currentClip.events.length - 1];
            this.currentClip.length = Math.max(0.1, lastEvent.time + (lastEvent.type === 'noteOn' ? 0.5 : 0));
        } else {
            this.currentClip.length = Math.max(0.1, now - this.recordingStartTime);
        }
        
        // Add clip to track if it has events
        let recordedClip = null;
        if (this.currentClip && this.currentClip.events.length > 0) {
            this.track.clips.push(this.currentClip);
            recordedClip = this.currentClip;
        }
        
        this.isRecording = false;
        this.currentClip = null;
        this.pendingNotes.clear();
        
        console.log('MIDI recording stopped. Clip length:', recordedClip?.length, 'seconds');
        
        return recordedClip;
    }
    
    /**
     * Record a note-on event
     */
    recordNoteOn(noteData) {
        if (!this.isRecording || !this.currentClip) return;
        
        const now = this.transport.getCurrentTime();
        let relativeTime = now - this.recordingStartTime;
        
        // Don't record negative times (before recording actually started)
        if (relativeTime < 0) return;
        
        // Create note-on event
        const event = {
            type: 'noteOn',
            channel: 0,
            time: relativeTime,
            note: noteData.midiNote || this.frequencyToMidi(noteData.frequency),
            velocity: noteData.velocity || 100,
            frequency: noteData.frequency,
            noteKey: noteData.noteKey
        };
        
        this.currentClip.events.push(event);
        
        // Store pending note for note-off matching
        this.pendingNotes.set(noteData.noteKey, {
            note: event,
            startTime: relativeTime
        });
        
        console.log('Recorded note-on:', event.note, 'at', relativeTime.toFixed(3), 's');
    }
    
    /**
     * Record a note-off event
     */
    recordNoteOff(noteKey, timeOverride = null) {
        if (!this.isRecording || !this.currentClip) return;
        
        const pending = this.pendingNotes.get(noteKey);
        if (!pending) return;
        
        const now = timeOverride || this.transport.getCurrentTime();
        const relativeTime = now - this.recordingStartTime;
        
        // Create note-off event
        const event = {
            type: 'noteOff',
            channel: 0,
            time: relativeTime,
            note: pending.note.note,
            velocity: 0,
            noteKey: noteKey
        };
        
        this.currentClip.events.push(event);
        this.pendingNotes.delete(noteKey);
        
        console.log('Recorded note-off:', event.note, 'at', relativeTime.toFixed(3), 's');
    }
    
    /**
     * Get the current clip being recorded
     */
    getCurrentClip() {
        return this.currentClip;
    }
    
    /**
     * Get all clips in the track
     */
    getClips() {
        return this.track.clips;
    }
    
    /**
     * Clear all clips
     */
    clearClips() {
        this.track.clips = [];
        this.currentClip = null;
    }
    
    /**
     * Convert frequency to MIDI note number
     */
    frequencyToMidi(frequency) {
        return Math.round(12 * Math.log2(frequency / 440) + 69);
    }
    
    /**
     * Get all events from all clips as a flat list
     * Useful for playback scheduling
     */
    getAllEvents() {
        const allEvents = [];
        
        for (const clip of this.track.clips) {
            for (const event of clip.events) {
                // Convert relative time to absolute timeline time
                allEvents.push({
                    ...event,
                    absoluteTime: clip.startTime + event.time
                });
            }
        }
        
        // Sort by absolute time
        allEvents.sort((a, b) => a.absoluteTime - b.absoluteTime);
        
        return allEvents;
    }
}

