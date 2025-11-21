/**
 * Instrument Storage Utilities
 * Handles saving/loading instrument configurations from localStorage
 */

import type { InstrumentConfiguration, InstrumentLibraryState } from '../types/instrument';

const STORAGE_KEY = 'fractinst_instrument_library';

export function saveInstrument(instrument: InstrumentConfiguration): void {
  const state = loadLibraryState();
  
  if (instrument.isPreset) {
    // Don't save presets to user instruments
    return;
  }
  
  const existingIndex = state.userInstruments.findIndex(i => i.id === instrument.id);
  const updatedInstrument = {
    ...instrument,
    updatedAt: Date.now()
  };
  
  if (existingIndex >= 0) {
    state.userInstruments[existingIndex] = updatedInstrument;
  } else {
    state.userInstruments.push(updatedInstrument);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.userInstruments));
}

export function deleteInstrument(instrumentId: string): void {
  const state = loadLibraryState();
  state.userInstruments = state.userInstruments.filter(i => i.id !== instrumentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.userInstruments));
}

export function loadLibraryState(): InstrumentLibraryState {
  const presets = getPresets();
  const userData = localStorage.getItem(STORAGE_KEY);
  const userInstruments: InstrumentConfiguration[] = userData ? JSON.parse(userData) : [];
  
  return {
    presets,
    userInstruments
  };
}

export function getPresets(): InstrumentConfiguration[] {
  // Presets are defined in code, not stored in localStorage
  return [
    {
      id: 'preset_default',
      name: 'Default',
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      audioParams: {
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
      },
      filterBypassed: false,
      distortionBypassed: true,
      modules: [
        { id: 'osc_1', type: 'oscillator-base', name: 'OSCILLATOR', enabled: true, parameters: {}, position: { column: 0, row: 0 } },
        { id: 'voice_1', type: 'voice-base', name: 'VOICE', enabled: true, parameters: {}, position: { column: 1, row: 0 } },
        { id: 'amp_1', type: 'adsr-base', name: 'ADSR', enabled: true, parameters: {}, position: { column: 2, row: 0 } },
        { id: 'fenv_1', type: 'filter-env-base', name: 'FILTER ENV', enabled: true, parameters: {}, position: { column: 3, row: 0 } },
        { id: 'filt_1', type: 'filter-base', name: 'FILTER', enabled: true, parameters: {}, position: { column: 4, row: 0 } },
        { id: 'dist_1', type: 'distortion-base', name: 'DISTORTION', enabled: false, parameters: {}, position: { column: 0, row: 1 } },
        { id: 'lfo_1', type: 'lfo-base', name: 'LFO', enabled: true, parameters: {}, position: { column: 1, row: 1 } }
      ]
    },
    {
      id: 'preset_bass',
      name: 'Bass',
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      audioParams: {
        waveType: 'sawtooth',
        masterVolume: 0.6,
        attackTime: 0.005,
        decayTime: 0.15,
        sustainLevel: 0.8,
        releaseTime: 0.3,
        filterCutoff: 3000,
        filterResonance: 2.0,
        filterType: 'lowpass',
        distortionAmount: 15,
        chorusAmount: 0,
        reverbAmount: 5,
        lfoRate: 0.5,
        lfoDepth: 10,
        lfoWaveType: 'sine',
        lfoTarget: 'cutoff',
        unisonMode: false,
        unisonVoices: 2,
        unisonDetune: 3,
        masterDetune: 0,
        noiseAmount: 0,
        filterEnvAttack: 20,
        filterEnvDecay: 150,
        filterEnvAmount: 2000
      },
      filterBypassed: false,
      distortionBypassed: false,
      modules: [
        { id: 'osc_1', type: 'oscillator-base', name: 'OSCILLATOR', enabled: true, parameters: {}, position: { column: 0, row: 0 } },
        { id: 'voice_1', type: 'voice-base', name: 'VOICE', enabled: true, parameters: {}, position: { column: 1, row: 0 } },
        { id: 'amp_1', type: 'adsr-base', name: 'ADSR', enabled: true, parameters: {}, position: { column: 2, row: 0 } },
        { id: 'fenv_1', type: 'filter-env-base', name: 'FILTER ENV', enabled: true, parameters: {}, position: { column: 3, row: 0 } },
        { id: 'filt_1', type: 'filter-base', name: 'FILTER', enabled: true, parameters: {}, position: { column: 4, row: 0 } },
        { id: 'dist_1', type: 'distortion-base', name: 'DISTORTION', enabled: true, parameters: {}, position: { column: 0, row: 1 } },
        { id: 'lfo_1', type: 'lfo-base', name: 'LFO', enabled: true, parameters: {}, position: { column: 1, row: 1 } }
      ]
    },
    {
      id: 'preset_lead',
      name: 'Lead',
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      audioParams: {
        waveType: 'square',
        masterVolume: 0.55,
        attackTime: 0.02,
        decayTime: 0.05,
        sustainLevel: 0.9,
        releaseTime: 0.15,
        filterCutoff: 8000,
        filterResonance: 1.8,
        filterType: 'lowpass',
        distortionAmount: 0,
        chorusAmount: 25,
        reverbAmount: 15,
        lfoRate: 4,
        lfoDepth: 30,
        lfoWaveType: 'triangle',
        lfoTarget: 'cutoff',
        unisonMode: true,
        unisonVoices: 3,
        unisonDetune: 8,
        masterDetune: 0,
        noiseAmount: 0,
        filterEnvAttack: 30,
        filterEnvDecay: 100,
        filterEnvAmount: 4000
      },
      filterBypassed: false,
      distortionBypassed: true,
      modules: [
        { id: 'osc_1', type: 'oscillator-base', name: 'OSCILLATOR', enabled: true, parameters: {}, position: { column: 0, row: 0 } },
        { id: 'voice_1', type: 'voice-base', name: 'VOICE', enabled: true, parameters: {}, position: { column: 1, row: 0 } },
        { id: 'amp_1', type: 'adsr-base', name: 'ADSR', enabled: true, parameters: {}, position: { column: 2, row: 0 } },
        { id: 'fenv_1', type: 'filter-env-base', name: 'FILTER ENV', enabled: true, parameters: {}, position: { column: 3, row: 0 } },
        { id: 'filt_1', type: 'filter-base', name: 'FILTER', enabled: true, parameters: {}, position: { column: 4, row: 0 } },
        { id: 'dist_1', type: 'distortion-base', name: 'DISTORTION', enabled: false, parameters: {}, position: { column: 0, row: 1 } },
        { id: 'lfo_1', type: 'lfo-base', name: 'LFO', enabled: true, parameters: {}, position: { column: 1, row: 1 } }
      ]
    },
    {
      id: 'preset_pad',
      name: 'Pad',
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      audioParams: {
        waveType: 'sine',
        masterVolume: 0.5,
        attackTime: 0.5,
        decayTime: 0.3,
        sustainLevel: 0.7,
        releaseTime: 1.0,
        filterCutoff: 6000,
        filterResonance: 1.2,
        filterType: 'lowpass',
        distortionAmount: 0,
        chorusAmount: 40,
        reverbAmount: 30,
        lfoRate: 1,
        lfoDepth: 15,
        lfoWaveType: 'sine',
        lfoTarget: 'cutoff',
        unisonMode: true,
        unisonVoices: 4,
        unisonDetune: 12,
        masterDetune: 0,
        noiseAmount: 0,
        filterEnvAttack: 200,
        filterEnvDecay: 400,
        filterEnvAmount: 2500
      },
      filterBypassed: false,
      distortionBypassed: true,
      modules: [
        { id: 'osc_1', type: 'oscillator-base', name: 'OSCILLATOR', enabled: true, parameters: {}, position: { column: 0, row: 0 } },
        { id: 'voice_1', type: 'voice-base', name: 'VOICE', enabled: true, parameters: {}, position: { column: 1, row: 0 } },
        { id: 'amp_1', type: 'adsr-base', name: 'ADSR', enabled: true, parameters: {}, position: { column: 2, row: 0 } },
        { id: 'fenv_1', type: 'filter-env-base', name: 'FILTER ENV', enabled: true, parameters: {}, position: { column: 3, row: 0 } },
        { id: 'filt_1', type: 'filter-base', name: 'FILTER', enabled: true, parameters: {}, position: { column: 4, row: 0 } },
        { id: 'dist_1', type: 'distortion-base', name: 'DISTORTION', enabled: false, parameters: {}, position: { column: 0, row: 1 } },
        { id: 'lfo_1', type: 'lfo-base', name: 'LFO', enabled: true, parameters: {}, position: { column: 1, row: 1 } }
      ]
    },
    {
      id: 'preset_pluck',
      name: 'Pluck',
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      audioParams: {
        waveType: 'triangle',
        masterVolume: 0.55,
        attackTime: 0.001,
        decayTime: 0.2,
        sustainLevel: 0.1,
        releaseTime: 0.1,
        filterCutoff: 10000,
        filterResonance: 1.5,
        filterType: 'lowpass',
        distortionAmount: 0,
        chorusAmount: 10,
        reverbAmount: 20,
        lfoRate: 0,
        lfoDepth: 0,
        lfoWaveType: 'sine',
        lfoTarget: 'cutoff',
        unisonMode: false,
        unisonVoices: 2,
        unisonDetune: 5,
        masterDetune: 0,
        noiseAmount: 0,
        filterEnvAttack: 5,
        filterEnvDecay: 300,
        filterEnvAmount: 3500
      },
      filterBypassed: false,
      distortionBypassed: true,
      modules: [
        { id: 'osc_1', type: 'oscillator-base', name: 'OSCILLATOR', enabled: true, parameters: {}, position: { column: 0, row: 0 } },
        { id: 'voice_1', type: 'voice-base', name: 'VOICE', enabled: true, parameters: {}, position: { column: 1, row: 0 } },
        { id: 'amp_1', type: 'adsr-base', name: 'ADSR', enabled: true, parameters: {}, position: { column: 2, row: 0 } },
        { id: 'fenv_1', type: 'filter-env-base', name: 'FILTER ENV', enabled: true, parameters: {}, position: { column: 3, row: 0 } },
        { id: 'filt_1', type: 'filter-base', name: 'FILTER', enabled: true, parameters: {}, position: { column: 4, row: 0 } },
        { id: 'dist_1', type: 'distortion-base', name: 'DISTORTION', enabled: false, parameters: {}, position: { column: 0, row: 1 } },
        { id: 'lfo_1', type: 'lfo-base', name: 'LFO', enabled: false, parameters: {}, position: { column: 1, row: 1 } }
      ]
    }
  ];
}

