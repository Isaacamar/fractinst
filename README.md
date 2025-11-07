# FractInst - Fractal Synthesizer

A real-time web-based synthesizer that uses fractal mathematics to modulate and generate unique audio waveforms. Watch your sounds evolve in real-time through an integrated oscilloscope visualizer.

## Features

### Wave Types
- **Sine Wave** - Smooth, pure tone
- **Square Wave** - Rich in odd harmonics
- **Sawtooth Wave** - Bright, full spectrum
- **Triangle Wave** - Mellow harmonics

### Fractal Modulation Engine
The synth uses various fractal algorithms to continuously modulate audio parameters:

1. **Mandelbrot Set** - Smooth, evolving modulation patterns
2. **Julia Set** - Complex, swirling dynamics
3. **Lorenz Attractor** - Chaotic butterfly pattern variations
4. **Iterated Function System (IFS)** - Fractal flame-like transformations

### Real-Time Visualization
- **Oscilloscope View** - See the waveform as it's generated
- **Frequency Spectrum** - Visualize the harmonic content
- **Grid Overlay** - Reference lines for waveform analysis

### Controls
- **Frequency** - Base pitch (50-2000 Hz)
- **Amplitude** - Volume control
- **Detune** - Fine pitch adjustment in cents
- **Fractal Intensity** - How strongly fractals affect the sound
- **Fractal Speed** - Rate of fractal evolution
- **LFO (Low Frequency Oscillator)** - Additional modulation with adjustable rate and depth

## How It Works

### Fractal-Based Modulation
The fractal engine continuously generates values based on mathematical fractals. These values are mapped to:
- **Frequency Detune** - Creating evolving pitch variations
- **Amplitude Modulation** - Adding dynamic texture

This creates sounds that are never static - they continuously evolve in complex, self-similar patterns.

### Audio Pipeline
```
Fractal Engine → Modulation Signal
                         ↓
LFO → Frequency Modulation → Oscillator → Gain → Analyser → Output
                         ↑
                   Fractal Detune
```

## Usage

1. Open `index.html` in a modern web browser
2. Click **Play** to start the synthesizer (requires user interaction due to browser audio policies)
3. Experiment with different wave types and fractal settings
4. Watch the oscilloscope to see how fractals transform the waveform
5. Adjust parameters in real-time while playing

## Browser Compatibility

Works best in:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Requires Web Audio API support.

## Ideas for Expansion

1. **Additional Fractal Types**
   - Barnsley Fern
   - Sierpinski Triangle
   - Koch Curve audio mapping

2. **More Wave Manipulation**
   - Phase modulation
   - Wave folding
   - Bitcrushing effects

3. **Advanced Features**
   - Multiple oscillators with fractal phase relationships
   - Fractal-based filter sweeps
   - Preset system for fractal combinations
   - MIDI input support
   - Recording/export functionality

4. **Visual Enhancements**
   - 3D oscilloscope visualization
   - Fractal visualization alongside audio
   - Color mapping based on frequency content

## Technical Notes

- Uses Web Audio API for low-latency audio synthesis
- Fractal calculations are optimized to run at 60 FPS without blocking audio thread
- Canvas-based rendering for smooth real-time visualization
- All processing happens in-browser, no server required

Enjoy exploring the fractal soundscape! 🎵🌀

