/**
 * DAW Core - Wrapper around Transport, MidiRecorder, and PlaybackScheduler
 * Provides high-level DAW functionality
 */

import { Transport } from './Transport';
import { MidiRecorder } from './MidiRecorder';
import { PlaybackScheduler } from './PlaybackScheduler';
import type { AudioEngine } from './AudioEngine';
import type { MidiClip } from './MidiRecorder';

type EventType = 'beatChanged' | 'barChanged' | 'loopComplete' | 'playbackStart' | 'playbackStop' | 'recordingStart' | 'recordingStop' | 'midiNoteRecorded';

export class DAWCore {
  private transport: Transport | null = null;
  private midiRecorder: MidiRecorder | null = null;
  private playbackScheduler: PlaybackScheduler | null = null;
  private synthEngine: AudioEngine | null = null;
  private audioContext: AudioContext | null = null;

  // Event system
  private eventListeners: Record<EventType, Array<(data?: any) => void>> = {
    beatChanged: [],
    barChanged: [],
    loopComplete: [],
    playbackStart: [],
    playbackStop: [],
    recordingStart: [],
    recordingStop: [],
    midiNoteRecorded: []
  };

  // Metronome
  private metronomeEnabled: boolean = false;
  private leadInBeatCount: number = 0;
  private isLeadIn: boolean = false;

  /**
   * Initialize with audio context and synth engine
   */
  initialize(audioContext: AudioContext, synthEngine: AudioEngine): void {
    this.audioContext = audioContext;
    this.synthEngine = synthEngine;

    // Create transport
    this.transport = new Transport(audioContext);
    this.transport.setBpm(120);
    this.transport.setLoopLengthBars(4);

    // Create MIDI recorder
    this.midiRecorder = new MidiRecorder(this.transport, synthEngine);

    // Create playback scheduler
    this.playbackScheduler = new PlaybackScheduler(this.transport, synthEngine, this.midiRecorder);

    // Setup transport callbacks for event system
    this.setupTransportCallbacks();

    console.log('DAW Core initialized with new Transport system');
  }

  /**
   * Setup transport callbacks to emit events
   */
  private setupTransportCallbacks(): void {
    if (!this.transport) return;

    let lastBeat = -1;
    let lastBar = -1;

        this.transport.onUpdate(() => {
      if (!this.transport) return;

      const currentBeat = Math.floor(this.transport.getCurrentBeat());
      const currentBar = this.transport.getCurrentBar();

      // Emit beat changed event
      if (currentBeat !== lastBeat) {
        this.emit('beatChanged', {
          beat: currentBeat,
          bar: currentBar,
          subBeat: this.transport.getCurrentBeat() % 1
        });
        lastBeat = currentBeat;

        // Play metronome
        if (this.metronomeEnabled && this.synthEngine) {
          const beatInBar = currentBeat % 4; // Assuming 4/4 time
          const frequency = beatInBar === 0 ? 1000 : 600;
          this.synthEngine.playMetronomeClick(frequency, 0.1);
        }

        // Track lead-in beats
        if (this.isLeadIn) {
          this.leadInBeatCount++;
          if (this.leadInBeatCount >= 4) {
            this.isLeadIn = false;
            this.leadInBeatCount = 0;
            // Start actual recording
            if (this.midiRecorder) {
              this.midiRecorder.startRecording();
              this.transport!.setIsRecording(true);
              this.emit('recordingStart'); // Emit actual recording start
            }
          }
        }
      }

      // Emit bar changed event
      if (currentBar !== lastBar) {
        this.emit('barChanged', {
          bar: currentBar,
          beat: currentBeat % 4
        });
        lastBar = currentBar;
      }

      // Check for loop completion
      const loopLengthBeats = this.transport.getLoopLengthBars() * 4;
      if (currentBeat >= loopLengthBeats - 1 && lastBeat < loopLengthBeats - 1) {
        this.emit('loopComplete');
      }
    });
  }

  /**
   * Set audio context
   */
  setAudioContext(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    if (this.synthEngine && !this.transport) {
      this.initialize(audioContext, this.synthEngine);
    }
  }

  /**
   * Set synth engine
   */
  setSynthEngine(synthEngine: AudioEngine): void {
    this.synthEngine = synthEngine;
    if (this.audioContext && !this.transport) {
      this.initialize(this.audioContext, synthEngine);
    }
  }

  /**
   * Ensure initialization is complete
   */
  ensureInitialized(): boolean {
    if (!this.transport && this.audioContext && this.synthEngine) {
      this.initialize(this.audioContext, this.synthEngine);
    }
    return !!this.transport && !!this.midiRecorder;
  }

  /**
   * Play
   */
  async play(): Promise<void> {
    if (!this.transport) {
      if (!this.ensureInitialized()) {
        console.error('Cannot play: DAW core not initialized');
        return;
      }
    }

    await this.transport!.play();
    this.playbackScheduler!.start();
    this.emit('playbackStart');
  }

  /**
   * Stop
   */
  stop(): void {
    if (!this.transport) return;

    this.transport.stop();
    this.playbackScheduler!.stop();
    this.emit('playbackStop');
  }

  /**
   * Record
   */
  async record(): Promise<void> {
    if (!this.midiRecorder || !this.transport) {
      if (!this.ensureInitialized()) {
        console.error('Cannot record: DAW core not initialized');
        return;
      }
    }

    // Start playback
    await this.transport!.play();
    this.playbackScheduler!.start();

    // Start lead-in
    this.isLeadIn = true;
    this.leadInBeatCount = 0;
    this.emit('recordingStart'); // Emit lead-in start

    // Start recording after lead-in (handled in callback)
    // The actual recording start will be emitted in setupTransportCallbacks
    // when leadInBeatCount reaches 4
  }

  /**
   * Stop recording
   */
  stopRecording(): MidiClip | null {
    if (!this.midiRecorder) return null;

    const clip = this.midiRecorder.stopRecording();
    this.transport!.setIsRecording(false);
    this.isLeadIn = false;

    this.emit('recordingStop', { clips: this.midiRecorder.getClips() });
    return clip;
  }

  /**
   * Seek
   */
  seek(timeSeconds: number): void {
    if (!this.transport) return;

    this.transport.seek(timeSeconds);
    this.playbackScheduler!.reset();

    // If was playing, restart scheduler
    if (this.transport.getIsPlaying()) {
      this.playbackScheduler!.start();
    }
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    if (!this.transport) return;
    this.transport.setBpm(bpm);
  }

  /**
   * Toggle metronome
   */
  toggleMetronome(): boolean {
    this.metronomeEnabled = !this.metronomeEnabled;
    return this.metronomeEnabled;
  }

  /**
   * Record MIDI note
   */
  recordMidiNote(noteData: { midiNote?: number; frequency: number; velocity?: number; noteKey: string | number }): void {
    if (!this.midiRecorder) return;
    this.midiRecorder.recordNoteOn(noteData);
    this.emit('midiNoteRecorded', noteData);
  }

  /**
   * Record MIDI note release
   */
  recordMidiNoteRelease(noteKey: string | number): void {
    if (!this.midiRecorder) return;
    this.midiRecorder.recordNoteOff(noteKey);
  }

  /**
   * Get formatted time
   */
  getFormattedTime(): string {
    if (!this.transport) return '00:00:0.0';
    return this.transport.formatTime();
  }

  /**
   * Event system
   */
  on(event: EventType, callback: (data?: any) => void): void {
    this.eventListeners[event].push(callback);
  }

  off(event: EventType, callback: (data?: any) => void): void {
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  private emit(event: EventType, data?: any): void {
    this.eventListeners[event].forEach(callback => callback(data));
  }

  // Getters
  getTransport(): Transport | null {
    return this.transport;
  }

  getMidiRecorder(): MidiRecorder | null {
    return this.midiRecorder;
  }

  getPlaybackScheduler(): PlaybackScheduler | null {
    return this.playbackScheduler;
  }

  getSynthEngine(): AudioEngine | null {
    return this.synthEngine;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  get loopLengthBars(): number {
    return this.transport?.getLoopLengthBars() || 4;
  }
}

