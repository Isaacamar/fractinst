# 🎨 Visualization Modes - Live Synth DAW

## Overview

The oscilloscope now features 3 distinct real-time visualization modes that respond dynamically to the audio you're producing. Toggle between them using the buttons in the WAVEFORM module header.

---

## Mode 1: BARS (Original)

**What it shows:** Traditional oscilloscope vertical standing wave

**Visual style:**
```
        |▓|
     |▓|▓|▓|▓|
  |▓|▓|▓|▓|▓|▓|▓|
-----------+-----------
  |▓|▓|▓|▓|▓|▓|▓|
     |▓|▓|▓|▓|
        |▓|
```

**How it works:**
- Splits audio buffer into 128 frequency bands
- Each band renders as a vertical bar
- Height = amplitude of that frequency
- Centered on screen with dashed center line
- Green color (#0f0) for classic oscilloscope look

**Best for:**
- Classic frequency analysis
- Understanding waveform shape
- Seeing individual harmonics
- Technical/analytical listening

**Responsive to:**
- Higher notes = taller bars on sides
- Louder = taller bars overall
- Different waveforms = different bar patterns

---

## Mode 2: SPECTRUM (New - Radial Frequency Analyzer)

**What it shows:** Circular frequency spectrum with colors

**Visual style:**
```
        🌈
      ╭─────╮
    ╱  Rainbow  ╲
   │  frequency  │
   │  spectrum   │
   ╲  in circle  ╱
      ╰─────╯

      (Rotating!)
```

**How it works:**
- Maps 64 frequency bands to circle around center point
- Each frequency is a different angle
- Low frequencies = red, Mid = green, High = blue (rainbow spectrum)
- Amplitude controls bar length radiating outward
- Rings show amplitude scale reference
- Continuous rotation animation for visual interest
- White dot in center

**Best for:**
- Beautiful, artistic visualization
- Seeing overall frequency balance
- Explaining spectral content to others
- Visual feedback while sound designing
- Looking cool during live performance

**Responsive to:**
- Bass-heavy = longer bars on red side
- Treble-heavy = longer bars on blue side
- Balanced sound = even ring pattern
- Dynamics = breathing/pulsing effect

---

## Mode 3: PARTICLE (New - Physics-Based Audio Visualization)

**What it shows:** Audio-driven particle system with gravity

**Visual style:**
```
              ✨
           ✨   ✨
        ✨   ◉   ✨
           ✨   ✨
              ✨

(Particles burst outward, then fall!)
```

**How it works:**
- Calculates average audio amplitude each frame
- Emits proportional number of particles (more audio = more particles)
- Each particle:
  - Starts at center (white circle)
  - Moves in random direction with random speed
  - Has random color (full HSL spectrum)
  - Experiences gravity (falls downward)
  - Has air resistance (velocity *= 0.98 each frame)
  - Fades out over time (255 -> 0 alpha)
  - Dies when life reaches 0
- Quiet = few particles, Loud = many particles

**Best for:**
- Visual representation of dynamics
- Energy/intensity feedback
- Hypnotic, mesmerizing effect
- Understanding volume envelope
- Creative/experimental sessions

**Responsive to:**
- Loud peak = particle burst
- Sustained notes = continuous stream
- Quiet passages = few/no particles
- Quick transients = sharp bursts

---

## How to Use

### Switching Modes

In the **WAVEFORM** module (top-left):
```
[WAVEFORM] [BARS] [SPEC] [PART]
           ^^^^^ (active, highlighted)
```

Click any button to switch modes instantly.

### Real-time Switching

You can switch modes while playing/recording! The visualization updates immediately.

### Performance Impact

All modes are optimized:
- **BARS**: Minimal CPU (simple math)
- **SPECTRUM**: Low CPU (64 bands, some rotation math)
- **PARTICLE**: Medium CPU (particle physics, but managed pool)

Even PARTICLE mode won't impact your audio—particle updates happen in render phase only.

---

## Technical Details

### Particle System (Mode 3)

Particle properties:
```javascript
{
  x, y: position
  vx, vy: velocity
  life: 255 -> 0 (alpha)
  hue: 0-360 (HSL color)
  size: 2-5px
}
```

Physics:
- Velocity applied every frame: `x += vx`, `y += vy`
- Gravity: `vy += 0.1` (accelerates downward)
- Air resistance: `vx *= 0.98` (slows horizontal movement)
- Emission rate: `Math.floor(avgAmplitude * 20)` particles per frame

Emission is continuous while audio is loud—no discrete "explosions," just responsive flow.

### Spectrum (Mode 2)

Color mapping:
```javascript
hue = (frequencyIndex / 64) * 360
// 0Hz -> red (0°)
// 32Hz -> green (180°)
// 64Hz -> blue (360°/0°)
```

Rotation:
```javascript
angle = (sliceAngle * i) + (Date.now() * 0.0001)
```

This creates continuous smooth rotation at ~36° per second.

---

## Tips for Best Results

### BARS mode
- Zoom in on specific frequency ranges
- Watch how different waveforms look different
- Notice harmonics shimmer

### SPECTRUM mode
- Turn on metronome to see beat correlation
- Notice bass frequencies on red side
- See synthesis effects change distribution

### PARTICLE mode
- Record a drum pattern and watch particles respond
- Use with filter sweeps—particles surge as cutoff opens
- Great with distortion—see energy increase

---

## Future Enhancements

Possible additions:
- Mode 4: Waveform trace (oscilloscope XY mode)
- Mode 5: Spectrogram (frequency over time)
- Mode 6: 3D visualization (WebGL)
- Customizable colors per mode
- Particle trail effects
- Preset combinations

---

## Visual Comparison

| Mode | CPU | Beauty | Technical | Responsive |
|------|-----|--------|-----------|------------|
| BARS | 🟢 Low | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| SPECTRUM | 🟢 Low | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| PARTICLE | 🟡 Medium | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |

---

Now go make some sounds and watch them visualize in three different ways! 🎵✨
