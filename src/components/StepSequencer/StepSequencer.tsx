/**
 * Step Sequencer Component
 * Visual grid-based sequencer for drum patterns
 */

import React, { useEffect, useRef } from 'react';
import { useSequencerStore } from '../../stores/sequencerStore';
import { useTransportStore } from '../../stores/transportStore';
import type { DrumSound } from '../../engines/DrumMachine';
import type { Transport } from '../../engines/Transport';
import type { DrumMachine } from '../../engines/DrumMachine';
import './StepSequencer.css';

interface StepSequencerProps {
  transport: Transport | null;
  drumMachine: DrumMachine | null;
}

const DRUM_SOUNDS: DrumSound[] = [
  'kick', 'snare', 'clap', 'hihat-closed', 'hihat-open',
  'tom-low', 'tom-high', 'ride', 'crash', 'rim'
];

const DRUM_LABELS: Record<DrumSound, string> = {
  'kick': 'KICK',
  'snare': 'SNR',
  'clap': 'CLP',
  'hihat-closed': 'HH',
  'hihat-open': 'OHH',
  'tom-low': 'LT',
  'tom-high': 'HT',
  'ride': 'RD',
  'crash': 'CR',
  'rim': 'RM'
};

export const StepSequencer: React.FC<StepSequencerProps> = ({
  transport,
  drumMachine
}) => {
  const {
    patterns,
    stepCount,
    currentStep,
    stepResolution,
    muted,
    toggleStep,
    clearPattern,
    setStepCount,
    setCurrentStep,
    setStepResolution,
    toggleMute
  } = useSequencerStore();

  const { isPlaying } = useTransportStore();
  const animationFrameRef = useRef<number | null>(null);

  // Update current step based on transport position
  useEffect(() => {
    if (!transport || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const updateStep = () => {
      const currentBeat = transport.getCurrentBeat();
      // Calculate beats per step based on step resolution
      const beatsPerStep = 1 / stepResolution;
      const step = Math.floor(currentBeat / beatsPerStep) % stepCount;
      setCurrentStep(step);
      animationFrameRef.current = requestAnimationFrame(updateStep);
    };

    animationFrameRef.current = requestAnimationFrame(updateStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [transport, isPlaying, stepCount, stepResolution, setCurrentStep]);

  const handleStepClick = (sound: DrumSound, step: number) => {
    toggleStep(sound, step);
    
    // Preview sound on click
    if (drumMachine) {
      drumMachine.trigger(sound);
    }
  };

  const handleStepCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCount = parseInt(e.target.value, 10);
    setStepCount(newCount);
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newResolution = parseInt(e.target.value, 10) as 1 | 2 | 4 | 8;
    setStepResolution(newResolution);
  };

  const handleClear = () => {
    if (window.confirm('Clear all patterns?')) {
      clearPattern();
    }
  };


  // Generate step numbers with visual grouping based on resolution
  const renderStepNumbers = () => {
    // Beat markers appear every `stepResolution` steps
    return (
      <div className="sequencer-header-row">
        <div className="sequencer-label-cell"></div>
        {Array.from({ length: stepCount }, (_, i) => (
          <div
            key={i}
            className={`sequencer-step-number ${i % stepResolution === 0 ? 'beat-marker' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="step-sequencer-container">
      <div className="sequencer-controls">
        <div className="sequencer-control-group">
          <label className="sequencer-label">STEPS</label>
          <select
            className="sequencer-select"
            value={stepCount}
            onChange={handleStepCountChange}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>
        <div className="sequencer-control-group">
          <label className="sequencer-label">RESOLUTION</label>
          <select
            className="sequencer-select"
            value={stepResolution}
            onChange={handleResolutionChange}
          >
            <option value="1">1/4 (Quarter)</option>
            <option value="2">1/8 (Eighth)</option>
            <option value="4">1/16 (Sixteenth)</option>
            <option value="8">1/32 (Thirty-second)</option>
          </select>
        </div>
        <button className="sequencer-btn" onClick={handleClear}>
          CLEAR
        </button>
        <button 
          className={`sequencer-btn ${muted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={muted ? 'Unmute Sequencer' : 'Mute Sequencer'}
        >
          {muted ? 'UNMUTE' : 'MUTE'}
        </button>
      </div>

      <div className="sequencer-grid-wrapper">
        <div className="sequencer-grid">
          {renderStepNumbers()}
          {DRUM_SOUNDS.map((sound) => (
            <div key={sound} className="sequencer-row">
              <div className="sequencer-label-cell">
                <span className="drum-label">{DRUM_LABELS[sound]}</span>
              </div>
              {Array.from({ length: stepCount }, (_, step) => {
                const isActive = patterns[sound][step];
                const isCurrent = currentStep === step && isPlaying;
                return (
                  <button
                    key={step}
                    className={`sequencer-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleStepClick(sound, step)}
                    title={`${DRUM_LABELS[sound]} - Step ${step + 1}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

