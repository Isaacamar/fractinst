/**
 * Zustand store for audio engine state
 */

import { create } from 'zustand';
import type { AudioEngineParams } from '../engines/types';

interface AudioStore {
  // Parameters
  params: AudioEngineParams;
  
  // Bypass states
  filterBypassed: boolean;
  distortionBypassed: boolean;
  
  // Actions
  setWaveType: (type: OscillatorType) => void;
  setMasterVolume: (volume: number) => void;
  setAttackTime: (time: number) => void;
  setDecayTime: (time: number) => void;
  setSustainLevel: (level: number) => void;
  setReleaseTime: (time: number) => void;
  setFilterCutoff: (freq: number) => void;
  setFilterResonance: (q: number) => void;
  setFilterType: (type: BiquadFilterType) => void;
  setFilterBypass: (bypassed: boolean) => void;
  setDistortionAmount: (amount: number) => void;
  setDistortionBypass: (bypassed: boolean) => void;
  setChorusAmount: (amount: number) => void;
  setChorusBypass: (bypassed: boolean) => void;
  setReverbAmount: (amount: number) => void;
  setReverbBypass: (bypassed: boolean) => void;
  setCompressorBypass: (bypassed: boolean) => void;
  setDelayBypass: (bypassed: boolean) => void;
  setLFORate: (rate: number) => void;
  setLFODepth: (depth: number) => void;
  setLFOWaveType: (type: OscillatorType) => void;
  setLFOTarget: (target: 'cutoff' | 'amplitude' | 'pitch') => void;
  setMasterDetune: (cents: number) => void;
  setUnisonDetune: (cents: number) => void;
  setNoiseAmount: (amount: number) => void;
  setFilterEnvAttack: (time: number) => void;
  setFilterEnvDecay: (time: number) => void;
  setFilterEnvAmount: (amount: number) => void;
  
  // State
  activeNoteCount: number;
  setActiveNoteCount: (count: number) => void;
}

const defaultParams: AudioEngineParams = {
  waveType: 'sine',
  masterVolume: 0.5,
  attackTime: 0.01,
  decayTime: 0.1,
  sustainLevel: 0.7,
  releaseTime: 0.2,
  filterCutoff: 12000,
  filterResonance: 1.5,
  filterType: 'lowpass',
  distortionAmount: 0,
  chorusAmount: 0,
  reverbAmount: 0,
  lfoRate: 2,
  lfoDepth: 20,
  lfoWaveType: 'sine',
  lfoTarget: 'cutoff',
  unisonMode: false,
  unisonVoices: 2,
  unisonDetune: 5,
  masterDetune: 0,
  noiseAmount: 0,
  filterEnvAttack: 50,
  filterEnvDecay: 200,
  filterEnvAmount: 3000
};

export const useAudioStore = create<AudioStore>((set) => ({
  params: defaultParams,
  filterBypassed: false,
  distortionBypassed: true, // Distortion bypassed by default
  
  setWaveType: (type) => set((state) => ({ params: { ...state.params, waveType: type } })),
  setMasterVolume: (volume) => set((state) => ({ params: { ...state.params, masterVolume: volume / 100 } })),
  setAttackTime: (time) => set((state) => ({ params: { ...state.params, attackTime: time } })),
  setDecayTime: (time) => set((state) => ({ params: { ...state.params, decayTime: time } })),
  setSustainLevel: (level) => set((state) => ({ params: { ...state.params, sustainLevel: level } })),
  setReleaseTime: (time) => set((state) => ({ params: { ...state.params, releaseTime: time } })),
  setFilterCutoff: (freq) => set((state) => ({ params: { ...state.params, filterCutoff: Math.max(20, Math.min(20000, freq)) } })),
  setFilterResonance: (q) => set((state) => ({ params: { ...state.params, filterResonance: Math.max(0.1, Math.min(20, q)) } })),
  setFilterType: (type) => set((state) => ({ params: { ...state.params, filterType: type } })),
  setFilterBypass: (bypassed) => set({ filterBypassed: bypassed }),
  setDistortionAmount: (amount) => set((state) => ({ params: { ...state.params, distortionAmount: Math.max(0, Math.min(100, amount)) } })),
  setDistortionBypass: (bypassed) => set({ distortionBypassed: bypassed }),
  setChorusAmount: (amount) => set((state) => ({ params: { ...state.params, chorusAmount: Math.max(0, Math.min(100, amount)) } })),
  setChorusBypass: () => {}, // Will be handled by audio engine directly
  setReverbAmount: (amount) => set((state) => ({ params: { ...state.params, reverbAmount: Math.max(0, Math.min(100, amount)) } })),
  setReverbBypass: () => {}, // Will be handled by audio engine directly
  setCompressorBypass: () => {}, // Will be handled by audio engine directly
  setDelayBypass: () => {}, // Will be handled by audio engine directly
  setLFORate: (rate) => set((state) => ({ params: { ...state.params, lfoRate: Math.max(0.1, Math.min(20, rate)) } })),
  setLFODepth: (depth) => set((state) => ({ params: { ...state.params, lfoDepth: Math.max(0, Math.min(100, depth)) } })),
  setLFOWaveType: (type) => set((state) => ({ params: { ...state.params, lfoWaveType: type } })),
  setLFOTarget: (target) => set((state) => ({ params: { ...state.params, lfoTarget: target } })),
  setMasterDetune: (cents) => set((state) => ({ params: { ...state.params, masterDetune: Math.max(-100, Math.min(100, cents)) } })),
  setUnisonDetune: (cents) => set((state) => ({ params: { ...state.params, unisonDetune: Math.max(0, Math.min(50, cents)) } })),
  setNoiseAmount: (amount) => set((state) => ({ params: { ...state.params, noiseAmount: Math.max(0, Math.min(1, amount)) } })),
  setFilterEnvAttack: (time) => set((state) => ({ params: { ...state.params, filterEnvAttack: Math.max(0, Math.min(1000, time)) } })),
  setFilterEnvDecay: (time) => set((state) => ({ params: { ...state.params, filterEnvDecay: Math.max(0, Math.min(1000, time)) } })),
  setFilterEnvAmount: (amount) => set((state) => ({ params: { ...state.params, filterEnvAmount: Math.max(0, Math.min(5000, amount)) } })),
  
  activeNoteCount: 0,
  setActiveNoteCount: (count) => set({ activeNoteCount: count }),
}));

