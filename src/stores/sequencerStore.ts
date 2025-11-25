import { create } from 'zustand';
import { DrumSound } from '../engines/DrumMachine';

export type StepResolution = 1 | 2 | 4 | 8; // Quarter, 8th, 16th, 32nd notes

export interface SequencerState {
    patterns: Record<DrumSound, boolean[]>;
    stepCount: number;
    currentStep: number;
    stepResolution: StepResolution; // Steps per beat (1=quarter, 2=8th, 4=16th, 8=32nd)
    muted: boolean;

    // Actions
    toggleStep: (sound: DrumSound, step: number) => void;
    clearPattern: () => void;
    setStepCount: (count: number) => void;
    setCurrentStep: (step: number) => void;
    setStepResolution: (resolution: StepResolution) => void;
    toggleMute: () => void;
}

const DEFAULT_STEPS = 16;
const DRUM_SOUNDS: DrumSound[] = [
    'kick', 'snare', 'clap', 'hihat-closed', 'hihat-open',
    'tom-low', 'tom-high', 'ride', 'crash', 'rim'
];

const createEmptyPattern = (steps: number): Record<DrumSound, boolean[]> => {
    const pattern: Partial<Record<DrumSound, boolean[]>> = {};
    DRUM_SOUNDS.forEach(sound => {
        pattern[sound] = new Array(steps).fill(false);
    });
    return pattern as Record<DrumSound, boolean[]>;
};

export const useSequencerStore = create<SequencerState>((set) => ({
    patterns: createEmptyPattern(DEFAULT_STEPS),
    stepCount: DEFAULT_STEPS,
    currentStep: 0,
    stepResolution: 4, // Default to 16th notes (double speed)
    muted: false,

    toggleStep: (sound, step) => set((state) => {
        const newPattern = [...state.patterns[sound]];
        newPattern[step] = !newPattern[step];
        return {
            patterns: {
                ...state.patterns,
                [sound]: newPattern
            }
        };
    }),

    clearPattern: () => set((state) => ({
        patterns: createEmptyPattern(state.stepCount)
    })),

    setStepCount: (count) => set((state) => {
        // Preserve existing pattern data if possible
        const newPatterns: Partial<Record<DrumSound, boolean[]>> = {};
        DRUM_SOUNDS.forEach(sound => {
            const oldPattern = state.patterns[sound];
            const newPattern = new Array(count).fill(false);
            for (let i = 0; i < Math.min(oldPattern.length, count); i++) {
                newPattern[i] = oldPattern[i];
            }
            newPatterns[sound] = newPattern;
        });

        return {
            stepCount: count,
            patterns: newPatterns as Record<DrumSound, boolean[]>
        };
    }),

    setCurrentStep: (step) => set({ currentStep: step }),

    setStepResolution: (resolution) => set({ stepResolution: resolution }),

    toggleMute: () => set((state) => ({ muted: !state.muted }))
}));
