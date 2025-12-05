import { create } from 'zustand';
import { DrumSound } from '../engines/DrumMachine';

export type StepResolution = 1 | 2 | 4 | 8; // Quarter, 8th, 16th, 32nd notes

export interface SequencerState {
    patterns: Record<DrumSound, boolean[]>;
    stepCount: number;
    currentStep: number;
    stepResolution: StepResolution; // Steps per beat (1=quarter, 2=8th, 4=16th, 8=32nd)
    muted: boolean;
    isFrozen: boolean;
    savedPatterns: Record<string, {
        patterns: Record<DrumSound, boolean[]>;
        stepCount: number;
        stepResolution: StepResolution;
    }>;

    // Actions
    toggleStep: (sound: DrumSound, step: number) => void;
    clearPattern: () => void;
    setStepCount: (count: number) => void;
    setCurrentStep: (step: number) => void;
    setStepResolution: (resolution: StepResolution) => void;
    toggleMute: () => void;
    setIsFrozen: (frozen: boolean) => void;
    savePattern: (name: string) => void;
    loadPattern: (name: string) => void;
    deletePattern: (name: string) => void;
    setPatterns: (patterns: Record<DrumSound, boolean[]>) => void;
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

const DEFAULT_PRESETS: Record<string, {
    patterns: Record<DrumSound, boolean[]>;
    stepCount: number;
    stepResolution: StepResolution;
}> = {
    'Classic House': {
        stepCount: 16,
        stepResolution: 4,
        patterns: {
            ...createEmptyPattern(16),
            'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            'clap': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            'hihat-closed': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
            'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true]
        }
    },
    'Techno Rumble': {
        stepCount: 16,
        stepResolution: 4,
        patterns: {
            ...createEmptyPattern(16),
            'kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            'hihat-closed': [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
            'ride': [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            'tom-low': [false, false, false, true, false, false, false, false, false, false, false, true, false, false, true, false]
        }
    },
    'Hip Hop Bounce': {
        stepCount: 16,
        stepResolution: 4,
        patterns: {
            ...createEmptyPattern(16),
            'kick': [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
            'snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true],
            'rim': [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]
        }
    },
    'Trap Basics': {
        stepCount: 32,
        stepResolution: 8, // 32nd notes for hi-hat rolls
        patterns: {
            ...createEmptyPattern(32),
            'kick': [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false],
            'clap': [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            'hihat-closed': [true, false, true, false, true, false, true, false, true, true, true, true, true, false, true, false, true, false, true, false, true, false, true, false, true, true, true, false, true, false, true, false]
        }
    }
};

export const useSequencerStore = create<SequencerState>((set) => ({
    patterns: createEmptyPattern(DEFAULT_STEPS),
    stepCount: DEFAULT_STEPS,
    currentStep: 0,
    stepResolution: 4, // Default to 16th notes (double speed)
    muted: false,
    isFrozen: false,
    savedPatterns: {
        ...DEFAULT_PRESETS,
        ...JSON.parse(localStorage.getItem('fractinst_patterns') || '{}')
    },

    toggleStep: (sound, step) => set((state) => {
        if (state.isFrozen) return state; // Prevent editing when frozen
        const newPattern = [...state.patterns[sound]];
        newPattern[step] = !newPattern[step];
        return {
            patterns: {
                ...state.patterns,
                [sound]: newPattern
            }
        };
    }),

    clearPattern: () => set((state) => {
        if (state.isFrozen) return state;
        return {
            patterns: createEmptyPattern(state.stepCount)
        };
    }),

    setStepCount: (count) => set((state) => {
        if (state.isFrozen) return state;
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

    setStepResolution: (resolution) => set((state) => {
        if (state.isFrozen) return state;
        return { stepResolution: resolution };
    }),

    toggleMute: () => set((state) => ({ muted: !state.muted })),

    setIsFrozen: (frozen) => set({ isFrozen: frozen }),

    savePattern: (name) => set((state) => {
        const newSavedPatterns = {
            ...state.savedPatterns,
            [name]: {
                patterns: state.patterns,
                stepCount: state.stepCount,
                stepResolution: state.stepResolution
            }
        };
        localStorage.setItem('fractinst_patterns', JSON.stringify(newSavedPatterns));
        return { savedPatterns: newSavedPatterns };
    }),

    loadPattern: (name) => set((state) => {
        const preset = state.savedPatterns[name];
        if (!preset) return state;

        // If frozen, unfreeze first? Or just disallow loading?
        // Let's allow loading and it implicitly unfreezes or stays unfrozen
        return {
            patterns: preset.patterns,
            stepCount: preset.stepCount,
            stepResolution: preset.stepResolution,
            isFrozen: false // Reset freeze state on load
        };
    }),

    setPatterns: (patterns: Record<DrumSound, boolean[]>) => set((state) => {
        if (state.isFrozen) return state;
        return { patterns };
    }),

    deletePattern: (name) => set((state) => {
        const newSavedPatterns = { ...state.savedPatterns };
        delete newSavedPatterns[name];
        localStorage.setItem('fractinst_patterns', JSON.stringify(newSavedPatterns));
        return { savedPatterns: newSavedPatterns };
    })
}));

