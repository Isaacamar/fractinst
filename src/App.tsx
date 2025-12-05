/**
 * Main App Component
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AudioEngine } from './engines/AudioEngine';
import { DAWCore } from './engines/DAWCore';
import { DrumMachine } from './engines/DrumMachine';
import { TransportBar } from './components/TransportBar/TransportBar';
import { Oscilloscope } from './components/Oscilloscope/Oscilloscope';
import { DrumOscilloscope } from './components/Oscilloscope/DrumOscilloscope';
import { ModuleSystem, ModuleSystemRef } from './components/ModuleSystem/ModuleSystem';
import { InstrumentLibrary } from './components/InstrumentLibrary/InstrumentLibrary';
import { PianoRoll } from './components/PianoRoll/PianoRoll';
import { StepSequencer } from './components/StepSequencer/StepSequencer';
import { BindingsModal } from './components/BindingsModal/BindingsModal';
import { Onboarding } from './components/Onboarding/Onboarding';
import { TrackSelector } from './components/TrackControls/TrackSelector';
import { useKeyboardController } from './hooks/useKeyboardController';
import { SequencerScheduler } from './engines/SequencerScheduler';
import { useTransportStore } from './stores/transportStore';
import { useMidiStore } from './stores/midiStore';
import { useAudioStore } from './stores/audioStore';
import { useTrackStore } from './stores/trackStore';
import { useSequencerStore } from './stores/sequencerStore';
import { useProjectStore } from './stores/projectStore';
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
        type: 'midi',
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
    if (activeTrack && activeTrack.type === 'midi') {
      handleLoadInstrument(activeTrack.instrumentConfig);
    }
  }, [trackStore.activeTrackId]);

  // Define handleModuleStateChange at the top level
  const handleModuleStateChange = useCallback((modules: InstrumentConfiguration['modules']) => {
    const state = useTrackStore.getState();
    const activeTrackId = state.activeTrackId;
    if (activeTrackId) {
      const track = state.tracks.find(t => t.id === activeTrackId);
      if (track && track.type === 'midi') {
        state.updateTrack(activeTrackId, {
          instrumentConfig: {
            ...track.instrumentConfig,
            modules: modules as any
          }
        });
      }
    }
  }, []);

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

        // Sync lead-in settings (if methods exist)
        // dawCore.setLeadInBeatCount(transportStore.leadInBeatCount);
        // if (dawCore.getLeadInEnabled() !== transportStore.leadInEnabled) {
        //   dawCore.toggleLeadIn();
        // }

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

  // Sync AudioStore changes back to TrackStore (Active Track)
  useEffect(() => {
    const activeTrackId = trackStore.activeTrackId;
    if (!activeTrackId) return;

    // Avoid infinite loop: only update if changed? 
    // Actually, audioStore is the source of truth for the ACTIVE instrument's params while editing.
    // We should debounce this or just update.

    const currentTrack = trackStore.tracks.find(t => t.id === activeTrackId);
    if (!currentTrack || currentTrack.type !== 'midi') return;

    // We need to merge current audioStore params into the track's instrument config
    const newConfig = {
      ...currentTrack.instrumentConfig,
      audioParams: { ...audioStore.params },
      filterBypassed: audioStore.filterBypassed,
      distortionBypassed: audioStore.distortionBypassed
    };

    // Only update if different to avoid cycles? 
    // trackStore.updateTrack will cause a re-render.
    // And we have a useEffect that listens to trackStore.activeTrackId but NOT trackStore.tracks (deeply).
    // The effect at line 84 listens to `trackStore.activeTrackId` ONLY.
    // So updating the track content should be safe from reloading the instrument.

    // However, we must be careful not to spam state updates.
    // For now, let's assume it's fine as user interaction drives audioStore changes.

    // CHECK: Does updateTrack trigger a re-render of App? Yes.
    // Does that trigger anything else?

    trackStore.updateTrack(activeTrackId, { instrumentConfig: newConfig });

  }, [
    audioStore.params,
    audioStore.filterBypassed,
    audioStore.distortionBypassed,
    // activeTrackId is needed but we don't want to trigger on track switch (that's handled by loadInstrument)
    // verify logic: When track switches, loadInstrument is called. AudioParams change. This effect fires.
    // It writes BACK to the track. That is redundant but harmless if data is same.
    // BUT: If we switch tracks, `audioStore` is updated. This effect fires. It writes to the NEW active track?
    // Race condition! 
    // If `trackStore.activeTrackId` updates, and `audioStore` hasn't yet updated (effect scheduling),
    // we might overwrite the new track with old audio params!

    // Solution: This effect should NOT depend on activeTrackId directly for triggering,
    // OR we need to ensure loadInstrument happens strictly before this effect runs.
    // `handleLoadInstrument` is called in an effect dependent on `activeTrackId` (line 84).
    // If we put this sync logic here, we need to make sure we aren't overwriting.

    // Better: Don't use useEffect here. Update TrackStore INSIDE the audioStore setters?
    // No, that couples stores.
    // 
    // Let's stick to useEffect but add a ref to track "loading" state?
    // Or just check if the values are actually different.
    trackStore.activeTrackId
  ]);

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
        sequencerStore.muted,
        sequencerStore.isFrozen
      );
    }
  }, [sequencerStore.patterns, sequencerStore.stepCount, sequencerStore.stepResolution, sequencerStore.muted, sequencerStore.isFrozen]);

  // Handle frozen playback
  useEffect(() => {
    if (!drumMachineRef.current) return;

    if (sequencerStore.isFrozen && transportStore.isPlaying) {
      // If frozen and playing, play the frozen buffer
      // We need to sync it to the transport time
      // For now, just play immediately or restart loop
      // Ideally, we should calculate the offset based on current beat
      drumMachineRef.current.playFrozen();
    } else {
      // Stop frozen playback if not playing or not frozen
      drumMachineRef.current.stopFrozen();
    }
  }, [sequencerStore.isFrozen, transportStore.isPlaying]);

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
      // Don't stop playback, just punch out
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
    // Lead-in toggle functionality
    // if (!dawCoreRef.current) return;
    // const enabled = dawCoreRef.current.toggleLeadIn();
    // transportStore.setLeadInEnabled(enabled);
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

  // Sync lead-in settings from store to engine (commented out - methods may not exist)
  // useEffect(() => {
  //   if (!dawCoreRef.current) return;
  //   dawCoreRef.current.setLeadInBeatCount(transportStore.leadInBeatCount);
  //   // Lead-in enabled state is synced via toggle method
  // }, [transportStore.leadInBeatCount]);

  // Sync lead-in enabled state (commented out - methods may not exist)
  // useEffect(() => {
  //   if (!dawCoreRef.current) return;
  //   const currentEnabled = dawCoreRef.current.getLeadInEnabled();
  //   if (currentEnabled !== transportStore.leadInEnabled) {
  //     dawCoreRef.current.toggleLeadIn(); // Toggle to match store state
  //   }
  // }, [transportStore.leadInEnabled]);

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
      <div className="transport-bar-secondary" id="view-toggles">
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
          id="btn-bindings"
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

        <button
          className="view-btn help-btn"
          onClick={() => (window as any).startOnboarding?.()}
          title="Start Tour"
          style={{ marginLeft: '10px', width: '36px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ?
        </button>

        <Link
          to="/manual"
          className="view-btn"
          title="Open Manual"
          style={{
            marginLeft: '10px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem'
          }}
        >
          MANUAL
        </Link>

        <div className="project-controls" style={{ marginLeft: '10px', display: 'flex', gap: '5px' }}>
          <button
            className="view-btn"
            onClick={() => {
              const project = useProjectStore.getState().saveProject();
              const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${project.metadata.name.replace(/\s+/g, '_')}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Save Project"
          >
            SAVE
          </button>
          <button
            className="view-btn"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const project = JSON.parse(e.target?.result as string);
                    useProjectStore.getState().loadProject(project);
                  } catch (err) {
                    console.error('Failed to load project:', err);
                    alert('Invalid project file');
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            title="Load Project"
          >
            LOAD
          </button>
        </div>
      </div>

      <Onboarding
        setIsBindingsOpen={setIsBindingsOpen}
        setCurrentView={setCurrentView}
      />

      <BindingsModal
        isOpen={isBindingsOpen}
        onClose={() => setIsBindingsOpen(false)}
        currentOctave={octaveOffset}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {
          currentView === 'instrument' ? (
            <div className="daw-layout">
              <div className="left-sidebar">
                <div id="oscilloscope">
                  {isPercussionMode ? (
                    <DrumOscilloscope drumMachine={drumMachineRef.current} />
                  ) : (
                    <Oscilloscope audioEngine={audioEngineRef.current} />
                  )}
                </div>
                <InstrumentLibrary
                  onLoadInstrument={handleLoadInstrument}
                  onExportInstrument={handleExportInstrument}
                />
              </div>
              <div className="controls-area-wrapper" id="module-system">
                <ModuleSystem
                  ref={moduleSystemRef}
                  audioContext={audioEngineRef.current?.getContext() || null}
                  audioEngine={audioEngineRef.current}
                  onStateChange={handleModuleStateChange}
                />
              </div>
            </div>
          ) : currentView === 'piano-roll' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <PianoRoll
                transport={dawCoreRef.current?.getTransport() || null}
                synthEngine={audioEngineRef.current}
                midiRecorder={dawCoreRef.current?.getMidiRecorder() || null}
                dawCore={dawCoreRef.current}
                onSwitchToInstrument={() => setCurrentView('instrument')}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <StepSequencer
                transport={dawCoreRef.current?.getTransport() || null}
                drumMachine={drumMachineRef.current}
              />
            </div>
          )
        }
      </div>
    </div >
  );
}

export default App;

