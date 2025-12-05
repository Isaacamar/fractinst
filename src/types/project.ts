import { Track } from './track';
import { SequencerState } from '../stores/sequencerStore';

export interface ProjectMetadata {
    id: string;
    name: string;
    created: number;
    lastModified: number;
    author?: string;
}

export interface ProjectState {
    // Global Transport State
    bpm: number;
    timeSignature: [number, number]; // [numerator, denominator]

    // Tracks and Instruments
    tracks: Track[];
    activeTrackId: string | null;

    // Sequencer Data (Patterns)
    sequencer: {
        patterns: SequencerState['patterns'];
        stepCount: number;
        stepResolution: SequencerState['stepResolution'];
    };

    // Helper to store module layout if needed globally, though it's usually per-track instrument
    // In this app, it seems we have a "Current Instrument" view that edits the active track's instrument.
}

export interface Project {
    metadata: ProjectMetadata;
    state: ProjectState;
    version: string;
}
