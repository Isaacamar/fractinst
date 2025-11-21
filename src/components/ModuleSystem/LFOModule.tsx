/**
 * LFO Module Component
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const LFOModule: React.FC = () => {
  const { params, setLFORate, setLFODepth, setLFOWaveType, setLFOTarget } = useAudioStore();

  return (
    <>
      <div className="lfo-target-selector">
        <button
          className={`lfo-target-btn ${params.lfoTarget === 'cutoff' ? 'active' : ''}`}
          onClick={() => setLFOTarget('cutoff')}
        >
          CUT
        </button>
        <button
          className={`lfo-target-btn ${params.lfoTarget === 'amplitude' ? 'active' : ''}`}
          onClick={() => setLFOTarget('amplitude')}
        >
          AMP
        </button>
        <button
          className={`lfo-target-btn ${params.lfoTarget === 'pitch' ? 'active' : ''}`}
          onClick={() => setLFOTarget('pitch')}
        >
          PIT
        </button>
      </div>
      <div className="knobs-row">
        <Knob
          label="RATE"
          min={0.1}
          max={20}
          step={0.1}
          value={params.lfoRate}
          formatValue={(v) => v.toFixed(1)}
          onChange={setLFORate}
        />
        <Knob
          label="DEPTH"
          min={0}
          max={100}
          step={1}
          value={params.lfoDepth}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setLFODepth}
        />
      </div>
      <div className="lfo-wave-selector">
        <button
          className={`lfo-wave-btn ${params.lfoWaveType === 'sine' ? 'active' : ''}`}
          onClick={() => setLFOWaveType('sine')}
        >
          SIN
        </button>
        <button
          className={`lfo-wave-btn ${params.lfoWaveType === 'triangle' ? 'active' : ''}`}
          onClick={() => setLFOWaveType('triangle')}
        >
          TRI
        </button>
        <button
          className={`lfo-wave-btn ${params.lfoWaveType === 'square' ? 'active' : ''}`}
          onClick={() => setLFOWaveType('square')}
        >
          SQR
        </button>
        <button
          className={`lfo-wave-btn ${params.lfoWaveType === 'sawtooth' ? 'active' : ''}`}
          onClick={() => setLFOWaveType('sawtooth')}
        >
          SAW
        </button>
      </div>
    </>
  );
};

