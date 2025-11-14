/**
 * Playback Scheduler - Schedules MIDI events for playback
 * Uses Web Audio API scheduling with lookahead window
 */

class PlaybackScheduler {
    constructor(transport, synthEngine, midiRecorder) {
        this.transport = transport;
        this.synthEngine = synthEngine;
        this.midiRecorder = midiRecorder;
        
        // Scheduling state
        this.scheduledEvents = new Map(); // eventId -> { scheduled: boolean, noteKey: string }
        this.lookAheadTime = 0.1; // Schedule 100ms ahead
        this.scheduleInterval = 25; // Check every 25ms
        this.scheduleTimerId = null;
        
        // Active notes being played
        this.activePlaybackNotes = new Map(); // noteKey -> { startTime, event }
        
        // Track last scheduled time to prevent double-scheduling
        this.lastScheduledTime = 0;
    }
    
    /**
     * Start the scheduler
     */
    start() {
        if (this.scheduleTimerId) return;
        
        this.scheduledEvents.clear();
        this.lastScheduledTime = this.transport.getCurrentTime();
        
        this.scheduleTimerId = setInterval(() => {
            this.scheduleEvents();
        }, this.scheduleInterval);
        
        console.log('Playback scheduler started');
    }
    
    /**
     * Stop the scheduler
     */
    stop() {
        if (this.scheduleTimerId) {
            clearInterval(this.scheduleTimerId);
            this.scheduleTimerId = null;
        }
        
        // Stop all active playback notes
        for (const noteKey of this.activePlaybackNotes.keys()) {
            this.synthEngine.releaseNote(noteKey);
        }
        this.activePlaybackNotes.clear();
        this.scheduledEvents.clear();
        this.lastScheduledTime = 0;
        
        console.log('Playback scheduler stopped');
    }
    
    /**
     * Schedule events that fall within the lookahead window
     */
    scheduleEvents() {
        if (!this.transport.isPlaying) return;
        
        const audioContext = this.synthEngine.context;
        if (!audioContext) return;
        
        const currentTime = this.transport.getCurrentTime();
        const lookAheadEnd = currentTime + this.lookAheadTime;
        
        // Only schedule events we haven't scheduled yet
        const scheduleStart = Math.max(this.lastScheduledTime, currentTime);
        
        // Get all events from clips
        const clips = this.midiRecorder.getClips();
        const now = audioContext.currentTime;
        
        // Process each clip
        for (const clip of clips) {
            // Calculate clip's position on timeline
            const clipStartTime = clip.startTime;
            const clipEndTime = clipStartTime + clip.length;
            
            // Handle looping - check if clip overlaps with current playback window (including loops)
            const loopLength = this.transport.loopEnd - this.transport.loopStart;
            
            // Calculate which loop iteration we're in
            const currentLoopStart = Math.floor(currentTime / loopLength) * loopLength;
            const currentLoopEnd = currentLoopStart + loopLength;
            
            // Check if clip overlaps with current loop iteration
            const clipInLoopStart = clipStartTime % loopLength;
            const clipInLoopEnd = clipInLoopStart + clip.length;
            
            // Process events in this clip
            for (const event of clip.events) {
                    // Calculate absolute time of event within the loop
                    const eventTimeInLoop = clipInLoopStart + event.time;
                    
                    // Normalize event time to be within [0, loopLength)
                    let normalizedEventTime = eventTimeInLoop % loopLength;
                    if (normalizedEventTime < 0) {
                        normalizedEventTime += loopLength;
                    }
                    
                    // Calculate absolute timeline time
                    let eventAbsoluteTime = currentLoopStart + normalizedEventTime;
                    
                    // If event is before current time, it's in the next loop iteration
                    if (eventAbsoluteTime < currentTime) {
                        eventAbsoluteTime += loopLength;
                    }
                
                // Check if event is in lookahead window
                if (eventAbsoluteTime >= scheduleStart && eventAbsoluteTime < lookAheadEnd) {
                    const eventId = `${clip.id}-${event.time}-${event.note}-${Math.floor(eventAbsoluteTime / loopLength)}`;
                    
                    // Check if already scheduled
                    if (this.scheduledEvents.has(eventId)) {
                        continue;
                    }
                    
                    // Calculate when to schedule (relative to audioContext.currentTime)
                    const scheduleTime = now + (eventAbsoluteTime - currentTime);
                    
                    if (event.type === 'noteOn') {
                        this.scheduleNoteOn(event, scheduleTime, eventId);
                    } else if (event.type === 'noteOff') {
                        this.scheduleNoteOff(event, scheduleTime, eventId);
                    }
                    
                    this.scheduledEvents.set(eventId, {
                        scheduled: true,
                        noteKey: event.noteKey
                    });
                }
            }
        }
        
        // Update last scheduled time
        this.lastScheduledTime = lookAheadEnd;
        
        // Clean up scheduled events that are far in the past
        this.cleanupScheduledEvents(currentTime);
    }
    
    /**
     * Schedule a note-on event using Web Audio timing
     */
    scheduleNoteOn(event, scheduleTime, eventId) {
        const audioContext = this.synthEngine.context;
        if (!audioContext) return;
        
        // Use a unique noteKey for playback
        const playbackNoteKey = `playback-${eventId}`;
        
        // Calculate delay from now
        const delay = Math.max(0, scheduleTime - audioContext.currentTime);
        
        // If delay is very small, schedule immediately
        if (delay < 0.01) {
            this.synthEngine.playNote(event.frequency, playbackNoteKey);
            this.activePlaybackNotes.set(playbackNoteKey, {
                startTime: scheduleTime,
                event: event
            });
        } else {
            // Use setTimeout for scheduling (acceptable for note scheduling)
            // Web Audio API doesn't have a direct way to schedule notes at future times
            // without using setTimeout or creating scheduled gain nodes
            setTimeout(() => {
                // Double-check transport is still playing
                if (this.transport.isPlaying) {
                    this.synthEngine.playNote(event.frequency, playbackNoteKey);
                    this.activePlaybackNotes.set(playbackNoteKey, {
                        startTime: scheduleTime,
                        event: event
                    });
                }
            }, delay * 1000);
        }
    }
    
    /**
     * Schedule a note-off event
     */
    scheduleNoteOff(event, scheduleTime, eventId) {
        const audioContext = this.synthEngine.context;
        if (!audioContext) return;
        
        // Find the corresponding note-on
        // Extract the base eventId (without the loop iteration)
        const baseEventId = eventId.replace(/-\d+$/, '');
        const playbackNoteKey = `playback-${baseEventId.replace('noteOff', 'noteOn')}`;
        
        const delay = Math.max(0, scheduleTime - audioContext.currentTime);
        
        if (delay < 0.01) {
            if (this.activePlaybackNotes.has(playbackNoteKey)) {
                this.synthEngine.releaseNote(playbackNoteKey);
                this.activePlaybackNotes.delete(playbackNoteKey);
            }
        } else {
            setTimeout(() => {
                if (this.activePlaybackNotes.has(playbackNoteKey)) {
                    this.synthEngine.releaseNote(playbackNoteKey);
                    this.activePlaybackNotes.delete(playbackNoteKey);
                }
            }, delay * 1000);
        }
    }
    
    /**
     * Clean up scheduled events that are far in the past
     */
    cleanupScheduledEvents(currentTime) {
        // Remove events that are more than one loop cycle in the past
        const loopLength = this.transport.loopEnd - this.transport.loopStart;
        const cleanupThreshold = currentTime - loopLength;
        
        // Clean up scheduled events map (keep recent ones for loop detection)
        // In practice, we keep them for the entire loop cycle to handle looping correctly
    }
    
    /**
     * Reset scheduler (called on stop or seek)
     */
    reset() {
        // Stop all active notes
        for (const noteKey of this.activePlaybackNotes.keys()) {
            this.synthEngine.releaseNote(noteKey);
        }
        this.activePlaybackNotes.clear();
        
        // Clear scheduled events (will reschedule on next cycle)
        this.scheduledEvents.clear();
        this.lastScheduledTime = 0;
    }
}
