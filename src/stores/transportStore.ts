/**
 * Zustand store for transport state
 */

import { create } from 'zustand';

interface TransportStore {
  // Playback state
  isPlaying: boolean;
  isRecording: boolean;
  
  // Timing
  bpm: number;
  currentTime: number; // in seconds
  currentBeat: number;
  currentBar: number;
  loopLengthBars: number;
  
  // Lead-in metronome
  leadInEnabled: boolean;
  leadInBeatCount: number;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setBpm: (bpm: number) => void;
  setCurrentTime: (time: number) => void;
  setCurrentBeat: (beat: number) => void;
  setCurrentBar: (bar: number) => void;
  setLoopLengthBars: (bars: number) => void;
  setLeadInEnabled: (enabled: boolean) => void;
  setLeadInBeatCount: (beats: number) => void;
  
  // Formatted time display
  formattedTime: string;
  setFormattedTime: (time: string) => void;
}

export const useTransportStore = create<TransportStore>((set) => ({
  isPlaying: false,
  isRecording: false,
  bpm: 120,
  currentTime: 0,
  currentBeat: 0,
  currentBar: 0,
  loopLengthBars: 4,
  leadInEnabled: true,
  leadInBeatCount: 4,
  formattedTime: '01:01:0.0',
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setCurrentBar: (bar) => set({ currentBar: bar }),
  setLoopLengthBars: (bars) => set({ loopLengthBars: Math.max(1, bars) }),
  setLeadInEnabled: (enabled) => set({ leadInEnabled: enabled }),
  setLeadInBeatCount: (beats) => set({ leadInBeatCount: Math.max(1, Math.min(16, beats)) }),
  setFormattedTime: (time) => set({ formattedTime: time }),
}));

