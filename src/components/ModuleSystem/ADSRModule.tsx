/**
 * ADSR Envelope Module Component
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const ADSRModule: React.FC = () => {
  const { params, setAttackTime, setDecayTime, setSustainLevel, setReleaseTime } = useAudioStore();

  return (
    <>
      <div className="knobs-row">
        <Knob
          label="ATK"
          min={0}
          max={1000}
          step={1}
          value={params.attackTime * 1000}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setAttackTime(v / 1000)}
          sensitivity={1.5}
        />
        <Knob
          label="DEC"
          min={0}
          max={1000}
          step={1}
          value={params.decayTime * 1000}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setDecayTime(v / 1000)}
          sensitivity={1.5}
        />
      </div>
      <div className="knobs-row">
        <Knob
          label="SUS"
          min={0}
          max={100}
          step={1}
          value={params.sustainLevel * 100}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setSustainLevel(v / 100)}
          sensitivity={1.5}
        />
        <Knob
          label="REL"
          min={0}
          max={1000}
          step={1}
          value={params.releaseTime * 1000}
          formatValue={(v) => Math.round(v).toString()}
          onChange={(v) => setReleaseTime(v / 1000)}
          sensitivity={1.5}
        />
      </div>
    </>
  );
};

