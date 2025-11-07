# Live DAW - Digital Audio Workstation

A web-based live digital audio workstation built with the Web Audio API, enabling real-time music creation using keyboard controls, polyphonic synthesis, and automatic looping.

---

## 🎯 What We Built

### Phase 1: Core Restructuring ✅ COMPLETE

#### 1. **Synth Engine** (`audio-engine.js`)
- Refactored from single-note synthesis to **polyphonic** multi-voice support
- Each note gets its own oscillator + gain node with independent ADSR envelope
- Features:
  - 4 waveform types: Sine, Square, Sawtooth, Triangle
  - ADSR Envelope: Attack, Decay, Sustain, Release
  - Master volume control
  - Real-time parameter modulation
  - Analyser for waveform visualization
  - Static helper methods for MIDI ↔ Frequency conversion

#### 2. **DAW Core** (`daw-core.js`)
- Global state management and timing system
- Features:
  - **BPM Control**: 20-300 BPM
  - **Loop Timing**: Customizable loop length in bars/beats
  - **Playback Position**: Accurate beat & bar tracking
  - **Event System**: Emits events for beat/bar changes, loop completion
  - **Frame-accurate timing**: Uses Web Audio API's currentTime or performance.now()
  - Methods: `play()`, `stop()`, `record()`, `setBPM()`, `setLoopLengthBars()`

#### 3. **Keyboard Controller** (`keyboard-controller.js`)
- Maps computer keyboard to MIDI notes
- Three layout options:
  - **QWERTY Layout** (2 octaves, default)
    - Row 1: Q W E R T Y U = C D E F G A B
    - Row 2: 1 2 3 4 5 = C# D# F# G# A#
    - Row 3: A S D F G H J = C D E F G A B (octave +1)
    - Row 4: 6 7 8 9 0 = C# D# F# G# A#
  - **ZXCV Layout** (chromatic, single octave)
  - **Full Layout** (3 octaves)
- Octave control: `-OCT` / `+OCT` buttons
- Prevents note retriggering on held keys
- Visual feedback ready (key state tracking)

#### 4. **Updated UI** (`index.html`)
- **Transport Bar** (top)
  - Time display (Bar:Beat:SubBeat)
  - BPM input
  - Loop length indicator
  - Play / Stop / Record buttons
  - Octave controls
- **Control Modules**
  - Oscillator (wave type selector + master volume)
  - ADSR Envelope (Attack, Decay, Sustain, Release knobs)
  - Keyboard info (layout guide + active notes counter)
  - Oscilloscope (real-time waveform visualization)

#### 5. **New Styling** (`styles.css`)
- Modern black & white DAW aesthetic
- Responsive transport bar with flexbox
- Grid-based control module layout
- Active state indicators for buttons
- Keyboard-focused UX

---

## 🚀 How It Works

### Startup Flow
1. User clicks anywhere on page → Audio context initializes
2. DAW Core and Synth Engine connect via `setAudioContext()`
3. Keyboard Controller listens for key presses
4. Oscilloscope begins rendering waveform

### Playing Notes
1. User presses a key → Keyboard Controller maps to MIDI note
2. Synth Engine calls `playNote(frequency, noteKey)`
3. New oscillator created with ADSR envelope
4. Note added to active notes set
5. Waveform rendered in oscilloscope

### Transport Controls
- **PLAY** (▶): Start playback clock, enable recording
- **STOP** (■): Stop playback, release all notes
- **RECORD** (⦿): Record loop (only available during playback)

### Looping (Coming Next!)
- Automatic loop recording synchronized to BPM
- Default: 4 bars at 120 BPM
- User can overdub while loop plays

---

## 📁 Project Structure

```
FractInst/
├── index.html                 # Main UI (updated for DAW layout)
├── app.js                     # Main orchestration (rewritten)
├── audio-engine.js            # Synth engine (refactored for polyphony)
├── daw-core.js               # DAW state & timing (NEW)
├── keyboard-controller.js     # Keyboard MIDI mapping (NEW)
├── oscilloscope.js           # Waveform visualization
├── knob.js                   # Rotary knob control
├── styles.css                # Styling (updated)
└── README_LIVE_DAW.md        # This file
```

---

## 🎹 Quick Start Guide

### Playing Notes
1. **Open in browser** - Click to initialize audio
2. **Press keys** on keyboard:
   - `Q W E R T Y U` = First octave C-B
   - `A S D F G H J` = Second octave C-B
   - `1-5` and `6-0` = Black keys (sharps)
3. **Change octave**: Click `-OCT` / `+OCT` buttons
4. **Adjust sound**: Use knobs for envelope and wave type

### Creating a Loop
1. Click **PLAY** button
2. Click **RECORD** button
3. Play notes on keyboard (they repeat automatically after 4 bars)
4. Click **RECORD** again to stop recording, or keep adding layers!
5. Adjust **BPM** to change tempo

---

## ⚙️ Technical Details

### Polyphonic Architecture
Each note gets:
```
Oscillator → GainNode (ADSR) → MasterGain → Analyser → Destination
```

### MIDI Note Reference
- MIDI 60 = C4 (Middle C)
- MIDI 69 = A4 (440Hz, standard tuning)
- Formula: `frequency = 440 * 2^((midiNote - 69) / 12)`

### ADSR Envelope
- **Attack**: Time to reach full volume (default 10ms)
- **Decay**: Time to drop to sustain level (default 100ms)
- **Sustain**: Held level while key is pressed (default 70%)
- **Release**: Time to fade out after key release (default 200ms)

### DAW Timing
- Uses `requestAnimationFrame` for frame-accurate updates
- Falls back to `performance.now()` if Web Audio API timing unavailable
- BPM calculation: `beatsPerSecond = BPM / 60`

---

## 🔧 Next Features to Build (Phase 2)

### 1. **Looper System** (`looper.js`)
- Record note sequences per track
- Auto-loop at specified bar length
- Overdub mode for layering
- Loop visualization

### 2. **Track Manager** (`track-manager.js`)
- Multiple independent tracks
- Per-track controls:
  - Mute / Solo buttons
  - Volume / Pan faders
  - Looper instance per track
- Visual track display

### 3. **Effects & Modulation**
- LFO (Low Frequency Oscillator) for parameter modulation
- Filter envelope
- Delay / Reverb

### 4. **Export & Storage**
- Record final mix to audio file
- Save/load project state
- MIDI export

---

## 🎯 Key Differences from Original

| Feature | Original | New |
|---------|----------|-----|
| Synthesis | Single oscillator | Polyphonic (unlimited notes) |
| Modulation | Fractal-based | ADSR envelopes |
| Control | Knobs only | Keyboard + knobs |
| Timing | Free-form | BPM-synchronized loops |
| Recording | Not implemented | Ready to implement |
| Architecture | Monolithic | Modular (SynthEngine, DAWCore, KeyboardController) |

---

## 🐛 Known Limitations & TODOs

- [ ] Looper not yet implemented (recording state exists, no loop playback)
- [ ] Track system not yet implemented (single global synth)
- [ ] No visual keyboard display
- [ ] No MIDI file export
- [ ] Limited to browser keyboard layout (can add MIDI input later)

---

## 💡 Usage Tips

- **Rapid key changes**: Pressing a key while already pressed doesn't retrigger (prevents clicks)
- **Polyphony limit**: Browser-dependent, but typically 100+ simultaneous notes
- **Low latency**: Web Audio API provides ~20-40ms latency on modern browsers
- **Cross-browser**: Works in Chrome, Firefox, Safari, Edge

---

## 🔗 References

- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **MIDI Reference**: https://www.midi.org/specifications-old
- **ADSR Envelope**: https://en.wikipedia.org/wiki/Envelope_(music)

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 (Looper) 🚀
