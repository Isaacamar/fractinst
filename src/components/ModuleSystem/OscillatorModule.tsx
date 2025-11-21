/**
 * Oscillator Module Component
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const OscillatorModule: React.FC = () => {
  const { params, setWaveType } = useAudioStore();

  const waveTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  return (
    <>
      <div className="wave-selector">
        {waveTypes.map((wave) => (
          <button
            key={wave}
            className={`wave-btn ${params.waveType === wave ? 'active' : ''}`}
            onClick={() => setWaveType(wave)}
          >
            {wave === 'square' ? 'SQR' : wave === 'sawtooth' ? 'SAW' : wave === 'triangle' ? 'TRI' : 'SINE'}
          </button>
        ))}
      </div>
      <div className="knobs-row">
        <div className="knob-container">
          <Knob
            label="VOL"
            min={0}
            max={100}
            step={1}
            value={params.masterVolume * 100}
            formatValue={(v) => Math.round(v).toString()}
            onChange={(v) => useAudioStore.getState().setMasterVolume(v)}
          />
        </div>
        <div className="knob-container">
          <Knob
            label="TUNE"
            min={-100}
            max={100}
            step={1}
            value={params.masterDetune}
            formatValue={(v) => {
              const val = Math.round(v);
              return (val > 0 ? '+' : '') + val + 'c';
            }}
            onChange={(v) => useAudioStore.getState().setMasterDetune(v)}
          />
        </div>
      </div>
    </>
  );
};

