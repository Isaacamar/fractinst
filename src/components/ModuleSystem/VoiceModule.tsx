/**
 * Voice Module - Unison and noise controls
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const VoiceModule: React.FC = () => {
  const { params, setUnisonDetune, setNoiseAmount } = useAudioStore();
  const [unisonEnabled, setUnisonEnabled] = React.useState(false);

  return (
    <div className="voice-module">
      <div className="unison-toggle">
        <button
          className={`toggle-btn ${unisonEnabled ? 'active' : ''}`}
          onClick={() => setUnisonEnabled(!unisonEnabled)}
        >
          UNISON: {unisonEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="knobs-row">
        <Knob
          label="DTUNE"
          min={0}
          max={50}
          step={1}
          value={params.unisonDetune || 5}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setUnisonDetune(v)}
        />
        <Knob
          label="NOISE"
          min={0}
          max={100}
          step={1}
          value={(params.noiseAmount || 0) * 100}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setNoiseAmount(v / 100)}
        />
      </div>
    </div>
  );
};

