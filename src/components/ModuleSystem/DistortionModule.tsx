/**
 * Distortion Module Component
 */

import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Knob } from '../Knob/Knob';
import './Module.css';

export const DistortionModule: React.FC = () => {
  const { params, distortionBypassed, setDistortionAmount, setDistortionBypass } = useAudioStore();

  return (
    <>
      <div className="effect-bypass-toggle">
        <button
          className={`effect-bypass-btn ${!distortionBypassed ? 'active' : ''}`}
          onClick={() => setDistortionBypass(!distortionBypassed)}
        >
          DISTORTION: {distortionBypassed ? 'OFF' : 'ON'}
        </button>
      </div>
      <div className="knobs-row">
        <Knob
          label="DRIVE"
          min={0}
          max={100}
          step={1}
          value={params.distortionAmount}
          formatValue={(v) => Math.round(v).toString()}
          onChange={setDistortionAmount}
        />
      </div>
    </>
  );
};

