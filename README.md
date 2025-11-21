# FractInst - Browser-Based Synth & DAW

A low-latency browser-based synthesizer and mini-DAW built with **React**, **TypeScript**, and **Web Audio API**.

## [Link!]([URL](https://isaacamar.github.io/fractinst/))


## Features

- **Polyphonic Synthesis**: 8-voice polyphony with multiple waveforms (Sine, Square, Saw, Triangle)
- **Modular Design**: Configurable synth modules (Oscillators, Envelopes, Filters, LFOs)
- **Real-time Effects**: Distortion, Chorus, Delay, Reverb with true bypass
- **DAW Capabilities**: 
  - Transport controls (Play/Stop/Record, BPM, Loop)
  - Piano Roll sequencer with drag-and-drop editing
  - Arrangement View with track management
  - **Dynamic Loop Length**: Add/subtract measures on the fly
- **Visualization**: Real-time phase-aligned oscilloscope
- **Input**: QWERTY keyboard support with octave switching

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Web Audio API** - Direct audio processing (no external audio libraries)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Status

Refactor from vanilla JS to React is **Complete**.
See [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) for detailed architecture and status.

## License

ISC
