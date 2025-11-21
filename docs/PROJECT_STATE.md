# Project State Summary

## Overview
FractInst is a low-latency browser-based synthesizer and mini-DAW. It has been refactored from vanilla JavaScript to a modern **React + Vite + TypeScript** architecture.

## Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Audio**: Direct Web Audio API (custom `AudioEngine` class, no Tone.js)
- **Visualization**: Canvas 2D for Oscilloscope
- **Styling**: CSS Modules / Global CSS

## Core Features
### 1. Synthesizer Engine
- **Polyphony**: 8-voice polyphonic synthesis
- **Signal Chain**: Oscillator -> Envelope -> Filter -> Effects -> Master
- **Effects**: Distortion, Chorus, Delay, Reverb (with True Bypass)
- **Modulation**: LFO routing to Pitch, Filter, or Amplitude

### 2. DAW Features
- **Transport**: Custom transport engine synced to AudioContext time
- **Piano Roll**: 
  - Visual MIDI sequencing
  - Drag-and-drop note editing
  - **Measure Control**: Adjustable loop length (1-999 bars) via UI controls
- **Arrangement**: Track-based arrangement view
- **Recording**: MIDI input recording (in progress)

### 3. UI Components
- **Instrument Rack**: Modular synthesizer interface
- **Oscilloscope**: Real-time waveform visualization with phase alignment
- **Virtual Keyboard**: On-screen keyboard with QWERTY support
- **Transport Bar**: BPM, Time, Play/Stop/Record, and Loop Length controls

## Recent Updates
- **React Migration**: Complete rewrite from vanilla JS to React.
- **Measure Controls**: Added dynamic loop length control in Arrangement View and Transport Bar.
- **Oscilloscope**: Enhanced Canvas-based visualization with frame averaging.

## Known Issues / Todo
- **MIDI Recording**: Core engine is implemented but UI integration needs refinement.
- **Piano Roll**: Scrubbing and complex editing features are being polished.
- **Mobile Support**: UI is optimized for desktop; mobile touch events are basic.
