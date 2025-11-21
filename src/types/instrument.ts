/**
 * Instrument Configuration Types
 */

import type { AudioEngineParams } from '../engines/types';
import type { SynthModule } from '../systems/ModuleManager';
import type { ModulePosition } from '../systems/ModuleLayoutManager';

export interface InstrumentConfiguration {
  id: string;
  name: string;
  isPreset: boolean;
  createdAt: number;
  updatedAt: number;
  
  // Audio parameters
  audioParams: AudioEngineParams;
  filterBypassed: boolean;
  distortionBypassed: boolean;
  
  // Module configuration
  modules: {
    id: string;
    type: string;
    name: string;
    enabled: boolean;
    parameters: Record<string, any>;
    position: ModulePosition;
  }[];
}

export interface InstrumentLibraryState {
  presets: InstrumentConfiguration[];
  userInstruments: InstrumentConfiguration[];
}

