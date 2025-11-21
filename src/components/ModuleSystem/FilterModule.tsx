/**
 * Filter Module Component
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const FilterModule: React.FC = () => {
  const { params, filterBypassed, setFilterCutoff, setFilterResonance, setFilterType, setFilterBypass } = useAudioStore();

  return (
    <>
      <div className="filter-type-selector">
        <button
          className={`filter-type-btn ${params.filterType === 'lowpass' ? 'active' : ''}`}
          onClick={() => setFilterType('lowpass')}
        >
          LP
        </button>
        <button
          className={`filter-type-btn ${params.filterType === 'highpass' ? 'active' : ''}`}
          onClick={() => setFilterType('highpass')}
        >
          HP
        </button>
        <button
          className={`filter-type-btn ${params.filterType === 'bandpass' ? 'active' : ''}`}
          onClick={() => setFilterType('bandpass')}
        >
          BP
        </button>
      </div>
      <div className="filter-bypass-toggle">
        <button
          className={`filter-bypass-btn ${!filterBypassed ? 'active' : ''}`}
          onClick={() => setFilterBypass(!filterBypassed)}
        >
          FILTER: {filterBypassed ? 'OFF' : 'ON'}
        </button>
      </div>
      <div className="knobs-row">
        <Knob
          label="CUT"
          min={20}
          max={20000}
          step={10}
          value={params.filterCutoff}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setFilterCutoff}
        />
        <Knob
          label="RES"
          min={0.1}
          max={20}
          step={0.1}
          value={params.filterResonance}
          formatValue={(v) => v.toFixed(1)}
          onChange={setFilterResonance}
        />
      </div>
    </>
  );
};

