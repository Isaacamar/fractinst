import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChordDefinition, ChordMap } from '../types/keyboard';

interface KeyboardState {
  chordMap: ChordMap;
  setChord: (keyCode: string, chord: ChordDefinition) => void;
  resetChords: () => void;
}

export const DEFAULT_CHORD_MAP: ChordMap = {
  'Digit1': { name: 'Major', intervals: [0, 4, 7] },
  'Digit2': { name: 'Minor', intervals: [0, 3, 7] },
  'Digit3': { name: 'Dim', intervals: [0, 3, 6] },
  'Digit4': { name: 'Aug', intervals: [0, 4, 8] },
  'Digit5': { name: 'Maj7', intervals: [0, 4, 7, 11] },
  'Digit6': { name: 'Min7', intervals: [0, 3, 7, 10] },
  'Digit7': { name: 'Dom7', intervals: [0, 4, 7, 10] },
  'Digit8': { name: 'Sus4', intervals: [0, 5, 7] },
  'Digit9': { name: 'Sus2', intervals: [0, 2, 7] },
  'Digit0': { name: 'Power', intervals: [0, 7, 12] }
};

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set) => ({
      chordMap: DEFAULT_CHORD_MAP,
      setChord: (keyCode, chord) => set((state) => ({
        chordMap: { ...state.chordMap, [keyCode]: chord }
      })),
      resetChords: () => set({ chordMap: DEFAULT_CHORD_MAP })
    }),
    {
      name: 'keyboard-storage',
    }
  )
);

