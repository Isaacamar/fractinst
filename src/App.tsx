/**
 * Main App Component
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioEngine } from './engines/AudioEngine';
import { DAWCore } from './engines/DAWCore';
import { DrumMachine } from './engines/DrumMachine';
import { TransportBar } from './components/TransportBar/TransportBar';
import { Oscilloscope } from './components/Oscilloscope/Oscilloscope';
import { ModuleSystem, ModuleSystemRef } from './components/ModuleSystem/ModuleSystem';
import { InstrumentLibrary } from './components/InstrumentLibrary/InstrumentLibrary';
import { PianoRoll } from './components/PianoRoll/PianoRoll';
import { StepSequencer } from './components/StepSequencer/StepSequencer';
import { BindingsModal } from './components/BindingsModal/BindingsModal';
import { TrackSelector } from './components/TrackControls/TrackSelector';
import { useKeyboardController } from './hooks/useKeyboardController';
import { SequencerScheduler } from './engines/SequencerScheduler';
import { useTransportStore } from './stores/transportStore';
import { useMidiStore } from './stores/midiStore';
import { useAudioStore } from './stores/audioStore';
import { useTrackStore } from './stores/trackStore';
import { useSequencerStore } from './stores/sequencerStore';
import type { InstrumentConfiguration } from './types/instrument';
import './App.css';

function App() {
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const dawCoreRef = useRef<DAWCore | null>(null);
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const sequencerSchedulerRef = useRef<SequencerScheduler | null>(null);
  const moduleSystemRef = useRef<ModuleSystemRef | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(false);
  const [isBindingsOpen, setIsBindingsOpen] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(4);
  const [currentView, setCurrentView] = useState<'instrument' | 'piano-roll' | 'sequencer'>('instrument');
  const [isPercussionMode, setIsPercussionMode] = useState(false);

  const transportStore = useTransportStore();
  const midiStore = useMidiStore();
  const audioStore = useAudioStore();
  const trackStore = useTrackStore();
  const sequencerStore = useSequencerStore();

  // Initial setup: create default track if none exists (only run once)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (trackStore.tracks.length === 0) {
      hasInitializedRef.current = true;
      // Create initial default track
      const defaultInstrument: InstrumentConfiguration = {
        id: `default_${Date.now()}`,
        name: 'Default Synth',
        isPreset: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        audioParams: { ...audioStore.params },
        filterBypassed: false,
        distortionBypassed: true,
        modules: []
      };

      trackStore.addTrack({
        id: `track_${Date.now()}`,
        name: 'Track 1',
        color: 'hsl(160, 100%, 50%)',
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        instrumentConfig: defaultInstrument,
        clips: []
      });
    }
  }, [trackStore.tracks.length, trackStore, audioStore.params]);

  // Load instrument when active track changes
  useEffect(() => {
    if (!trackStore.activeTrackId) return;

    const activeTrack = trackStore.tracks.find(t => t.id === trackStore.activeTrackId);
    if (activeTrack && activeTrack.instrumentConfig) {
      handleLoadInstrument(activeTrack.instrumentConfig);
    }
  }, [trackStore.activeTrackId]);

  // Initialize audio immediately (but resume on interaction)
  useEffect(() => {
    const initAudio = async () => {
      if (audioEngineRef.current) return;

      const audioEngine = new AudioEngine();
      await audioEngine.init();
      // Don't wait for resumeAudio - let it happen on first interaction
      // This allows UI to render immediately

      const dawCore = new DAWCore();
      const context = audioEngine.getContext();
      if (context) {
        dawCore.setAudioContext(context);
        dawCore.setSynthEngine(audioEngine);
        dawCore.ensureInitialized();

        // Initialize Drum Machine
        const masterGain = audioEngine.getMasterGain();
        if (masterGain) {
          const drumMachine = new DrumMachine();
          await drumMachine.init(context, masterGain);
          drumMachineRef.current = drumMachine;
          
          // Initialize Sequencer Scheduler
          const transport = dawCore.getTransport();
          if (transport) {
            const sequencerScheduler = new SequencerScheduler(transport, drumMachine);
            sequencerSchedulerRef.current = sequencerScheduler;
          }
        }

        // Setup transport callbacks
        const transport = dawCore.getTransport();
        if (transport) {
          transport.onUpdate((time) => {
            transportStore.setCurrentTime(time);
            transportStore.setCurrentBeat(transport.getCurrentBeat());
            transportStore.setCurrentBar(transport.getCurrentBar());
            transportStore.setFormattedTime(transport.formatTime());
          });
        }

        // Setup DAW core event listeners
        dawCore.on('beatChanged', () => {
          transportStore.setFormattedTime(dawCore.getFormattedTime());
        });

        dawCore.on('barChanged', () => {
          // Update bar display
        });

        dawCore.on('recordingStart', () => {
          midiStore.setIsRecording(true);
        });

        dawCore.on('recordingStop', (data) => {
          midiStore.setIsRecording(false);
          // When recording stops, add the clip to the active track
          const newClip = data?.clip;
          if (newClip) {
            const activeTrackId = useTrackStore.getState().activeTrackId;
            if (activeTrackId) {
              useTrackStore.getState().addClipToTrack(activeTrackId, newClip);
            }
          }
        });

        // Sync audio store with audio engine
        syncAudioStoreToEngine(audioEngine, audioStore);

        // Sync lead-in settings
        dawCore.setLeadInBeatCount(transportStore.leadInBeatCount);
        if (dawCore.getLeadInEnabled() !== transportStore.leadInEnabled) {
          dawCore.toggleLeadIn();
        }

        audioEngineRef.current = audioEngine;
        dawCoreRef.current = dawCore;
        setIsInitialized(true);
      }
    };

    // Initialize immediately
    initAudio();

    // Resume audio on first user interaction
    const handleInteraction = async () => {
      if (audioEngineRef.current) {
        await audioEngineRef.current.resumeAudio();
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [transportStore, midiStore, audioStore]);

  // Sync audio store changes to audio engine - use individual effects for better performance
  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setWaveType(audioStore.params.waveType);
  }, [audioStore.params.waveType, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setMasterVolume(audioStore.params.masterVolume * 100);
  }, [audioStore.params.masterVolume, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setAttackTime(audioStore.params.attackTime);
  }, [audioStore.params.attackTime, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setDecayTime(audioStore.params.decayTime);
  }, [audioStore.params.decayTime, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setSustainLevel(audioStore.params.sustainLevel * 100);
  }, [audioStore.params.sustainLevel, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setReleaseTime(audioStore.params.releaseTime);
  }, [audioStore.params.releaseTime, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setFilterCutoff(audioStore.params.filterCutoff);
  }, [audioStore.params.filterCutoff, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setFilterResonance(audioStore.params.filterResonance);
  }, [audioStore.params.filterResonance, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setFilterType(audioStore.params.filterType);
  }, [audioStore.params.filterType, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setFilterBypass(audioStore.filterBypassed);
  }, [audioStore.filterBypassed, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setDistortionAmount(audioStore.params.distortionAmount);
  }, [audioStore.params.distortionAmount, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setDistortionBypass(audioStore.distortionBypassed);
  }, [audioStore.distortionBypassed, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setLFORate(audioStore.params.lfoRate);
  }, [audioStore.params.lfoRate, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setLFODepth(audioStore.params.lfoDepth);
  }, [audioStore.params.lfoDepth, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setLFOWaveType(audioStore.params.lfoWaveType);
  }, [audioStore.params.lfoWaveType, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setLFOTarget(audioStore.params.lfoTarget);
  }, [audioStore.params.lfoTarget, isInitialized]);

  useEffect(() => {
    if (!audioEngineRef.current || !isInitialized) return;
    audioEngineRef.current.setMasterDetune(audioStore.params.masterDetune);
  }, [audioStore.params.masterDetune, isInitialized]);

  // Update active note count
  useEffect(() => {
    if (!audioEngineRef.current) return;

    const interval = setInterval(() => {
      if (audioEngineRef.current) {
        audioStore.setActiveNoteCount(audioEngineRef.current.getActiveNoteCount());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [audioStore]);

  // Keyboard controller
  useKeyboardController(
    audioEngineRef.current,
    dawCoreRef.current,
    octaveOffset,
    setOctaveOffset,
    drumMachineRef.current,
    isPercussionMode
  );

  // Sync sequencer patterns to scheduler
  useEffect(() => {
    if (sequencerSchedulerRef.current) {
      sequencerSchedulerRef.current.setPatterns(
        sequencerStore.patterns,
        sequencerStore.stepCount,
        sequencerStore.stepResolution,
        sequencerStore.muted
      );
    }
  }, [sequencerStore.patterns, sequencerStore.stepCount, sequencerStore.stepResolution, sequencerStore.muted]);

  // Helper function to sync audio store to engine
  const syncAudioStoreToEngine = (engine: AudioEngine, store: typeof audioStore) => {
    const params = store.params;
    engine.setWaveType(params.waveType);
    engine.setMasterVolume(params.masterVolume * 100);
    engine.setAttackTime(params.attackTime);
    engine.setDecayTime(params.decayTime);
    engine.setSustainLevel(params.sustainLevel * 100);
    engine.setReleaseTime(params.releaseTime);
    engine.setFilterCutoff(params.filterCutoff);
    engine.setFilterResonance(params.filterResonance);
    engine.setFilterType(params.filterType);
    engine.setFilterBypass(store.filterBypassed);
    engine.setDistortionAmount(params.distortionAmount);
    engine.setDistortionBypass(store.distortionBypassed);
    engine.setLFORate(params.lfoRate);
    engine.setLFODepth(params.lfoDepth);
    engine.setLFOWaveType(params.lfoWaveType);
    engine.setLFOTarget(params.lfoTarget);
    engine.setMasterDetune(params.masterDetune);
  };

  const handlePlay = async () => {
    if (!dawCoreRef.current || !isInitialized) return;
    await dawCoreRef.current.play();
    transportStore.setIsPlaying(true);
    
    // Start sequencer scheduler if it exists
    if (sequencerSchedulerRef.current) {
      sequencerSchedulerRef.current.start();
    }
  };

  const handleStop = useCallback(() => {
    if (!dawCoreRef.current) return;
    dawCoreRef.current.stop();
    transportStore.setIsPlaying(false);
    if (audioEngineRef.current) {
      audioEngineRef.current.stopAllNotes();
    }
    
    // Stop sequencer scheduler
    if (sequencerSchedulerRef.current) {
      sequencerSchedulerRef.current.stop();
      sequencerSchedulerRef.current.reset();
    }
  }, [dawCoreRef]);

  const handleRecord = useCallback(async () => {
    if (!dawCoreRef.current || !isInitialized) return;

    if (midiStore.isRecording) {
      dawCoreRef.current.stopRecording();
      transportStore.setIsPlaying(false);
    } else {
      // Start playback first, then recording
      if (!transportStore.isPlaying) {
        await dawCoreRef.current.play();
        transportStore.setIsPlaying(true);
      }
      await dawCoreRef.current.record();
    }
  }, [dawCoreRef, isInitialized, midiStore.isRecording, transportStore.isPlaying]);

  const handlePauseStop = useCallback(() => {
    if (!dawCoreRef.current) return;

    if (midiStore.isRecording) {
      // Stop recording first
      dawCoreRef.current.stopRecording();
    }
    // Then stop playback
    handleStop();
  }, [dawCoreRef, midiStore.isRecording, handleStop]);

  // Transport keyboard shortcuts - must be after handleRecord and handlePauseStop are defined
  useEffect(() => {
    const handleTransportRecord = async () => {
      await handleRecord();
    };

    const handleTransportPauseStop = () => {
      handlePauseStop();
    };

    window.addEventListener('transport-record', handleTransportRecord);
    window.addEventListener('transport-pause-stop', handleTransportPauseStop);

    return () => {
      window.removeEventListener('transport-record', handleTransportRecord);
      window.removeEventListener('transport-pause-stop', handleTransportPauseStop);
    };
  }, [handleRecord, handlePauseStop]);

  const handleMetronomeToggle = () => {
    if (!dawCoreRef.current) return;
    const enabled = dawCoreRef.current.toggleMetronome();
    setIsMetronomeEnabled(enabled);
  };

  const handleLeadInToggle = () => {
    if (!dawCoreRef.current) return;
    const enabled = dawCoreRef.current.toggleLeadIn();
    transportStore.setLeadInEnabled(enabled);
  };

  const handleBpmChange = (bpm: number) => {
    if (!dawCoreRef.current) return;
    dawCoreRef.current.setBPM(bpm);
    transportStore.setBpm(bpm);
  };

  // Sync loop length changes from store to engine
  useEffect(() => {
    if (!dawCoreRef.current) return;
    const transport = dawCoreRef.current.getTransport();
    if (transport && transport.getLoopLengthBars() !== transportStore.loopLengthBars) {
      transport.setLoopLengthBars(transportStore.loopLengthBars);
    }
  }, [transportStore.loopLengthBars]);

  // Sync lead-in settings from store to engine
  useEffect(() => {
    if (!dawCoreRef.current) return;
    dawCoreRef.current.setLeadInBeatCount(transportStore.leadInBeatCount);
    // Lead-in enabled state is synced via toggle method
  }, [transportStore.leadInBeatCount]);

  // Sync lead-in enabled state
  useEffect(() => {
    if (!dawCoreRef.current) return;
    const currentEnabled = dawCoreRef.current.getLeadInEnabled();
    if (currentEnabled !== transportStore.leadInEnabled) {
      dawCoreRef.current.toggleLeadIn(); // Toggle to match store state
    }
  }, [transportStore.leadInEnabled]);

  const handleLoopLengthChange = (bars: number) => {
    if (!dawCoreRef.current) return;
    const transport = dawCoreRef.current.getTransport();
    if (transport) {
      transport.setLoopLengthBars(bars);
      transportStore.setLoopLengthBars(bars);
    }
  };

  const handleOctaveUp = () => {
    setOctaveOffset(Math.min(8, octaveOffset + 1));
  };

  const handleOctaveDown = () => {
    setOctaveOffset(Math.max(0, octaveOffset - 1));
  };

  const getOctaveDisplay = () => {
    return `C${octaveOffset}`;
  };

  const handleLoadInstrument = (config: InstrumentConfiguration) => {
    // Load audio parameters
    const params = config.audioParams;
    audioStore.setWaveType(params.waveType);
    audioStore.setMasterVolume(params.masterVolume * 100);
    audioStore.setAttackTime(params.attackTime);
    audioStore.setDecayTime(params.decayTime);
    audioStore.setSustainLevel(params.sustainLevel);
    audioStore.setReleaseTime(params.releaseTime);
    audioStore.setFilterCutoff(params.filterCutoff);
    audioStore.setFilterResonance(params.filterResonance);
    audioStore.setFilterType(params.filterType);
    audioStore.setFilterBypass(config.filterBypassed);
    audioStore.setDistortionAmount(params.distortionAmount);
    audioStore.setDistortionBypass(config.distortionBypassed);
    audioStore.setChorusAmount(params.chorusAmount);
    audioStore.setReverbAmount(params.reverbAmount);
    audioStore.setLFORate(params.lfoRate);
    audioStore.setLFODepth(params.lfoDepth);
    audioStore.setLFOWaveType(params.lfoWaveType);
    audioStore.setLFOTarget(params.lfoTarget);
    audioStore.setMasterDetune(params.masterDetune);
    audioStore.setUnisonDetune(params.unisonDetune);
    audioStore.setNoiseAmount(params.noiseAmount);
    audioStore.setFilterEnvAttack(params.filterEnvAttack);
    audioStore.setFilterEnvDecay(params.filterEnvDecay);
    audioStore.setFilterEnvAmount(params.filterEnvAmount);

    // Load module configuration
    if (moduleSystemRef.current) {
      moduleSystemRef.current.loadInstrument(config);
    }

    // Update audio engine
    if (audioEngineRef.current) {
      audioEngineRef.current.updateParams(audioStore.params);
    }
  };

  const handleExportInstrument = (name: string): InstrumentConfiguration | null => {
    if (!moduleSystemRef.current) return null;

    const modules = moduleSystemRef.current.exportState();

    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      audioParams: { ...audioStore.params },
      filterBypassed: audioStore.filterBypassed,
      distortionBypassed: audioStore.distortionBypassed,
      modules
    };
  };

  return (
    <div className="daw-container">
      <TransportBar
        onPlay={handlePlay}
        onStop={handlePauseStop}
        onRecord={handleRecord}
        onMetronomeToggle={handleMetronomeToggle}
        onLeadInToggle={handleLeadInToggle}
        onBpmChange={handleBpmChange}
        onLoopLengthChange={handleLoopLengthChange}
        isRecording={midiStore.isRecording}
        isMetronomeEnabled={isMetronomeEnabled}
      />

      {/* View Toggle and Octave Controls */}
      <div className="transport-bar-secondary">
        <div className="view-toggle">
          <button
            className={`view-btn ${currentView === 'instrument' ? 'view-btn-active' : ''}`}
            onClick={() => setCurrentView('instrument')}
            title="Instrument View"
          >
            INST
          </button>
          <button
            className={`view-btn ${currentView === 'piano-roll' ? 'view-btn-active' : ''}`}
            onClick={() => setCurrentView('piano-roll')}
            title="Piano Roll View"
          >
            ROLL
          </button>
          <button
            className={`view-btn ${currentView === 'sequencer' ? 'view-btn-active' : ''}`}
            onClick={() => setCurrentView('sequencer')}
            title="Step Sequencer"
          >
            SEQ
          </button>
        </div>

        <button
          className={`view-btn ${isBindingsOpen ? 'view-btn-active' : ''}`}
          onClick={() => setIsBindingsOpen(true)}
          title="Keyboard Bindings & Help"
          style={{ marginLeft: '10px', marginRight: '10px' }}
        >
          BINDINGS
        </button>

        <button
          className={`view-btn ${isPercussionMode ? 'view-btn-active' : ''}`}
          onClick={() => setIsPercussionMode(!isPercussionMode)}
          title="Toggle Percussion Mode"
          style={{ marginLeft: '10px', marginRight: '10px', backgroundColor: isPercussionMode ? '#ff9800' : '' }}
        >
          DRUMS
        </button>

        <TrackSelector />

        <div className="octave-controls" style={{ marginLeft: 'auto' }}>
          <button className="octave-btn" onClick={handleOctaveDown}>-OCT</button>
          <div className="octave-value">{getOctaveDisplay()}</div>
          <button className="octave-btn" onClick={handleOctaveUp}>+OCT</button>
        </div>

        {isPercussionMode && (
          <div className="kit-controls" style={{ marginLeft: '10px' }}>
            <select
              className="kit-select"
              onChange={(e) => drumMachineRef.current?.setKit(e.target.value as any)}
              style={{
                background: '#333',
                color: '#fff',
                border: '1px solid #555',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              <option value="tr909">TR-909</option>
              <option value="bvker">BVKER 909</option>
            </select>
          </div>
        )}
      </div>

      <BindingsModal
        isOpen={isBindingsOpen}
        onClose={() => setIsBindingsOpen(false)}
        currentOctave={octaveOffset}
      />

      {currentView === 'instrument' ? (
        <div className="daw-layout">
          <div className="left-sidebar">
            <Oscilloscope audioEngine={audioEngineRef.current} />
            <InstrumentLibrary
              onLoadInstrument={handleLoadInstrument}
              onExportInstrument={handleExportInstrument}
            />
          </div>
          <div className="controls-area-wrapper">
            <ModuleSystem
              ref={moduleSystemRef}
              audioContext={audioEngineRef.current?.getContext() || null}
              audioEngine={audioEngineRef.current}
            />
          </div>
        </div>
      ) : currentView === 'piano-roll' ? (
        <PianoRoll
          transport={dawCoreRef.current?.getTransport() || null}
          synthEngine={audioEngineRef.current}
          midiRecorder={dawCoreRef.current?.getMidiRecorder() || null}
          dawCore={dawCoreRef.current}
          onSwitchToInstrument={() => setCurrentView('instrument')}
        />
      ) : (
        <StepSequencer
          transport={dawCoreRef.current?.getTransport() || null}
          drumMachine={drumMachineRef.current}
        />
      )}
    </div>
  );
}

export default App;

