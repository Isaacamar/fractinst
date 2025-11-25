/**
 * TransportBar Component
 * Play/stop/record buttons, BPM, time display
 */

import React from 'react';
import { useTransportStore } from '../../stores/transportStore';
import './TransportBar.css';

interface TransportBarProps {
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onMetronomeToggle: () => void;
  onLeadInToggle: () => void;
  onBpmChange: (bpm: number) => void;
  onLoopLengthChange: (bars: number) => void;
  isRecording: boolean;
  isMetronomeEnabled: boolean;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  onPlay,
  onStop,
  onRecord,
  onMetronomeToggle,
  onLeadInToggle,
  onBpmChange,
  onLoopLengthChange,
  isRecording,
  isMetronomeEnabled
}) => {
  const { isPlaying, bpm, formattedTime, loopLengthBars, setLoopLengthBars, leadInEnabled } = useTransportStore();

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    if (!isNaN(newBpm)) {
      onBpmChange(newBpm);
    }
  };

  const handleLoopLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = parseInt(e.target.value, 10);
    if (!isNaN(newLength) && newLength > 0) {
      setLoopLengthBars(newLength);
      onLoopLengthChange(newLength);
    }
  };

  return (
    <div className="transport-bar">
      <div className="daw-info">
        <div className="time-display">
          <div className="label">TIME</div>
          <div className="value">{formattedTime}</div>
        </div>
        <div className="bpm-display">
          <div className="label">BPM</div>
          <input
            type="number"
            min="20"
            max="300"
            value={bpm}
            onChange={handleBpmChange}
            className="bpm-input"
          />
        </div>
        <div className="loop-info">
          <div className="label">BARS</div>
          <input
            type="number"
            min="1"
            max="999"
            value={loopLengthBars}
            onChange={handleLoopLengthChange}
            className="bpm-input"
            style={{ width: '50px' }}
          />
        </div>
      </div>

      <div className="transport-controls">
        <button
          className={`transport-btn play-btn ${isPlaying ? 'active' : ''}`}
          onClick={onPlay}
          title="Play"
        >
          ▶
        </button>
        <button
          className="transport-btn stop-btn"
          onClick={onStop}
          title="Stop"
        >
          ■
        </button>
        <button
          className={`transport-btn record-btn ${isRecording ? 'active' : ''}`}
          onClick={onRecord}
          title="Record"
        >
          ⦿
        </button>
        <button
          className={`transport-btn metronome-btn ${isMetronomeEnabled ? 'active' : ''}`}
          onClick={onMetronomeToggle}
          title="Metronome"
        >
          ♩
        </button>
        <button
          className={`transport-btn leadin-btn ${leadInEnabled ? 'active' : ''}`}
          onClick={onLeadInToggle}
          title="Lead-in Metronome"
        >
          ⏱
        </button>
        <div className={`recording-indicator ${isRecording ? 'recording-active' : ''}`}></div>
      </div>
    </div>
  );
};

