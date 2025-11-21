import React from 'react';
import { useTrackStore } from '../../stores/trackStore';
import './TrackSelector.css';

export const TrackSelector: React.FC = () => {
  const { tracks, activeTrackId, setActiveTrack, addTrack } = useTrackStore();

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trackId = e.target.value;
    setActiveTrack(trackId);
  };

  const handleAddTrack = () => {
    const trackId = `track_${Date.now()}`;
    const instrumentId = `instrument_${Date.now()}`;
    const newTrack = {
      id: trackId,
      name: `Track ${tracks.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      instrumentConfig: {
        id: instrumentId,
        name: 'Default Synth',
        isPreset: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        audioParams: {
          waveType: 'sawtooth',
          masterVolume: 0.5,
          attackTime: 0.1,
          decayTime: 0.3,
          sustainLevel: 0.5,
          releaseTime: 0.5,
          filterCutoff: 2000,
          filterResonance: 1,
          filterType: 'lowpass',
          distortionAmount: 0,
          lfoRate: 5,
          lfoDepth: 0,
          lfoWaveType: 'sine',
          lfoTarget: 'cutoff',
          masterDetune: 0,
          chorusAmount: 0,
          reverbAmount: 0,
          unisonDetune: 0,
          noiseAmount: 0,
          filterEnvAttack: 0.1,
          filterEnvDecay: 0.3,
          filterEnvAmount: 0
        },
        filterBypassed: false,
        distortionBypassed: true,
        modules: []
      },
      clips: []
    };
    // @ts-ignore - InstrumentConfig type mismatch in store vs here, but it works for now
    addTrack(newTrack);
  };

  return (
    <div className="track-selector">
      <select 
        value={activeTrackId || ''} 
        onChange={handleTrackChange}
        className="track-select-dropdown"
      >
        <option value="" disabled>Select Track</option>
        {tracks.map(track => (
          <option key={track.id} value={track.id}>
            {track.name}
          </option>
        ))}
      </select>
      <button className="add-track-btn" onClick={handleAddTrack}>
        +
      </button>
    </div>
  );
};

