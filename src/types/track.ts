import { InstrumentConfiguration } from './instrument';
import { MidiClip } from '../engines/MidiRecorder';

export interface Track {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  soloed: boolean;
  instrumentConfig: InstrumentConfiguration;
  clips: MidiClip[];
}

export interface ProjectState {
  tracks: Track[];
  activeTrackId: string | null;
  tempo: number;
  timeSignature: [number, number];
}


