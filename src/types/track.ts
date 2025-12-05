import { InstrumentConfiguration } from './instrument';
import { MidiClip } from '../engines/MidiRecorder';
import { PercussionClip } from './percussion';

/**
 * Base properties shared by all track types
 */
interface BaseTrack {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  soloed: boolean;
}

/**
 * MIDI track with instrument and MIDI clips
 */
export interface MidiTrack extends BaseTrack {
  type: 'midi';
  instrumentConfig: InstrumentConfiguration;
  clips: MidiClip[];
}

/**
 * Percussion track with drum patterns
 */
export interface PercussionTrack extends BaseTrack {
  type: 'percussion';
  clips: PercussionClip[];
}

/**
 * Union type for all track types
 */
export type Track = MidiTrack | PercussionTrack;

export interface ProjectState {
  tracks: Track[];
  activeTrackId: string | null;
  tempo: number;
  timeSignature: [number, number];
}


