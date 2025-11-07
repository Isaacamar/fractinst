/**
 * Main Application - Live DAW with Full Sound Design
 * Complete integration of SynthEngine, DAWCore, KeyboardController
 * Features: Filters, LFO, Unison, Noise, Distortion
 */

// ============================================
// INITIALIZE CORE COMPONENTS
// ============================================

const synthEngine = new SynthEngine();
const dawCore = new DAWCore();
const oscilloscope = new Oscilloscope('oscilloscope');
let pianoRoll = null; // Will be initialized after audio context is ready

// Initialize audio on first user interaction
document.addEventListener('click', async () => {
    if (!synthEngine.audioContext) {
        console.log('Initializing audio context on first click...');
        await synthEngine.resumeAudio();
        dawCore.setAudioContext(synthEngine.audioContext);
        dawCore.setSynthEngine(synthEngine);
        console.log('Audio context initialized:', synthEngine.audioContext);

        // Connect keyboard controller to DAW for MIDI recording
        keyboardController.dawCore = dawCore;
        console.log('Keyboard controller connected to DAW');

        // Initialize piano roll
        if (!pianoRoll) {
            pianoRoll = new PianoRoll(dawCore, synthEngine);
            console.log('Piano roll initialized');
        }
    }
}, { once: true });

// Initialize keyboard controller (will be updated with dawCore after it's ready)
const keyboardController = new KeyboardController(synthEngine, {
    layout: 'qwerty',
    octaveOffset: 4
});

// ============================================
// UI ELEMENTS
// ============================================

const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const recordBtn = document.getElementById('record-btn');
const metronomeBtn = document.getElementById('metronome-btn');
const recordingIndicator = document.getElementById('recording-indicator');
const viewInstrumentBtn = document.getElementById('view-instrument-btn');
const viewPianoRollBtn = document.getElementById('view-piano-roll-btn');
const waveButtons = document.querySelectorAll('.wave-btn');
const filterTypeButtons = document.querySelectorAll('.filter-type-btn');
const lfoTargetButtons = document.querySelectorAll('.lfo-target-btn');
const lfoWaveButtons = document.querySelectorAll('.lfo-wave-btn');
const unisonToggleBtn = document.getElementById('unison-toggle-btn');
const bpmInput = document.getElementById('bpm-input');
const timeDisplay = document.getElementById('time-display');
const loopDisplay = document.getElementById('loop-display');
const octaveDisplay = document.getElementById('octave-display');
const octaveUpBtn = document.getElementById('octave-up-btn');
const octaveDownBtn = document.getElementById('octave-down-btn');
const activeNotesCount = document.getElementById('active-notes-count');

// ============================================
// KNOB CONFIGURATIONS
// ============================================

const knobConfigs = {
    // Oscillator & Master
    'master-volume-knob': {
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        formatValue: (v) => Math.round(v)
    },
    // Amplitude ADSR
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
    // Filter
    'filter-cutoff-knob': {
        min: 20,
        max: 20000,
        step: 10,
        value: 5000,
        formatValue: (v) => Math.round(v) + 'Hz'
    },
    'filter-resonance-knob': {
        min: 0.1,
        max: 20,
        step: 0.1,
        value: 1,
        formatValue: (v) => v.toFixed(1)
    },
    // Filter Envelope
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
    // LFO
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
    // Unison & Effects
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
    }
};

const knobs = {};

// Create all knobs
Object.keys(knobConfigs).forEach(knobId => {
    const element = document.getElementById(knobId);
    if (element) {
        const config = knobConfigs[knobId];
        const param = element.dataset.param;

        knobs[param] = new Knob(element, {
            ...config,
            onChange: (value) => {
                // Real-time parameter updates
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
                        synthEngine.setFilterEnvAttack(value / 1000);
                        break;
                    case 'filter-env-dec':
                        synthEngine.setFilterEnvDecay(value / 1000);
                        break;
                    case 'filter-env-amt':
                        synthEngine.setFilterEnvAmount(value);
                        break;
                    case 'lfo-rate':
                        synthEngine.setLFORate(value);
                        break;
                    case 'lfo-depth':
                        synthEngine.setLFODepth(value);
                        break;
                    case 'unison-detune':
                        synthEngine.setUnisonDetune(value);
                        break;
                    case 'noise-amount':
                        synthEngine.setNoiseAmount(value);
                        break;
                    case 'distortion':
                        synthEngine.setDistortionAmount(value);
                        break;
                }
            }
        });
    }
});

// ============================================
// WAVE TYPE SELECTION
// ============================================

waveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        waveButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synthEngine.setWaveType(btn.dataset.wave);
    });
});

// ============================================
// FILTER CONTROLS
// ============================================

filterTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTypeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synthEngine.setFilterType(btn.dataset.filter);
    });
});

// ============================================
// LFO CONTROLS
// ============================================

lfoTargetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        lfoTargetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synthEngine.setLFOTarget(btn.dataset.target);
    });
});

lfoWaveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        lfoWaveButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synthEngine.setLFOWaveType(btn.dataset.wave);
    });
});

// ============================================
// UNISON TOGGLE
// ============================================

unisonToggleBtn.addEventListener('click', () => {
    const isEnabled = synthEngine.params.unisonMode;
    synthEngine.setUnisonMode(!isEnabled);
    unisonToggleBtn.classList.toggle('active');
    unisonToggleBtn.textContent = !isEnabled ? 'UNISON: ON (2x)' : 'UNISON: OFF';
});

// ============================================
// TRANSPORT CONTROLS
// ============================================

playBtn.addEventListener('click', async () => {
    await synthEngine.resumeAudio();
    dawCore.setAudioContext(synthEngine.audioContext);
    dawCore.setSynthEngine(synthEngine);
    dawCore.play();
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
            // Ensure audio is initialized before recording
            await synthEngine.resumeAudio();
            dawCore.setAudioContext(synthEngine.audioContext);
            dawCore.setSynthEngine(synthEngine);
        }
        dawCore.record();
        recordBtn.classList.add('active');
    }
});

recordBtn.disabled = true;

metronomeBtn.addEventListener('click', () => {
    const enabled = dawCore.toggleMetronome();
    metronomeBtn.classList.toggle('active', enabled);
    metronomeBtn.textContent = enabled ? '♩ ON' : '♩';
});

// ============================================
// VIEW TOGGLE
// ============================================

viewInstrumentBtn.addEventListener('click', () => {
    if (pianoRoll) {
        pianoRoll.hide();
        viewInstrumentBtn.classList.add('view-btn-active');
        viewPianoRollBtn.classList.remove('view-btn-active');
    }
});

viewPianoRollBtn.addEventListener('click', () => {
    if (pianoRoll) {
        pianoRoll.show();
        viewPianoRollBtn.classList.add('view-btn-active');
        viewInstrumentBtn.classList.remove('view-btn-active');
    }
});

// ============================================
// RECORDING EVENT LISTENERS
// ============================================

dawCore.on('recordingStart', () => {
    recordingIndicator.classList.add('recording-lead-in');
});

dawCore.on('recordingActualStart', () => {
    recordingIndicator.classList.remove('recording-lead-in');
    recordingIndicator.classList.add('recording-active');
});

dawCore.on('recordingStop', (data) => {
    recordingIndicator.classList.remove('recording-active', 'recording-lead-in');
    if (data) {
        if (data.recordingUrl) {
            console.log('Recording saved at:', data.recordingUrl);
            console.log('You can download or playback this audio');
        }
        if (data.midiNotes && data.midiNotes.length > 0) {
            console.log('MIDI notes recorded:', data.midiNotes.length, 'notes');
            console.log('MIDI data:', data.midiNotes);

            // Update the MIDI part for playback
            dawCore.updateMidiPart();

            // Display MIDI notes on piano roll if it exists
            if (pianoRoll) {
                pianoRoll.displayMidiNotes(data.midiNotes);
            }
        }
    }
});

// ============================================
// DAW CONTROLS
// ============================================

bpmInput.addEventListener('change', (e) => {
    const bpm = parseInt(e.target.value);
    dawCore.setBPM(bpm);
});

octaveUpBtn.addEventListener('click', () => {
    keyboardController.octaveUp();
    updateOctaveDisplay();
});

octaveDownBtn.addEventListener('click', () => {
    keyboardController.octaveDown();
    updateOctaveDisplay();
});

function updateOctaveDisplay() {
    const noteName = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    octaveDisplay.textContent = `${noteName[0]}${keyboardController.getOctave()}`;
}

// ============================================
// DAW EVENT LISTENERS
// ============================================

dawCore.on('beatChanged', (data) => {
    timeDisplay.textContent = dawCore.getFormattedTime();
    // Update piano roll playback line
    if (pianoRoll) {
        pianoRoll.updatePlaybackLine(dawCore.currentBeat);
    }
});

dawCore.on('barChanged', (data) => {
    loopDisplay.textContent = `${data.bar + 1}/${Math.ceil(dawCore.loopLengthBars)}`;
});

dawCore.on('loopComplete', () => {
    console.log('Loop completed!');
});

// ============================================
// OSCILLOSCOPE & UI UPDATES (combined for efficiency)
// ============================================

let lastActiveNoteUpdate = 0;
const activeNoteUpdateInterval = 100; // ms

oscilloscope.start(() => {
    const waveformData = synthEngine.getWaveformData();

    if (waveformData) {
        oscilloscope.drawWaveform(waveformData);
    } else {
        oscilloscope.clear();
    }

    // Update active notes count less frequently to avoid DOM thrashing
    const now = performance.now();
    if (now - lastActiveNoteUpdate > activeNoteUpdateInterval) {
        activeNotesCount.textContent = synthEngine.getActiveNoteCount();
        lastActiveNoteUpdate = now;
    }
});

// ============================================
// INITIALIZATION
// ============================================

updateOctaveDisplay();
console.log('Live DAW with Sound Design initialized!');
console.log('Features: Filter + Envelope, LFO, Unison, Noise, Distortion');
