import React, { useState } from 'react';
import { useSequencerStore } from '../../stores/sequencerStore';
import { DrumSound } from '../../engines/DrumMachine';
import { SequenceBlockData, SoundSelection } from '../../types/percussion';
import './SequenceBlockLibrary.css';

const DRUM_SOUNDS: DrumSound[] = [
  'kick', 'snare', 'clap', 'hihat-closed', 'hihat-open',
  'tom-low', 'tom-high', 'ride', 'crash', 'rim'
];

const DRUM_LABELS: Record<DrumSound, string> = {
  'kick': 'Kick',
  'snare': 'Snare',
  'clap': 'Clap',
  'hihat-closed': 'HH Closed',
  'hihat-open': 'HH Open',
  'tom-low': 'Tom Low',
  'tom-high': 'Tom High',
  'ride': 'Ride',
  'crash': 'Crash',
  'rim': 'Rim'
};

interface SequenceBlockLibraryProps {
  onDragStart: (blockData: SequenceBlockData, selectedSounds: DrumSound[]) => void;
}

export const SequenceBlockLibrary: React.FC<SequenceBlockLibraryProps> = ({ onDragStart }) => {
  const { savedPatterns } = useSequencerStore();
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [soundSelection, setSoundSelection] = useState<SoundSelection>({});

  // Initialize sound selection when pattern is selected
  const handlePatternSelect = (patternName: string) => {
    if (selectedPattern === patternName) {
      setSelectedPattern(null);
      setSoundSelection({});
    } else {
      setSelectedPattern(patternName);
      // Default: all sounds selected
      const allSelected: SoundSelection = {};
      DRUM_SOUNDS.forEach(sound => {
        allSelected[sound] = true;
      });
      setSoundSelection(allSelected);
    }
  };

  const toggleSound = (sound: DrumSound) => {
    setSoundSelection(prev => ({
      ...prev,
      [sound]: !prev[sound]
    }));
  };

  const handleDragStart = (patternName: string, e: React.DragEvent) => {
    const pattern = savedPatterns[patternName];
    if (!pattern) return;

    const blockData: SequenceBlockData = {
      name: patternName,
      patterns: pattern.patterns,
      stepCount: pattern.stepCount,
      stepResolution: pattern.stepResolution
    };

    const selectedSounds = DRUM_SOUNDS.filter(sound => soundSelection[sound]);

    // Pass data through dataTransfer and callback
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockData,
      selectedSounds
    }));
    onDragStart(blockData, selectedSounds);
  };

  const selectAllSounds = () => {
    const allSelected: SoundSelection = {};
    DRUM_SOUNDS.forEach(sound => {
      allSelected[sound] = true;
    });
    setSoundSelection(allSelected);
  };

  const deselectAllSounds = () => {
    setSoundSelection({});
  };

  return (
    <div className="sequence-block-library">
      <div className="library-header">
        <h3>Sequence Blocks</h3>
        <p className="library-hint">Click to select, then drag to timeline</p>
      </div>

      <div className="pattern-list">
        {Object.entries(savedPatterns).map(([name, pattern]) => (
          <div key={name} className="pattern-item-wrapper">
            <div
              className={`pattern-item ${selectedPattern === name ? 'selected' : ''}`}
              onClick={() => handlePatternSelect(name)}
              draggable={selectedPattern === name}
              onDragStart={(e) => handleDragStart(name, e)}
            >
              <div className="pattern-header">
                <span className="pattern-name">{name}</span>
                <span className="pattern-info">
                  {pattern.stepCount} steps • 1/{pattern.stepResolution}
                </span>
              </div>

              {/* Mini grid preview */}
              <div className="pattern-preview">
                {DRUM_SOUNDS.map(sound => {
                  const steps = pattern.patterns[sound];
                  if (!steps || !steps.some(step => step)) return null;

                  return (
                    <div key={sound} className="preview-row">
                      {steps.map((active, idx) => (
                        <div
                          key={idx}
                          className={`preview-step ${active ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sound selector - only show for selected pattern */}
            {selectedPattern === name && (
              <div className="sound-selector">
                <div className="selector-header">
                  <span>Select Sounds:</span>
                  <div className="selector-actions">
                    <button onClick={selectAllSounds} className="select-btn">All</button>
                    <button onClick={deselectAllSounds} className="select-btn">None</button>
                  </div>
                </div>

                <div className="sound-grid">
                  {DRUM_SOUNDS.map(sound => {
                    const hasSteps = pattern.patterns[sound]?.some(step => step);
                    const isSelected = soundSelection[sound];

                    return (
                      <div
                        key={sound}
                        className={`sound-row ${isSelected ? 'selected' : ''} ${!hasSteps ? 'empty' : ''}`}
                        onClick={() => toggleSound(sound)}
                      >
                        <div className="sound-indicator" />
                        <span className="sound-label">{DRUM_LABELS[sound]}</span>
                        {hasSteps && (
                          <div className="sound-preview">
                            {pattern.patterns[sound].map((active, idx) => (
                              <div
                                key={idx}
                                className={`mini-step ${active ? 'active' : ''}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="drag-hint">
                  Drag pattern to percussion track
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(savedPatterns).length === 0 && (
        <div className="empty-state">
          <p>No saved patterns yet</p>
          <p className="empty-hint">Create patterns in the step sequencer and save them to use here</p>
        </div>
      )}
    </div>
  );
};
