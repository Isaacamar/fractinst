import React, { useState } from 'react';
import { ArrangementView } from './ArrangementView';
import { MidiEditor } from './MidiEditor';
import { useTrackStore } from '../../stores/trackStore';
import type { Transport } from '../../engines/Transport';
import type { AudioEngine } from '../../engines/AudioEngine';
import type { DAWCore } from '../../engines/DAWCore';
import type { MidiRecorder } from '../../engines/MidiRecorder';

interface PianoRollProps {
  transport: Transport | null;
  synthEngine: AudioEngine | null;
  midiRecorder: MidiRecorder | null;
  dawCore: DAWCore | null;
  onSwitchToInstrument: () => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  transport,
  synthEngine,
  dawCore,
  onSwitchToInstrument
}) => {
  const [editorTrackId, setEditorTrackId] = useState<string | null>(null);
  const { tracks } = useTrackStore();

  const activeTrack = editorTrackId ? tracks.find(t => t.id === editorTrackId) : null;

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ArrangementView
          transport={transport}
          dawCore={dawCore}
          onOpenEditor={setEditorTrackId}
          onSwitchToInstrument={onSwitchToInstrument}
        />
      </div>
      
      {editorTrackId && activeTrack && (
        <div style={{ height: '50%', minHeight: '200px', borderTop: '4px solid #111', display: 'flex', flexDirection: 'column', boxShadow: '0 -2px 10px rgba(0,0,0,0.5)' }}>
          <MidiEditor
            transport={transport}
            synthEngine={synthEngine}
            dawCore={dawCore}
            clips={activeTrack.clips}
            trackId={activeTrack.id}
            trackName={activeTrack.name}
            color={activeTrack.color}
            onClose={() => setEditorTrackId(null)}
          />
        </div>
      )}
    </div>
  );
};

