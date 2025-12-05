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

const MemoizedSequencerRow = React.memo(({
  sound,
  patterns,
  stepCount,
  handleStepClick
}: {
  sound: DrumSound,
  patterns: Record<DrumSound, boolean[]>,
  stepCount: number,
  handleStepClick: (sound: DrumSound, step: number) => void
}) => {
  // Defensive check: ensure pattern exists
  const rowPattern = patterns?.[sound];
  if (!rowPattern) return null;

  return (
    <div className="sequencer-row">
      <div className="sequencer-label-cell">
        <span className="drum-label">{DRUM_LABELS[sound]}</span>
      </div>
      {Array.from({ length: stepCount }, (_, step) => {
        const isActive = rowPattern[step];
        return (
          <button
            key={step}
            data-step={step}
            className={`sequencer-step ${isActive ? 'active' : ''}`}
            onClick={() => handleStepClick(sound, step)}
            title={`${DRUM_LABELS[sound]} - Step ${step + 1}`}
          />
        );
      })}
    </div>
  );
});

export const StepSequencer: React.FC<StepSequencerProps> = ({
  transport,
  drumMachine
}) => {
  const {
    patterns,
    stepCount,
    stepResolution,
    muted,
    isFrozen,
    savedPatterns,
    toggleStep,
    clearPattern,
    setStepCount,
    setStepResolution,
    toggleMute,
    setIsFrozen,
    savePattern,
    loadPattern
  } = useSequencerStore();

  const { isPlaying } = useTransportStore();
  const animationFrameRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastStepRef = useRef<number>(-1);

  // Optimized playhead visualization using direct DOM manipulation
  useEffect(() => {
    if (!transport || !isPlaying) {
      // Clear playhead
      if (gridRef.current && lastStepRef.current !== -1) {
        const prevSteps = gridRef.current.querySelectorAll(`[data-step="${lastStepRef.current}"]`);
        prevSteps.forEach(el => el.classList.remove('current'));
        lastStepRef.current = -1;
      }
      return;
    }

    const updatePlayhead = () => {
      const currentBeat = transport.getCurrentBeat();
      const beatsPerStep = 1 / stepResolution;
      const step = Math.floor(currentBeat / beatsPerStep) % stepCount;

      if (step !== lastStepRef.current) {
        if (gridRef.current) {
          // Remove from last step
          if (lastStepRef.current !== -1) {
            const prevSteps = gridRef.current.querySelectorAll(`[data-step="${lastStepRef.current}"]`);
            prevSteps.forEach(el => el.classList.remove('current'));
          }

          // Add to new step
          const newSteps = gridRef.current.querySelectorAll(`[data-step="${step}"]`);
          newSteps.forEach(el => el.classList.add('current'));
        }
        lastStepRef.current = step;
      }

      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [transport, isPlaying, stepCount, stepResolution]);

  const handleStepClick = React.useCallback((sound: DrumSound, step: number) => {
    toggleStep(sound, step);
    if (drumMachine) {
      drumMachine.trigger(sound);
    }
  }, [toggleStep, drumMachine]);

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

  const handleFreezeToggle = async () => {
    if (isFrozen) {
      setIsFrozen(false);
      if (drumMachine) {
        drumMachine.clearFrozen();
      }
    } else {
      if (drumMachine && transport) {
        const bpm = transport.getBpm();
        const buffer = await drumMachine.renderPattern(patterns, stepCount, stepResolution, bpm);
        if (buffer) {
          setIsFrozen(true);
        }
      }
    }
  };

  const renderStepNumbers = () => {
    return (
      <div className="sequencer-header-row">
        <div className="sequencer-label-cell"></div>
        {Array.from({ length: stepCount }, (_, i) => (
          <div
            key={i}
            data-step={i}
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
            disabled={isFrozen}
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
            disabled={isFrozen}
          >
            <option value="1">1/4 (Quarter)</option>
            <option value="2">1/8 (Eighth)</option>
            <option value="4">1/16 (Sixteenth)</option>
            <option value="8">1/32 (Thirty-second)</option>
          </select>
        </div>

        <div className="sequencer-control-group">
          <button
            className={`sequencer-btn ${isFrozen ? 'active' : ''}`}
            onClick={handleFreezeToggle}
            title={isFrozen ? "Unfreeze Sequence" : "Render and Freeze Sequence"}
            style={{ backgroundColor: isFrozen ? '#00ff9d' : '', color: isFrozen ? '#000' : '' }}
          >
            {isFrozen ? 'UNSET' : 'SET'}
          </button>
        </div>

        <div className="sequencer-control-group">
          <select
            className="sequencer-select"
            onChange={(e) => {
              if (e.target.value === 'save_new') {
                const name = prompt('Enter preset name:');
                if (name) savePattern(name);
                e.target.value = '';
              } else if (e.target.value) {
                loadPattern(e.target.value);
                e.target.value = '';
              }
            }}
            value=""
          >
            <option value="" disabled>Presets...</option>
            <option value="save_new">+ Save Preset</option>
            <optgroup label="Saved Patterns">
              {Object.keys(savedPatterns).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <button className="sequencer-btn" onClick={handleClear} disabled={isFrozen}>
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
        <div className="sequencer-grid" ref={gridRef}>
          {renderStepNumbers()}
          {patterns ? DRUM_SOUNDS.map((sound) => (
            <MemoizedSequencerRow
              key={sound}
              sound={sound}
              patterns={patterns}
              stepCount={stepCount}
              handleStepClick={handleStepClick}
            />
          )) : <div style={{ padding: '20px' }}>Loading patterns...</div>}
        </div>
      </div>
    </div>
  );
};

