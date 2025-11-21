/**
 * Filter Envelope Module
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const FilterEnvModule: React.FC = () => {
  const { params, setFilterEnvAttack, setFilterEnvDecay, setFilterEnvAmount } = useAudioStore();

  return (
    <div className="filter-env-module">
      <div className="knobs-row">
        <Knob
          label="ATK"
          min={0}
          max={1000}
          step={1}
          value={params.filterEnvAttack || 50}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setFilterEnvAttack}
        />
        <Knob
          label="DEC"
          min={0}
          max={1000}
          step={1}
          value={params.filterEnvDecay || 200}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setFilterEnvDecay}
        />
      </div>
      <div className="knobs-row">
        <Knob
          label="AMT"
          min={0}
          max={5000}
          step={10}
          value={params.filterEnvAmount || 3000}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setFilterEnvAmount}
        />
      </div>
    </div>
  );
};

