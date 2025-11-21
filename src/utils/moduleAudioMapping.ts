/**
 * Module to Audio Engine Mapping
 * Maps module types to audio engine controls for enable/disable functionality
 */

export interface ModuleAudioMapping {
  moduleType: string;
  audioControl: {
    type: 'bypass' | 'mute' | 'parameter';
    target: string;
    enabledValue: any;
    disabledValue: any;
  };
}

export const moduleAudioMappings: Record<string, ModuleAudioMapping['audioControl']> = {
  'oscillator-base': {
    type: 'mute',
    target: 'oscillator',
    enabledValue: 1,
    disabledValue: 0
  },
  'filter-base': {
    type: 'bypass',
    target: 'filter',
    enabledValue: false,
    disabledValue: true
  },
  'distortion-base': {
    type: 'bypass',
    target: 'distortion',
    enabledValue: false,
    disabledValue: true
  },
  'lfo-base': {
    type: 'mute',
    target: 'lfo',
    enabledValue: 1,
    disabledValue: 0
  },
  'adsr-base': {
    type: 'mute',
    target: 'envelope',
    enabledValue: 1,
    disabledValue: 0
  },
  'filter-env-base': {
    type: 'mute',
    target: 'filter-env',
    enabledValue: 1,
    disabledValue: 0
  },
  'voice-base': {
    type: 'parameter',
    target: 'unisonMode',
    enabledValue: true,
    disabledValue: false
  }
};

