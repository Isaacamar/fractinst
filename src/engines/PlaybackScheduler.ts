/**
 * Playback Scheduler - Schedules MIDI events for playback
 * Uses Web Audio API scheduling with lookahead window
 */

import type { Transport } from './Transport';
import type { AudioEngine } from './AudioEngine';
import type { MidiRecorder } from './MidiRecorder';

interface ScheduledEvent {
  scheduled: boolean;
  noteKey: string | number;
}

interface ActivePlaybackNote {
  startTime: number;
  event: any;
}

export class PlaybackScheduler {
  private transport: Transport;
  private synthEngine: AudioEngine;
  private midiRecorder: MidiRecorder;
  
  // Scheduling state
  private scheduledEvents: Map<string, ScheduledEvent> = new Map();
  private lookAheadTime: number = 0.1; // Schedule 100ms ahead
  private scheduleInterval: number = 25; // Check every 25ms
  private scheduleTimerId: ReturnType<typeof setInterval> | null = null;
  
  // Active notes being played
  private activePlaybackNotes: Map<string | number, ActivePlaybackNote> = new Map();
  
  // Track last scheduled time to prevent double-scheduling
  private lastScheduledTime: number = 0;
  
  constructor(transport: Transport, synthEngine: AudioEngine, midiRecorder: MidiRecorder) {
    this.transport = transport;
    this.synthEngine = synthEngine;
    this.midiRecorder = midiRecorder;
  }
  
  /**
   * Start the scheduler
   */
  start(): void {
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
  stop(): void {
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
  private scheduleEvents(): void {
    if (!this.transport.getIsPlaying()) return;
    
    const audioContext = this.synthEngine.getContext();
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
      
      // Handle looping - check if clip overlaps with current playback window (including loops)
      const loopLength = this.transport.getLoopLengthBars() * 4 * (60 / this.transport.getBpm());
      
      // Calculate which loop iteration we're in
      const currentLoopStart = Math.floor(currentTime / loopLength) * loopLength;
      
      // Check if clip overlaps with current loop iteration
      const clipInLoopStart = clipStartTime % loopLength;
      
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
  private scheduleNoteOn(event: any, scheduleTime: number, eventId: string): void {
    const audioContext = this.synthEngine.getContext();
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
      setTimeout(() => {
        // Double-check transport is still playing
        if (this.transport.getIsPlaying()) {
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
  private scheduleNoteOff(_event: any, scheduleTime: number, eventId: string): void {
    const audioContext = this.synthEngine.getContext();
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
  private cleanupScheduledEvents(_currentTime: number): void {
    // Remove events that are more than one loop cycle in the past
    // In practice, we keep them for the entire loop cycle to handle looping correctly
  }
  
  /**
   * Reset scheduler (called on stop or seek)
   */
  reset(): void {
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

