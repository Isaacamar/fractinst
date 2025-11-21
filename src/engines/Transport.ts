/**
 * Transport - Single source of truth for DAW timing
 * Uses audioContext.currentTime as the primary clock
 * All timing is in seconds, converted to beats when needed for display
 */

export class Transport {
  private audioContext: AudioContext | null;
  
  // Timing state
  private bpm: number = 120;
  private beatsPerBar: number = 4;
  private loopLengthBars: number = 4;
  
  // Playback state
  private isPlaying: boolean = false;
  private isRecording: boolean = false;
  
  // Position tracking (all in seconds)
  private position: number = 0; // Current position in seconds
  private startTime: number = 0; // audioContext.currentTime when playback started
  private positionAtStart: number = 0; // Position when playback started (for seeking)
  
  // Loop state
  private loopStart: number = 0; // Loop start in seconds
  private loopEnd: number = 0; // Loop end in seconds
  private loopEnabled: boolean = true;
  
  // Animation frame for UI updates
  private animationFrameId: number | null = null;
  private updateCallbacks: Array<(time: number) => void> = [];
  
  constructor(audioContext: AudioContext | null = null) {
    this.audioContext = audioContext;
    this.updateLoopBoundaries();
  }
  
  /**
   * Set audio context
   */
  setAudioContext(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.updateLoopBoundaries();
  }
  
  /**
   * Update loop boundaries based on BPM and loop length
   */
  private updateLoopBoundaries(): void {
    const loopLengthBeats = this.loopLengthBars * this.beatsPerBar;
    this.loopEnd = this.beatsToSeconds(loopLengthBeats);
    this.loopStart = 0;
  }
  
  /**
   * Convert beats to seconds
   */
  beatsToSeconds(beats: number): number {
    return (beats / this.bpm) * 60;
  }
  
  /**
   * Convert seconds to beats
   */
  secondsToBeats(seconds: number): number {
    return (seconds * this.bpm) / 60;
  }
  
  /**
   * Get current transport time in seconds
   * This is the single source of truth for timing
   */
  getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) {
      return this.position;
    }
    
    const now = this.audioContext.currentTime;
    const elapsed = now - this.startTime;
    let newPosition = this.positionAtStart + elapsed;
    
    // Handle looping
    if (this.loopEnabled && newPosition >= this.loopEnd) {
      const loopLength = this.loopEnd - this.loopStart;
      newPosition = this.loopStart + ((newPosition - this.loopStart) % loopLength);
      
      // If we've looped, update startTime to prevent drift
      if (newPosition < this.positionAtStart) {
        this.startTime = now - (newPosition - this.loopStart);
        this.positionAtStart = this.loopStart;
      }
    }
    
    this.position = newPosition;
    return this.position;
  }
  
  /**
   * Get current position in beats
   */
  getCurrentBeat(): number {
    return this.secondsToBeats(this.getCurrentTime());
  }
  
  /**
   * Get current bar number (0-indexed)
   */
  getCurrentBar(): number {
    const beats = this.getCurrentBeat();
    return Math.floor(beats / this.beatsPerBar);
  }
  
  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (this.isPlaying || !this.audioContext) return;
    
    // Ensure audio context is running
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
    
    const now = this.audioContext.currentTime;
    this.startTime = now;
    this.positionAtStart = this.position;
    this.isPlaying = true;
    
    // Start update loop
    this.startUpdateLoop();
  }
  
  /**
   * Stop playback
   */
  stop(): void {
    if (!this.isPlaying) return;
    
    // Update position before stopping
    this.position = this.getCurrentTime();
    
    this.isPlaying = false;
    this.stopUpdateLoop();
  }
  
  /**
   * Seek to a specific time (in seconds)
   */
  seek(timeSeconds: number): void {
    const wasPlaying = this.isPlaying;
    
    // Clamp to loop boundaries if looping
    if (this.loopEnabled) {
      timeSeconds = Math.max(this.loopStart, Math.min(this.loopEnd, timeSeconds));
    }
    
    this.position = timeSeconds;
    
    if (wasPlaying && this.audioContext) {
      // Update start time to continue from new position
      const now = this.audioContext.currentTime;
      this.startTime = now;
      this.positionAtStart = this.position;
    }

    // Notify listeners of position change immediately
    this.updateCallbacks.forEach(callback => {
      callback(this.position);
    });
  }
  
  /**
   * Seek to a specific beat
   */
  seekToBeat(beat: number): void {
    this.seek(this.beatsToSeconds(beat));
  }
  
  /**
   * Set BPM
   */
  setBpm(bpm: number): void {
    const wasPlaying = this.isPlaying;
    const currentTime = this.getCurrentTime();
    
    this.bpm = Math.max(20, Math.min(300, bpm));
    this.updateLoopBoundaries();
    
    // Recalculate position in case loop boundaries changed
    if (wasPlaying) {
      this.seek(currentTime);
      if (wasPlaying) {
        this.play();
      }
    }
  }
  
  /**
   * Set loop length in bars
   */
  setLoopLengthBars(bars: number): void {
    this.loopLengthBars = Math.max(1, bars);
    this.updateLoopBoundaries();
    
    // Clamp position if it's beyond new loop end
    if (this.position > this.loopEnd) {
      this.position = this.loopStart;
    }
  }
  
  /**
   * Enable/disable looping
   */
  setLoopEnabled(enabled: boolean): void {
    this.loopEnabled = enabled;
  }
  
  /**
   * Start the update loop for UI synchronization
   */
  private startUpdateLoop(): void {
    if (this.animationFrameId) return;
    
    const update = () => {
      if (this.isPlaying) {
        const currentTime = this.getCurrentTime();
        
        // Call all registered callbacks
        this.updateCallbacks.forEach(callback => {
          callback(currentTime);
        });
      }
      
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    this.animationFrameId = requestAnimationFrame(update);
  }
  
  /**
   * Stop the update loop
   */
  private stopUpdateLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Register a callback to be called on each frame update
   * Callback receives current time in seconds
   */
  onUpdate(callback: (time: number) => void): void {
    this.updateCallbacks.push(callback);
  }
  
  /**
   * Remove an update callback
   */
  offUpdate(callback: (time: number) => void): void {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }
  
  /**
   * Get transport state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      isRecording: this.isRecording,
      position: this.position,
      currentBeat: this.getCurrentBeat(),
      currentBar: this.getCurrentBar(),
      bpm: this.bpm,
      loopLengthBars: this.loopLengthBars,
      loopEnabled: this.loopEnabled
    };
  }
  
  /**
   * Format time as "bar:beat:subbeat"
   */
  formatTime(): string {
    const beats = this.getCurrentBeat();
    const bar = Math.floor(beats / this.beatsPerBar);
    const beat = Math.floor(beats % this.beatsPerBar);
    const subBeat = ((beats % 1) * 4).toFixed(1);
    
    return `${String(bar + 1).padStart(2, '0')}:${String(beat + 1).padStart(2, '0')}:${subBeat}`;
  }
  
  // Getters
  getBpm(): number {
    return this.bpm;
  }
  
  getLoopLengthBars(): number {
    return this.loopLengthBars;
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  getIsRecording(): boolean {
    return this.isRecording;
  }
  
  setIsRecording(recording: boolean): void {
    this.isRecording = recording;
  }
}

