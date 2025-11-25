/**
 * Sequencer Scheduler
 * Schedules drum pattern playback in sync with transport
 */

import type { Transport } from './Transport';
import type { DrumMachine } from './DrumMachine';
import type { DrumSound } from './DrumMachine';

export interface SequencerPattern {
  [sound: string]: boolean[];
}

export class SequencerScheduler {
  private transport: Transport;
  private drumMachine: DrumMachine;
  private patterns: SequencerPattern = {};
  private stepCount: number = 16;
  private stepResolution: number = 4; // Steps per beat (1=quarter, 2=8th, 4=16th, 8=32nd)
  private muted: boolean = false;
  
  // Scheduling state
  private scheduleTimerId: ReturnType<typeof setInterval> | null = null;
  private scheduledSteps: Set<string> = new Set();
  private lastScheduledBeat: number = -1;
  
  // Lookahead window
  private lookAheadBeats: number = 0.5; // Schedule 0.5 beats ahead
  private scheduleInterval: number = 25; // Check every 25ms
  
  constructor(transport: Transport, drumMachine: DrumMachine) {
    this.transport = transport;
    this.drumMachine = drumMachine;
  }
  
  /**
   * Set the patterns to play
   */
  setPatterns(patterns: SequencerPattern, stepCount: number, stepResolution: number = 4, muted: boolean = false): void {
    this.patterns = patterns;
    this.stepCount = stepCount;
    this.stepResolution = stepResolution;
    this.muted = muted;
    
    // Clear scheduled steps when patterns change
    this.scheduledSteps.clear();
    
    console.log('Sequencer patterns updated', {
      stepCount,
      stepResolution,
      muted,
      patternCount: Object.keys(patterns).length,
      patterns: Object.entries(patterns).map(([sound, pattern]) => ({
        sound,
        length: pattern?.length || 0,
        activeCount: pattern ? pattern.filter(p => p).length : 0
      }))
    });
  }
  
  /**
   * Start the scheduler
   */
  start(): void {
    if (this.scheduleTimerId) {
      // Already running, just reset
      this.reset();
      return;
    }
    
    this.scheduledSteps.clear();
    // Start scheduling from current beat
    const currentBeat = this.transport.getCurrentBeat();
    this.lastScheduledBeat = currentBeat;
    
    this.scheduleTimerId = setInterval(() => {
      this.scheduleSteps();
    }, this.scheduleInterval);
    
    // Schedule immediately to catch any steps that should play right away
    this.scheduleSteps();
    
    console.log('Sequencer scheduler started', {
      stepCount: this.stepCount,
      stepResolution: this.stepResolution,
      lookAheadBeats: this.lookAheadBeats,
      patternKeys: Object.keys(this.patterns),
      activeSteps: Object.entries(this.patterns).map(([sound, pattern]) => ({
        sound,
        active: pattern ? pattern.filter(p => p).length : 0
      }))
    });
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scheduleTimerId) {
      clearInterval(this.scheduleTimerId);
      this.scheduleTimerId = null;
    }
    
    this.scheduledSteps.clear();
    this.lastScheduledBeat = -1;
    
    console.log('Sequencer scheduler stopped');
  }
  
  /**
   * Reset scheduler (called on stop or seek)
   */
  reset(): void {
    this.scheduledSteps.clear();
    this.lastScheduledBeat = this.transport.getCurrentBeat();
  }
  
  /**
   * Schedule steps that fall within the lookahead window
   */
  private scheduleSteps(): void {
    if (!this.transport.getIsPlaying()) return;
    
    const audioContext = this.drumMachine.getContext();
    if (!audioContext) return;
    
    const currentBeat = this.transport.getCurrentBeat();
    const lookAheadEnd = currentBeat + this.lookAheadBeats;
    
    // Calculate beats per step based on step resolution
    // stepResolution = steps per beat (4 = 16th notes, 2 = 8th notes, etc.)
    const beatsPerStep = 1 / this.stepResolution;
    
    // Handle looping - calculate loop boundaries
    const loopLengthBars = this.transport.getLoopLengthBars();
    const loopLengthBeats = loopLengthBars * 4; // 4 beats per bar
    
    // Calculate which steps to schedule
    // The pattern repeats continuously, so we schedule based on pattern position
    const scheduleStart = Math.max(this.lastScheduledBeat, currentBeat);
    const scheduleEnd = lookAheadEnd;
    
    // Pattern length in beats
    const patternLengthBeats = this.stepCount * beatsPerStep;
    
    // Calculate step range to check
    const startStep = Math.floor(scheduleStart / beatsPerStep);
    const endStep = Math.ceil(scheduleEnd / beatsPerStep);
    
    for (let step = startStep; step <= endStep; step++) {
      // Normalize step to be within [0, stepCount) for pattern lookup
      const normalizedStep = ((step % this.stepCount) + this.stepCount) % this.stepCount;
      
      // Calculate absolute beat for this step
      const stepAbsoluteBeat = step * beatsPerStep;
      
      // Calculate which pattern cycle this step belongs to
      const patternCycle = Math.floor(stepAbsoluteBeat / patternLengthBeats);
      
      // Create unique key for this step in this pattern cycle
      const stepKey = `${normalizedStep}-${patternCycle}`;
      if (this.scheduledSteps.has(stepKey)) {
        continue;
      }
      
      // Calculate when this step should trigger relative to current time
      const beatsUntilStep = stepAbsoluteBeat - currentBeat;
      
      // Only schedule if step is in the future and within lookahead window
      if (beatsUntilStep >= 0 && stepAbsoluteBeat >= scheduleStart && stepAbsoluteBeat < scheduleEnd) {
        // Calculate when to trigger (relative to audioContext.currentTime)
        const now = audioContext.currentTime;
        const secondsUntilStep = (beatsUntilStep / this.transport.getBpm()) * 60;
        const triggerTime = now + secondsUntilStep;
        
        // Schedule all active sounds for this step (skip if muted)
        if (!this.muted) {
          for (const [sound, pattern] of Object.entries(this.patterns)) {
            if (pattern && pattern[normalizedStep]) {
              // Use setTimeout for scheduling (acceptable for drum triggers)
              const delay = Math.max(0, (triggerTime - now) * 1000);
              
              if (delay < 10) {
                // Trigger immediately if delay is very small
                this.drumMachine.trigger(sound as DrumSound, triggerTime);
              } else {
                setTimeout(() => {
                  if (this.transport.getIsPlaying() && !this.muted) {
                    this.drumMachine.trigger(sound as DrumSound, audioContext.currentTime);
                  }
                }, delay);
              }
            }
          }
        }
        
        this.scheduledSteps.add(stepKey);
      }
    }
    
    // Update last scheduled beat
    this.lastScheduledBeat = lookAheadEnd;
    
    // Clean up scheduled steps that are far in the past
    this.cleanupScheduledSteps(currentBeat, loopLengthBeats);
  }
  
  /**
   * Clean up scheduled steps that are far in the past
   */
  private cleanupScheduledSteps(currentBeat: number, _loopLengthBeats: number): void {
    // Remove steps that are more than one pattern cycle in the past
    const beatsPerStep = 1 / this.stepResolution;
    const patternLengthBeats = this.stepCount * beatsPerStep;
    const cleanupThreshold = currentBeat - (patternLengthBeats * 2); // Keep last 2 pattern cycles
    
    for (const stepKey of this.scheduledSteps) {
      const [stepStr, cycleStr] = stepKey.split('-');
      const step = parseInt(stepStr, 10);
      const patternCycle = parseInt(cycleStr, 10);
      
      // Calculate when this step was scheduled
      const stepAbsoluteBeat = (patternCycle * patternLengthBeats) + (step * beatsPerStep);
      
      if (stepAbsoluteBeat < cleanupThreshold) {
        this.scheduledSteps.delete(stepKey);
      }
    }
  }
}

