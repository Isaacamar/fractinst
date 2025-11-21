// Type definitions for audio engine

export interface Voice {
  oscillator: OscillatorNode | null;
  envelope: GainNode | null;
  isActive: boolean;
  noteKey: string | number;
  frequency: number;
  startTime: number;
}

export interface EffectNode {
  node: AudioNode;
  bypassGain?: GainNode;
  inputGain?: GainNode;
  mixer?: GainNode;
  active: boolean;
  // Chorus-specific
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  delayGain?: GainNode;
  dryGain?: GainNode;
  // Delay-specific
  feedback?: GainNode;
  wetGain?: GainNode;
  // Reverb-specific
}

export interface Effects {
  distortion: EffectNode | null;
  compressor: EffectNode | null;
  chorus: EffectNode | null;
  delay: EffectNode | null;
  reverb: EffectNode | null;
}

export interface EffectBypassed {
  distortion: boolean;
  compressor: boolean;
  chorus: boolean;
  delay: boolean;
  reverb: boolean;
}

export interface AudioEngineParams {
  waveType: OscillatorType;
  masterVolume: number;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  filterCutoff: number;
  filterResonance: number;
  filterType: BiquadFilterType;
  distortionAmount: number;
  chorusAmount: number;
  reverbAmount: number;
  lfoRate: number;
  lfoDepth: number;
  lfoWaveType: OscillatorType;
  lfoTarget: 'cutoff' | 'amplitude' | 'pitch';
  unisonMode: boolean;
  unisonVoices: number;
  unisonDetune: number;
  masterDetune: number;
  noiseAmount: number;
  filterEnvAttack: number;
  filterEnvDecay: number;
  filterEnvAmount: number;
}

export interface ActiveFrequency {
  frequency: number;
  amplitude: number;
}

