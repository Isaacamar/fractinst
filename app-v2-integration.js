/**
 * Integration Layer for V2 Engines
 * Bridges new low-latency engines with existing UI
 */

// Replace old engines with new ones
const synthEngine = new LowLatencySynthEngine();
const oscilloscope = new ElegantOscilloscope('oscilloscope');

// Keep existing DAW core (it should work with the new engine)
const dawCore = new DAWCore();

// Initialize onboarding
const onboarding = new Onboarding();
onboarding.init();

// Declare pianoRoll variable
let pianoRoll = null;

// Initialize audio on first user interaction
document.addEventListener('click', async () => {
    if (!synthEngine.context) {
        console.log('Initializing V2 audio engine on first click...');
        await synthEngine.resumeAudio();
        dawCore.setAudioContext(synthEngine.context);
        dawCore.setSynthEngine(synthEngine);
        console.log('V2 Audio engine initialized:', synthEngine.context);
        
        // Connect keyboard controller
        keyboardController.dawCore = dawCore;
        
        // Initialize piano roll with new system
        if (!pianoRoll && dawCore.transport && dawCore.midiRecorder) {
            pianoRoll = new PianoRoll(dawCore.transport, synthEngine, dawCore.midiRecorder, dawCore);
        }
    }
}, { once: true });

// Initialize keyboard controller
const keyboardController = new KeyboardController(synthEngine, {
    layout: 'qwerty',
    octaveOffset: 4
});

// Initialize keyboard help
const keyboardHelp = new KeyboardHelp(keyboardController);

// Initialize module system
let moduleUI = null;
let baseModulesInitialized = false;

function initializeModuleSystem() {
    if (!moduleUI) {
        moduleUI = new ModuleUI(moduleManager, moduleLayoutManager);
        
        if (!baseModulesInitialized) {
            initializeBaseModules();
            baseModulesInitialized = true;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModuleSystem);
} else {
    initializeModuleSystem();
}

// Set audio context when available
document.addEventListener('click', async () => {
    if (!moduleManager.audioContext && synthEngine.context) {
        moduleManager.setAudioContext(synthEngine.context);
    }
}, { once: false });

// Initialize base modules
function initializeBaseModules() {
    console.log('Initializing base modules...');
    
    const baseModuleTypes = [
        'oscillator-base',
        'voice-base',
        'amplitude-base',
        'filter-env-base',
        'filter-base',
        'distortion-base',
        'lfo-base'
    ];
    
    baseModuleTypes.forEach(type => {
        const module = moduleManager.addModule(type);
        if (module) {
            moduleUI.createModulePanel(module);
        }
    });
    
    setTimeout(() => {
        initializeKnobs();
        attachBaseModuleEventListeners();
        initializeDefaultSettings();
    }, 100);
}

/**
 * Initialize UI to match default audio engine settings
 */
function initializeDefaultSettings() {
    // Set sine wave button as active (default waveform)
    const controlsArea = document.querySelector('.controls-area');
    if (controlsArea) {
        const sineBtn = controlsArea.querySelector('.wave-btn[data-wave="sine"]');
        if (sineBtn) {
            const waveButtons = controlsArea.querySelectorAll('.wave-btn');
            waveButtons.forEach(b => b.classList.remove('active'));
            sineBtn.classList.add('active');
        }
        
        // Set distortion bypass button as active (distortion is bypassed by default)
        const distortionBypassBtn = controlsArea.querySelector('#distortion-bypass-btn');
        if (distortionBypassBtn) {
            distortionBypassBtn.dataset.bypassed = 'true';
            distortionBypassBtn.textContent = 'DISTORTION: OFF';
            distortionBypassBtn.classList.add('active');
            synthEngine.setDistortionBypass(true);
        }
    }
}

// Attach event listeners
function attachBaseModuleEventListeners() {
    const controlsArea = document.querySelector('.controls-area');
    if (!controlsArea) return;
    
    // Wave buttons
    controlsArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('wave-btn')) {
            const waveButtons = controlsArea.querySelectorAll('.wave-btn');
            waveButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            synthEngine.setWaveType(e.target.dataset.wave);
            console.log('Wave type changed to:', e.target.dataset.wave);
        }
    });
    
    // Filter type buttons
    controlsArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-type-btn')) {
            const filterTypeButtons = controlsArea.querySelectorAll('.filter-type-btn');
            filterTypeButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            synthEngine.setFilterType(e.target.dataset.filter);
            console.log('Filter type changed to:', e.target.dataset.filter);
        }
    });
    
    // Filter bypass button
    controlsArea.addEventListener('click', (e) => {
        if (e.target.id === 'filter-bypass-btn' || e.target.closest('#filter-bypass-btn')) {
            const btn = e.target.id === 'filter-bypass-btn' ? e.target : e.target.closest('#filter-bypass-btn');
            const isBypassed = btn.dataset.bypassed === 'true';
            const newBypassed = !isBypassed;
            
            synthEngine.setFilterBypass(newBypassed);
            btn.dataset.bypassed = newBypassed.toString();
            btn.textContent = newBypassed ? 'FILTER: OFF' : 'FILTER: ON';
            btn.classList.toggle('active', newBypassed);
            console.log('Filter bypass:', newBypassed ? 'ON' : 'OFF');
        }
    });
    
    // Distortion bypass button
    controlsArea.addEventListener('click', (e) => {
        if (e.target.id === 'distortion-bypass-btn' || e.target.closest('#distortion-bypass-btn')) {
            const btn = e.target.id === 'distortion-bypass-btn' ? e.target : e.target.closest('#distortion-bypass-btn');
            const isBypassed = btn.dataset.bypassed === 'true';
            const newBypassed = !isBypassed;
            
            synthEngine.setDistortionBypass(newBypassed);
            btn.dataset.bypassed = newBypassed.toString();
            btn.textContent = newBypassed ? 'DISTORTION: OFF' : 'DISTORTION: ON';
            btn.classList.toggle('active', newBypassed);
            console.log('Distortion bypass:', newBypassed ? 'ON' : 'OFF');
        }
    });
    
    // LFO target buttons
    controlsArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('lfo-target-btn')) {
            const lfoTargetButtons = controlsArea.querySelectorAll('.lfo-target-btn');
            lfoTargetButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            synthEngine.setLFOTarget(e.target.dataset.target);
            console.log('LFO target changed to:', e.target.dataset.target);
        }
    });
    
    // LFO wave buttons
    controlsArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('lfo-wave-btn')) {
            const lfoWaveButtons = controlsArea.querySelectorAll('.lfo-wave-btn');
            lfoWaveButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            synthEngine.setLFOWaveType(e.target.dataset.wave);
            console.log('LFO wave type changed to:', e.target.dataset.wave);
        }
    });
    
    // Unison toggle
    controlsArea.addEventListener('click', (e) => {
        if (e.target.id === 'unison-toggle-btn' || e.target.closest('#unison-toggle-btn')) {
            const btn = e.target.id === 'unison-toggle-btn' ? e.target : e.target.closest('#unison-toggle-btn');
            const isEnabled = synthEngine.params.unisonMode;
            // Note: Unison not yet implemented in V2, but keeping UI compatibility
            btn.classList.toggle('active');
            btn.textContent = !isEnabled ? 'UNISON: ON (2x)' : 'UNISON: OFF';
            console.log('Unison mode:', !isEnabled ? 'ON' : 'OFF');
        }
    });
}

// UI Elements
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const recordBtn = document.getElementById('record-btn');
const metronomeBtn = document.getElementById('metronome-btn');
const recordingIndicator = document.getElementById('recording-indicator');
const viewInstrumentBtn = document.getElementById('view-instrument-btn');
const viewPianoRollBtn = document.getElementById('view-piano-roll-btn');
const bpmInput = document.getElementById('bpm-input');
const timeDisplay = document.getElementById('time-display');
const loopDisplay = document.getElementById('loop-display');
const octaveDisplay = document.getElementById('octave-display');
const octaveUpBtn = document.getElementById('octave-up-btn');
const octaveDownBtn = document.getElementById('octave-down-btn');
const keyboardHelpBtn = document.getElementById('keyboard-help-btn');
const activeNotesCount = document.getElementById('active-notes-count');

// Knob configurations (same as before)
const knobConfigs = {
    'master-volume-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        formatValue: (v) => Math.round(v)
    },
    'attack-knob': {
        min: 0,
        max: 500,
        step: 1,
        value: 10,
        formatValue: (v) => Math.round(v) + 'ms'
    },
    'decay-knob': {
        min: 0,
        max: 500,
        step: 1,
        value: 100,
        formatValue: (v) => Math.round(v) + 'ms'
    },
    'sustain-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 70,
        formatValue: (v) => Math.round(v) + '%'
    },
    'release-knob': {
        min: 0,
        max: 1000,
        step: 1,
        value: 200,
        formatValue: (v) => Math.round(v) + 'ms'
    },
    'filter-cutoff-knob': {
        min: 20,
        max: 20000,
        step: 10,
        value: 12000, // Match audio engine default
        formatValue: (v) => Math.round(v) + 'Hz'
    },
    'filter-resonance-knob': {
        min: 0.1,
        max: 20,
        step: 0.1,
        value: 1.5, // Match audio engine default
        formatValue: (v) => v.toFixed(1)
    },
    'filter-env-atk-knob': {
        min: 0,
        max: 500,
        step: 1,
        value: 50,
        formatValue: (v) => Math.round(v) + 'ms'
    },
    'filter-env-dec-knob': {
        min: 0,
        max: 500,
        step: 1,
        value: 200,
        formatValue: (v) => Math.round(v) + 'ms'
    },
    'filter-env-amt-knob': {
        min: 0,
        max: 10000,
        step: 50,
        value: 3000,
        formatValue: (v) => Math.round(v) + 'Hz'
    },
    'lfo-rate-knob': {
        min: 0.1,
        max: 20,
        step: 0.1,
        value: 2,
        formatValue: (v) => v.toFixed(1) + 'Hz'
    },
    'lfo-depth-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 20,
        formatValue: (v) => Math.round(v) + '%'
    },
    'unison-detune-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 5,
        formatValue: (v) => Math.round(v) + 'c'
    },
    'noise-amount-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 0,
        formatValue: (v) => Math.round(v) + '%'
    },
    'distortion-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 0,
        formatValue: (v) => Math.round(v) + '%'
    },
    'master-detune-knob': {
        min: -100,
        max: 100,
        step: 1,
        value: 0,
        formatValue: (v) => {
            const val = Math.round(v);
            return (val > 0 ? '+' : '') + val + 'c';
        }
    }
};

const knobs = {};

function initializeKnobs() {
    Object.keys(knobConfigs).forEach(knobId => {
        const element = document.getElementById(knobId);
        if (!element) return;
        
        const param = element.dataset.param;
        if (knobs[param]) return;
        
        const config = knobConfigs[knobId];
        
        knobs[param] = new Knob(element, {
            ...config,
            onChange: (value) => {
                switch(param) {
                    case 'master-volume':
                        synthEngine.setMasterVolume(value);
                        break;
                    case 'attack':
                        synthEngine.setAttackTime(value / 1000);
                        break;
                    case 'decay':
                        synthEngine.setDecayTime(value / 1000);
                        break;
                    case 'sustain':
                        synthEngine.setSustainLevel(value);
                        break;
                    case 'release':
                        synthEngine.setReleaseTime(value / 1000);
                        break;
                    case 'filter-cutoff':
                        synthEngine.setFilterCutoff(value);
                        break;
                    case 'filter-resonance':
                        synthEngine.setFilterResonance(value);
                        break;
                    case 'filter-env-atk':
                        // Not implemented in V2 yet
                        break;
                    case 'filter-env-dec':
                        // Not implemented in V2 yet
                        break;
                    case 'filter-env-amt':
                        // Not implemented in V2 yet
                        break;
                    case 'lfo-rate':
                        synthEngine.setLFORate(value);
                        break;
                    case 'lfo-depth':
                        synthEngine.setLFODepth(value);
                        break;
                    case 'unison-detune':
                        // Not implemented in V2 yet
                        break;
                    case 'noise-amount':
                        // Not implemented in V2 yet
                        break;
                    case 'distortion':
                        synthEngine.setDistortionAmount(value);
                        break;
                    case 'master-detune':
                        synthEngine.setMasterDetune(value);
                        break;
                }
            }
        });
    });
}

window.initializeKnobs = initializeKnobs;
initializeKnobs();

// Transport controls
playBtn.addEventListener('click', async () => {
    await synthEngine.resumeAudio();
    dawCore.setAudioContext(synthEngine.context);
    dawCore.setSynthEngine(synthEngine);
    await dawCore.play();
    playBtn.classList.add('active');
    recordBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
    dawCore.stop();
    synthEngine.stopAllNotes();
    keyboardController.releaseAll();
    playBtn.classList.remove('active');
    recordBtn.classList.remove('active');
    recordBtn.disabled = true;
});

recordBtn.addEventListener('click', async () => {
    if (recordBtn.classList.contains('active')) {
        dawCore.stopRecording();
        recordBtn.classList.remove('active');
    } else {
        if (!dawCore.isPlaying) {
            await synthEngine.resumeAudio();
            dawCore.setAudioContext(synthEngine.context);
            dawCore.setSynthEngine(synthEngine);
        }
        await dawCore.record();
        recordBtn.classList.add('active');
    }
});

recordBtn.disabled = true;

metronomeBtn.addEventListener('click', () => {
    const enabled = dawCore.toggleMetronome();
    metronomeBtn.classList.toggle('active', enabled);
    metronomeBtn.textContent = enabled ? '♩ ON' : '♩';
});

// View toggle
viewInstrumentBtn.addEventListener('click', () => {
    if (pianoRoll) {
        pianoRoll.hide();
    } else {
        const pianoRollView = document.getElementById('piano-roll-view');
        const dawLayout = document.querySelector('.daw-layout');
        if (pianoRollView) pianoRollView.style.display = 'none';
        if (dawLayout) dawLayout.style.display = 'grid';
    }
    
    viewInstrumentBtn.classList.add('view-btn-active');
    viewPianoRollBtn.classList.remove('view-btn-active');
});

viewPianoRollBtn.addEventListener('click', async () => {
    console.log('ROLL button clicked!');
    try {
        // Ensure audio is initialized
        if (!synthEngine.context) {
            console.log('Initializing audio context...');
            await synthEngine.resumeAudio();
        }
        
        // Ensure DAW core is initialized
        console.log('Setting audio context and synth engine...');
        dawCore.setAudioContext(synthEngine.context);
        dawCore.setSynthEngine(synthEngine);
        keyboardController.dawCore = dawCore;
        
        // Ensure initialization completed
        console.log('Ensuring DAW core initialization...');
        if (!dawCore.ensureInitialized()) {
            console.error('Failed to initialize DAW core');
            console.log('Transport:', dawCore.transport);
            console.log('MidiRecorder:', dawCore.midiRecorder);
            return;
        }
        
        console.log('DAW core initialized successfully');
        
        // Initialize piano roll if needed
        if (!pianoRoll) {
            console.log('Initializing piano roll...');
            if (dawCore.transport && dawCore.midiRecorder) {
                pianoRoll = new PianoRoll(dawCore.transport, synthEngine, dawCore.midiRecorder, dawCore);
                console.log('Piano roll initialized');
            } else {
                console.error('Cannot initialize piano roll: transport or midiRecorder not available');
                console.log('Transport:', dawCore.transport);
                console.log('MidiRecorder:', dawCore.midiRecorder);
                return;
            }
        }
        
        if (pianoRoll) {
            console.log('Calling pianoRoll.show()...');
            pianoRoll.show();
            // Display existing clips
            const clips = dawCore.midiRecorder ? dawCore.midiRecorder.getClips() : [];
            if (clips.length > 0) {
                pianoRoll.displayClips(clips);
            }
        } else {
            console.error('Piano roll not initialized');
        }
        
        viewPianoRollBtn.classList.add('view-btn-active');
        viewInstrumentBtn.classList.remove('view-btn-active');
        console.log('View switch complete');
    } catch (error) {
        console.error('Error switching to piano roll view:', error);
        console.error(error.stack);
    }
});

// Recording event listeners
dawCore.on('recordingStart', () => {
    recordingIndicator.classList.add('recording-active');
    // Update piano roll in real-time during recording
    if (pianoRoll && dawCore.midiRecorder) {
        const updateRecordingDisplay = () => {
            if (dawCore.isRecording && dawCore.midiRecorder.currentClip) {
                const clips = dawCore.midiRecorder.getClips();
                if (clips.length > 0) {
                    pianoRoll.displayClips(clips);
                }
            }
            if (dawCore.isRecording) {
                requestAnimationFrame(updateRecordingDisplay);
            }
        };
        updateRecordingDisplay();
    }
});

dawCore.on('recordingStop', (data) => {
    recordingIndicator.classList.remove('recording-active', 'recording-lead-in');
    if (data && data.clips && pianoRoll) {
        // Display all clips on piano roll
        pianoRoll.displayClips(data.clips);
    }
});

// DAW controls
bpmInput.addEventListener('change', (e) => {
    const bpm = parseInt(e.target.value);
    dawCore.setBPM(bpm);
    // Update piano roll when BPM changes
    if (pianoRoll) {
        pianoRoll.onBpmChange();
    }
});

octaveUpBtn.addEventListener('click', () => {
    keyboardController.octaveUp();
    updateOctaveDisplay();
});

octaveDownBtn.addEventListener('click', () => {
    keyboardController.octaveDown();
    updateOctaveDisplay();
});

keyboardHelpBtn.addEventListener('click', () => {
    keyboardHelp.toggle();
});

function updateOctaveDisplay() {
    const noteName = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    octaveDisplay.textContent = `${noteName[0]}${keyboardController.getOctave()}`;
}

keyboardController.onOctaveChange = updateOctaveDisplay;

// DAW event listeners
dawCore.on('beatChanged', (data) => {
    timeDisplay.textContent = dawCore.getFormattedTime();
    // Piano roll playhead is now updated automatically via Transport.onUpdate
});

dawCore.on('barChanged', (data) => {
    loopDisplay.textContent = `${data.bar + 1}/${Math.ceil(dawCore.loopLengthBars)}`;
});

// Oscilloscope & UI updates
let lastActiveNoteUpdate = 0;
const activeNoteUpdateInterval = 100;

oscilloscope.start(() => {
    const waveformData = synthEngine.getWaveformData();
    
    // Get active frequency for stabilization
    const activeFreq = synthEngine.getPrimaryActiveFrequency();
    if (activeFreq && synthEngine.context) {
        oscilloscope.setExpectedFrequency(activeFreq, synthEngine.context.sampleRate);
    } else {
        oscilloscope.setExpectedFrequency(null);
    }
    
    if (waveformData && waveformData.length > 0) {
        try {
            oscilloscope.drawWaveform(waveformData);
        } catch (e) {
            console.error('Error drawing waveform:', e);
        }
    } else {
        oscilloscope.clear();
    }
    
    const now = performance.now();
    if (now - lastActiveNoteUpdate > activeNoteUpdateInterval) {
        activeNotesCount.textContent = synthEngine.getActiveNoteCount();
        lastActiveNoteUpdate = now;
    }
});

// Initialization
updateOctaveDisplay();
console.log('V2 Low-Latency Audio Engine with WebGL Oscilloscope initialized!');

// Start onboarding on page load (if not seen before)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => onboarding.start(), 500); // Small delay to let page render
    });
} else {
    setTimeout(() => onboarding.start(), 500);
}

