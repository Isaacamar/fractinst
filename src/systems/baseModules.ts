/**
 * Base Module Definitions
 * These are UI-only modules that connect to the existing audio engine
 */

import { SynthModule, ModuleDefinition } from './ModuleManager';

function createBaseModule(type: string, name: string, category: string, icon: string): ModuleDefinition {
  return {
    name,
    description: `${name} module`,
    category,
    icon,
    isBaseModule: true,
    createInstance: (options: any = {}) => {
      const module: SynthModule = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        name: options.name || name,
        enabled: options.enabled !== undefined ? options.enabled : true,
        parameters: {},
        inputs: [],
        outputs: [],
        uiElement: null
      };
      return module;
    }
  };
}

export const baseModuleDefinitions: Record<string, ModuleDefinition> = {
  'oscillator-base': createBaseModule('oscillator-base', 'OSCILLATOR', 'base', '~'),
  'voice-base': createBaseModule('voice-base', 'VOICE', 'base', '♪'),
  'adsr-base': createBaseModule('adsr-base', 'ADSR', 'base', '▲'),
  'filter-env-base': createBaseModule('filter-env-base', 'FILTER ENV', 'base', '◆'),
  'filter-base': createBaseModule('filter-base', 'FILTER', 'base', '⚡'),
  'distortion-base': createBaseModule('distortion-base', 'DISTORTION', 'base', '⚠'),
  'lfo-base': createBaseModule('lfo-base', 'LFO', 'base', '⟿')
};

