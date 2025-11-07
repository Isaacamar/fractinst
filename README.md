# Live Synth DAW

A professional-grade browser-based synthesizer and Digital Audio Workstation (DAW) built with the Web Audio API. Features real-time sound design, polyphonic synthesis, recording, and an intuitive QWERTY keyboard interface.

## Features

### Sound Design
- **4 Oscillator Types**: Sine, Square, Sawtooth, Triangle
- **Advanced Filters**: Biquad filter with cutoff, resonance, and envelope modulation
- **Filter Envelope**: Separate ADSR control for dynamic filter sweeps
- **LFO System**: Global Low-Frequency Oscillator with 4 waveform types and 3 modulation targets
  - Cutoff modulation
  - Amplitude modulation (tremolo)
  - Pitch modulation (vibrato)
- **Unison Mode**: Multi-voice layering with detuning for fat, thick sounds
- **Noise Generator**: Blend white noise with oscillators
- **Distortion**: Soft-clip waveshaper with tone control
- **Master Volume**: Overall output level control

### ADSR Envelopes
- **Amplitude Envelope**: Shape note attack, decay, sustain, and release
- **Filter Envelope**: Modulate filter cutoff over time
- Independent control for each envelope stage (0-1000ms or more)

### DAW Features
- **BPM-Synchronized Timing**: Adjustable tempo from 20-300 BPM
- **Loop System**: 4-bar looping with beat/bar tracking
- **Recording**: Capture audio with 4-beat lead-in metronome
- **Metronome**: Audible clicks with lead-in during recording
- **Transport Controls**: Play, Stop, Record buttons
- **Time Display**: Real-time bar:beat:fraction display

### Keyboard & Control
- **QWERTY Layout**: Two octaves of piano keys
  - Q-U: First octave white keys (C-B)
  - 1-5: First octave black keys (C#-A#)
  - A-J: Second octave white keys (C-B)
  - 6-0: Second octave black keys (C#-A#)
- **Octave Controls**: Shift octave up/down
- **Interactive Knobs**: Real-time parameter adjustment
- **Visual Feedback**: Active note display and recording indicators

### Real-Time Visualization
- **Oscilloscope**: Standing wave display with vertical bars
- **Waveform Grid**: Reference grid for visual analysis
- **Recording Indicator**:
  - Yellow pulse during lead-in metronome
  - Red blink during active recording
- **Active Notes Counter**: See how many voices are playing

## How It Works

### Audio Signal Chain
```
┌─────────────────────────────────────────┐
│   Oscillators (Primary + Unison)        │
│   + Noise Generator                     │
└──────────────┬──────────────────────────┘
               ↓
       ┌───────────────┐
       │    Mixer      │
       └───────┬───────┘
               ↓
       ┌───────────────┐
       │ Distortion    │
       │ (Optional)    │
       └───────┬───────┘
               ↓
       ┌───────────────┐
       │ Biquad Filter │
       │ + Envelope    │
       └───────┬───────┘
               ↓
       ┌───────────────┐
       │  Gain Env     │
       │  (ADSR)       │
       └───────┬───────┘
               ↓
       ┌───────────────┐
       │ Master Gain   │
       └───────┬───────┘
               ↓
      ┌────────┴────────┐
      ↓                 ↓
   Speaker          Recording
                    (WebM)
```

### LFO Modulation
The LFO (Low-Frequency Oscillator) continuously modulates chosen targets:
- **Cutoff**: Filter sweeps for evolving timbres
- **Amplitude**: Tremolo effect for rhythmic movement
- **Pitch**: Vibrato for natural expression

### Recording Pipeline
1. Click **Record** → Initializes audio context
2. **4-beat Lead-in** → Metronome clicks help you sync
3. **Recording Starts** → Audio captured to WebM file
4. **Click Record again** → Saves file, logs download URL
5. **Manual download** → Access the blob URL from console

## Getting Started

### Basic Usage
1. Open `index.html` in a modern web browser
2. **Click anywhere** to initialize audio (browser requirement)
3. Press **Q** to play middle C, or use any QWERTY/ZXCV keys
4. Adjust knobs for different sounds
5. Click **Play** to start BPM-synchronized timing
6. Click **Record** for lead-in metronome + recording

### Keyboard Controls
- **QWERTY row**: C, D, E, F, G, A, B (white keys)
- **Number row**: C#, D#, F#, G#, A# (black keys)
- **ASDFGH row**: Next octave starting at C
- **Octave +/-**: Change octave up/down
- **Metronome**: Toggle click sound on/off

### Parameter Tweaking
All parameters are real-time controllable via knobs:
- **Oscillator**: Waveform selection + master volume
- **Amplitude**: Attack, Decay, Sustain, Release
- **Filter**: Cutoff, Resonance, Type (Low/High/Band)
- **Filter Env**: Envelope attack/decay/sustain/release + amount
- **LFO**: Rate, Depth, Waveform, Target
- **Distortion**: Amount, Tone
- **Unison**: Detune amount, Enable/Disable
- **Noise**: Mix level

## Browser Support

Works in all modern browsers with Web Audio API:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari 14+
- ✅ Mobile browsers (with touch knob control)

## Technical Architecture

### Core Modules

**audio-engine.js** (760+ lines)
- Web Audio API synthesis engine
- Per-note oscillators, filters, envelopes
- LFO modulation routing
- Recording via MediaRecorder
- Metronome click generation

**daw-core.js** (260+ lines)
- BPM timing and beat synchronization
- Loop management
- Recording state machine with lead-in
- Event system for transport control

**keyboard-controller.js** (291 lines)
- QWERTY/ZXCV keyboard mapping
- MIDI note conversion
- Visual key press feedback
- Octave offset management
- Auto-initializes audio on first key press

**oscilloscope.js** (121 lines)
- Canvas-based real-time visualization
- Standing wave bar display
- Waveform grid overlay
- Responsive canvas resizing

**knob.js** (115 lines)
- Interactive rotary control widget
- Mouse drag control
- Parameter range mapping
- Visual feedback during adjustment

**app.js** (391 lines)
- Main application orchestration
- UI event binding
- Parameter synchronization
- Recording indicator management

## Roadmap

### Potential Features
- Presets/Recall system
- Arpeggiator
- MIDI input support
- Delay/Reverb effects
- Multiple synth voices with independent routing
- Sample playback and manipulation
- Drum machine integration
- External instrument control via MIDI

### Performance Improvements
- Multi-threaded audio processing via Web Workers
- GPU-accelerated visualization
- Optimized parameter automation recording

## Credits

Built with Web Audio API and modern JavaScript ES6+.

🎵 A live synthesizer for modern music production in the browser.
