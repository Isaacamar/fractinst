# Project State Summary

## What This Is
A low-latency browser-based synthesizer/DAW built with direct Web Audio API (no Tone.js). Features polyphonic synthesis, real-time effects, and a bar graph oscilloscope visualization.

## Current Architecture

### Core Files (Essential)
- **index.html** - Main HTML structure
- **styles.css** - All styling
- **audio-engine-v2.js** - Low-latency audio engine using direct Web Audio API
- **oscilloscope-v2.js** - Bar graph style oscilloscope (Riemann sum visualization)
- **daw-core.js** - DAW timing, transport, MIDI recording (custom transport, no Tone.js)
- **app-v2-integration.js** - Main integration layer connecting everything
- **keyboard-controller.js** - QWERTY keyboard input handling
- **keyboard-help.js** - Keyboard help modal
- **module-system.js** - Module management system
- **module-layout.js** - Module layout/grid management
- **module-ui.js** - Module UI and drag-and-drop
- **knob.js** - Rotary knob component
- **piano-roll.js** - Piano roll visualization

### Audio Engine (audio-engine-v2.js)
- **Direct Web Audio API** - No Tone.js dependency
- **Voice Management** - Object pooling with 8 voices max
- **Signal Chain**: Oscillator → Envelope → Filter → Effects → Master Gain
- **True Bypass** - Effects can be completely muted (disconnect/reconnect)
- **Effects**: Distortion, Compressor, Chorus, Delay, Reverb (all bypassable)
- **48kHz sample rate** for high quality
- **Low latency** - Interactive mode, minimal nodes

### Oscilloscope (oscilloscope-v2.js)
- **Bar Graph Style** - Riemann sum visualization with small bars
- **2D Canvas** - Simple, efficient rendering
- **Shows waveform** as vertical bars extending from center line
- **Currently**: Waveform appears too large - needs to be scaled down

### Current Issues/Todos
1. **Oscilloscope waveform is too large** - Need to reduce amplitude scaling
   - Currently using `maxAmplitude = this.height * 0.45`
   - Should reduce to maybe `0.35` or `0.3` for smaller display
   - Location: `oscilloscope-v2.js` line ~150

2. **Sound quality** - Should be clean now (fixed double filtering issue)

3. **Effect bypass** - All effects have true bypass buttons (distortion has UI button)

## How It Works

### Signal Flow
```
Voice Oscillator → Envelope → Main Filter → Effects Chain → Master Gain → Output
                                                              ↓
                                                          Analyser (for visualization)
```

### Voice Management
- Voices are pooled and reused
- Each voice: oscillator + envelope
- All voices connect to shared main filter
- No per-voice filters (prevents double filtering)

### Effects Bypass
- Each effect has parallel paths: effect path + bypass path
- Bypass controlled by gain nodes (0 = muted, 1 = active)
- When bypassed: effect path gain = 0, bypass path gain = 1
- True bypass - no signal processing when disabled

### Oscilloscope
- Reads from analyser connected to filter output
- Draws bars for each sample point
- Bars extend above/below center line based on amplitude
- Currently too large - needs amplitude reduction

## Key Features
- ✅ Low-latency audio (direct Web Audio API)
- ✅ True effect bypass
- ✅ Bar graph oscilloscope
- ✅ Polyphonic synthesis (8 voices)
- ✅ ADSR envelopes
- ✅ Filter with cutoff/resonance
- ✅ LFO modulation
- ✅ MIDI recording/playback
- ✅ Piano roll visualization

## Next Steps
1. **Reduce oscilloscope amplitude** - Make waveform smaller
2. **Test sound quality** - Verify clean audio output
3. **Test effect bypass** - Ensure all effects mute properly

## File Structure
```
FractInst/
├── index.html                    # Main HTML
├── styles.css                    # All styles
├── audio-engine-v2.js           # Audio engine
├── oscilloscope-v2.js           # Oscilloscope (bar graph)
├── daw-core.js                  # DAW timing/transport
├── app-v2-integration.js        # Main app integration
├── keyboard-controller.js       # Keyboard input
├── keyboard-help.js             # Help modal
├── module-system.js             # Module management
├── module-layout.js             # Layout system
├── module-ui.js                 # Module UI
├── knob.js                      # Knob component
├── piano-roll.js                # Piano roll
└── package.json                 # Minimal package info
```

## Technical Notes
- **No Tone.js** - Everything uses direct Web Audio API
- **Custom Transport** - Uses requestAnimationFrame for timing
- **True Bypass** - Effects use parallel signal paths
- **Voice Pooling** - Pre-allocated voices for low latency
- **48kHz Sample Rate** - High quality audio

## Quick Fix Needed
In `oscilloscope-v2.js`, reduce the amplitude scaling:
- Current: `const maxAmplitude = this.height * 0.45;`
- Change to: `const maxAmplitude = this.height * 0.3;` (or similar)

This will make the waveform bars smaller and more proportional.

