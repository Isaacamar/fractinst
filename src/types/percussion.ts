import { DrumSound } from '../engines/DrumMachine';
import { StepResolution } from '../stores/sequencerStore';

/**
 * Represents a percussion pattern clip on the timeline
 */
export interface PercussionClip {
  id: string;
  startTime: number; // Start position in beats
  length: number; // Duration in beats
  patterns: Record<DrumSound, boolean[]>;
  stepCount: number;
  stepResolution: StepResolution;
  name?: string; // Optional name (e.g., "Classic House")
  selectedSounds?: DrumSound[]; // If undefined, all sounds are active
}

/**
 * Saved pattern data that can be dragged into the timeline
 */
export interface SequenceBlockData {
  name: string;
  patterns: Record<DrumSound, boolean[]>;
  stepCount: number;
  stepResolution: StepResolution;
}

/**
 * Represents which drum sounds are selected for partial pattern dragging
 */
export interface SoundSelection {
  [key: string]: boolean; // DrumSound -> selected state
}
