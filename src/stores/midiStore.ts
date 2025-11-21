/**
 * Zustand store for MIDI recording state
 */

import { create } from 'zustand';
import type { MidiClip } from '../engines/MidiRecorder';

interface MidiStore {
  // Clips
  clips: MidiClip[];
  
  // Recording state
  isRecording: boolean;
  currentClip: MidiClip | null;
  
  // Actions
  setClips: (clips: MidiClip[]) => void;
  addClip: (clip: MidiClip) => void;
  clearClips: () => void;
  setIsRecording: (recording: boolean) => void;
  setCurrentClip: (clip: MidiClip | null) => void;
}

export const useMidiStore = create<MidiStore>((set) => ({
  clips: [],
  isRecording: false,
  currentClip: null,
  
  setClips: (clips) => set({ clips }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  clearClips: () => set({ clips: [], currentClip: null }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setCurrentClip: (clip) => set({ currentClip: clip }),
}));

