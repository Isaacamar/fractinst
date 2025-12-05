/**
 * MIDI Recorder - Records MIDI events with proper timestamps
 * Uses Transport's time as the reference clock
 */

import type { Transport } from './Transport';
import type { AudioEngine } from './AudioEngine';

export interface RecordedMidiEvent {
  type: 'noteOn' | 'noteOff';
  channel: number;
  time: number; // Time in seconds relative to clip start
  note: number; // MIDI note number (C4 = 60)
  velocity: number; // 0-127
  frequency?: number; // Calculated frequency (optional for noteOff)
  noteKey: string | number; // Unique key identifier
}

export interface MidiClip {
  id: string;
  startTime: number; // Transport time when recording started
  length: number; // Duration in seconds
  events: RecordedMidiEvent[];
}

export interface MidiTrack {
  id: string;
  name: string;
  clips: MidiClip[];
}

interface PendingNote {
  note: RecordedMidiEvent;
  startTime: number;
}

export class MidiRecorder {
  private transport: Transport;

  // Recording state
  private isRecording: boolean = false;
  private recordingStartTime: number = 0; // Transport time when recording started

  // Current clip being recorded
  private currentClip: MidiClip | null = null;

  // Track for storing clips
  private track: MidiTrack = {
    id: 'track-1',
    name: 'Track 1',
    clips: []
  };

  // Pending note-ons (waiting for note-offs)
  private pendingNotes: Map<string | number, PendingNote> = new Map();

  constructor(transport: Transport, _synthEngine: AudioEngine) {
    this.transport = transport;
  }

  /**
   * Start recording a new clip
   */
  startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.recordingStartTime = this.transport.getCurrentTime();

    // Create new clip with unique ID
    this.currentClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  stopRecording(): MidiClip | null {
    if (!this.isRecording) return null;

    const now = this.transport.getCurrentTime();

    // Close any pending notes
    for (const [noteKey] of this.pendingNotes.entries()) {
      this.recordNoteOff(noteKey, now);
    }

    // Finalize clip length based on actual recording duration
    // Snap to next bar for cleaner loops if longer than 1 bar
    const rawDuration = now - this.recordingStartTime;
    const bars = Math.max(1, Math.ceil(rawDuration / (60 / this.transport.getBpm() * 4)));
    const snappedDuration = bars * (60 / this.transport.getBpm() * 4);

    // Use the longer of: snapped duration or actual recording time
    if (this.currentClip) {
      this.currentClip.length = Math.max(0.1, snappedDuration);
    }

    // Return the clip (don't add to internal track - tracks manage their own clips)
    const recordedClip: MidiClip | null = this.currentClip && this.currentClip.events.length > 0
      ? { ...this.currentClip } // Return a copy, don't keep reference
      : null;

    this.isRecording = false;
    this.currentClip = null;
    this.pendingNotes.clear();

    console.log('MIDI recording stopped. Clip length:', recordedClip?.length, 'seconds');

    return recordedClip;
  }

  /**
   * Record a note-on event
   */
  recordNoteOn(noteData: {
    midiNote?: number;
    frequency: number;
    velocity?: number;
    noteKey: string | number;
  }): void {
    if (!this.isRecording || !this.currentClip) return;

    const now = this.transport.getCurrentTime();
    let relativeTime = now - this.recordingStartTime;

    // Don't record negative times (before recording actually started)
    if (relativeTime < 0) return;

    // Create note-on event
    const event: RecordedMidiEvent = {
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
  recordNoteOff(noteKey: string | number, timeOverride: number | null = null): void {
    if (!this.isRecording || !this.currentClip) return;

    const pending = this.pendingNotes.get(noteKey);
    if (!pending) return;

    const now = timeOverride || this.transport.getCurrentTime();
    const relativeTime = now - this.recordingStartTime;

    // Create note-off event
    const event: RecordedMidiEvent = {
      type: 'noteOff',
      channel: 0,
      time: relativeTime,
      note: pending.note.note,
      velocity: 0,
      frequency: pending.note.frequency,
      noteKey: noteKey
    };

    this.currentClip.events.push(event);
    this.pendingNotes.delete(noteKey);

    console.log('Recorded note-off:', event.note, 'at', relativeTime.toFixed(3), 's');
  }

  /**
   * Get the current clip being recorded
   */
  getCurrentClip(): MidiClip | null {
    return this.currentClip;
  }

  /**
   * Get all clips in the track
   */
  getClips(): MidiClip[] {
    return this.track.clips;
  }

  /**
   * Clear all clips
   */
  clearClips(): void {
    this.track.clips = [];
    this.currentClip = null;
  }

  /**
   * Convert frequency to MIDI note number
   */
  private frequencyToMidi(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  }

  /**
   * Get all events from all clips as a flat list
   * Useful for playback scheduling
   */
  getAllEvents(): Array<RecordedMidiEvent & { absoluteTime: number }> {
    const allEvents: Array<RecordedMidiEvent & { absoluteTime: number }> = [];

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

  // Getters
  getIsRecording(): boolean {
    return this.isRecording;
  }

  getTrack(): MidiTrack {
    return this.track;
  }
}

