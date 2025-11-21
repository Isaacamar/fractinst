/**
 * VCO-Based Module Architecture Types
 * Each instrument has VCOs (oscillators) and effects are attached via color coding
 */

export type VCOColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink';

export interface VCOModule {
  id: string;
  type: 'vco';
  name: string;
  enabled: boolean;
  color: VCOColor;
  parameters: {
    waveType: OscillatorType;
    volume: number;
    detune: number;
    octave: number;
  };
  position: { column: number; row: number };
}

export interface EffectModule {
  id: string;
  type: 'filter' | 'distortion' | 'lfo' | 'adsr' | 'filter-env' | 'voice';
  name: string;
  enabled: boolean;
  vcoColor: VCOColor | null; // null = global effect, color = attached to specific VCO
  parameters: Record<string, any>;
  position: { column: number; row: number };
}

export type SynthModuleV2 = VCOModule | EffectModule;

export interface VCOInstrumentConfiguration {
  id: string;
  name: string;
  isPreset: boolean;
  createdAt: number;
  updatedAt: number;
  
  // VCOs - the sound sources
  vcos: VCOModule[];
  
  // Effects - attached to VCOs by color or global
  effects: EffectModule[];
  
  // Global audio parameters
  globalParams: {
    masterVolume: number;
    masterDetune: number;
  };
}

