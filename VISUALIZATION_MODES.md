# 🌊 Visualization Modes - Cymatics-Inspired Geometric Patterns

## Overview

The oscilloscope features **3 mathematical visualization modes** inspired by **cymatics** (the visible sound wave phenomenon where vibrations create geometric patterns in sand, liquid, etc.).

Each mode displays different aspects of your audio using elegant, geometric patterns. All are **monochrome** (white on black) and based on **pure wave mathematics**.

**Toggle modes:** Click buttons in WAVEFORM header: **[WAVE]** **[GRID]** **[TRACE]**

---

## Mode 1: WAVE - Standing Wave Interference

**What it shows:** Resonance patterns radiating from center - like watching ripples interfere with each other

**Visual appearance:**
```
Concentric circles deform and oscillate
Radial spokes pulse outward
Creates living, breathing interference patterns
```

**How it works mathematically:**
```javascript
// Concentric circles with wave deformation
wave1 = sin(angle × 3 + time)
wave2 = sin(angle × 5 - time × 0.7)
deformation = (wave1 + wave2) × amplitude

// Radial lines oscillate at harmonic intervals
8 spokes from center
Each pulses independently
```

**What you're seeing:**
- **12 concentric rings** - represent frequency bands
- **8 radial spokes** - harmonic overtones
- **Deformation amount** - audio amplitude and harmonic content
- **Ring distortion** - how frequencies interfere constructively/destructively

**Best for:**
- Understanding harmonic resonance
- Seeing standing wave patterns
- Beautiful, meditative viewing
- Cymatics-accurate representation

**Responsive to:**
- Louder notes → rings oscillate more
- Different frequencies → different pattern shapes
- Multiple harmonics → complex interference patterns
- Filter sweeps → visible deformation changes

---

## Mode 2: GRID - Hexagonal Lattice Deformation

**What it shows:** Geometric grid that deforms based on frequency content - like a membrane responding to vibrations

**Visual appearance:**
```
Regular hexagonal pattern
Cells ripple outward from center
Opacity varies by local frequency
Creates organic, breathing lattice
```

**How it works mathematically:**
```javascript
// Hexagonal grid with two types of deformation
ripple = sin(distanceFromCenter × 0.01 - time)
resonance = sin(angle × 6 + time) × amplitude
cellOpacity = frequencyData / 256

// Each cell influenced by:
- Its distance from center
- Local frequency content
- Global amplitude
```

**What you're seeing:**
- **Hexagonal lattice** - geometric reference structure
- **Ripple waves** - propagate outward from center
- **Cell brightness** - frequency content at that position
- **Resonant deformation** - harmonic influence on geometry

**Best for:**
- Clean, geometric aesthetic
- Understanding frequency distribution
- Watching ripple propagation
- Professional-looking patterns

**Responsive to:**
- Bass → brightens bottom portion
- Treble → brightens upper portion
- Amplitude peaks → visible ripple bursts
- Smooth tones → smooth deformation

---

## Mode 3: TRACE - Oscillating Waveform Lines

**What it shows:** Waveform as flowing line with harmonic overtones overlaid

**Visual appearance:**
```
Three transparent waveform lines
Each represents harmonic (1x, 2x, 3x frequency)
Base waveform oscillates with audio
Upper harmonics fade progressively
```

**How it works mathematically:**
```javascript
// For each harmonic layer (1, 2, 3)
baseY = centerY + audioSample × height × 0.15
oscillation = sin(time × harmonic + i × 0.02) × harmonic × 15
y = baseY + oscillation

// Opacity decreases per harmonic
opacity = 1.0 / harmonic
```

**What you're seeing:**
- **3 overlapping waveforms** - fundamental + 2nd + 3rd harmonics
- **Horizontal spread** - audio buffer time domain
- **Vertical oscillation** - amplitude and harmonic modulation
- **Center baseline** - 0 amplitude reference line

**Best for:**
- Classic frequency analysis
- Understanding harmonics visually
- Seeing waveform evolution over time
- Technical/analytical listening

**Responsive to:**
- Louder notes → taller oscillations
- Richer sounds → more visible upper harmonics
- Pure sine → tight, simple wave
- Complex timbres → complex interference patterns

---

## Technical Details

### Wave Mathematics

All visualizations use **sine and cosine wave equations**:

```javascript
// Basic interference pattern
wave = sin(angle × frequency + time × speed) × amplitude

// Spatial deformation
deformed_position = position + wave_contribution

// Harmonic resonance
total = Σ(sin(angle × n × frequency) for each harmonic)
```

### Cymatics Connection

These patterns mirror real cymatics phenomena:

1. **Concentric rings** (WAVE mode)
   - Same patterns appear in sand on vibrating plates
   - Frequency determines ring spacing and density

2. **Hexagonal symmetry** (GRID mode)
   - Natural pattern that emerges from resonance
   - Six-fold symmetry common in standing waves
   - Cells brighten at resonant frequencies

3. **Harmonic layering** (TRACE mode)
   - Shows fundamental + overtones simultaneously
   - How rich tones contain multiple frequencies
   - Visual representation of timbre

### Performance

All modes are **optimized**:
- WAVE: Fast (sine waves, simple math)
- GRID: Medium (hexagon drawing, ripple propagation)
- TRACE: Fast (line drawing, harmonic overlays)

No impact on audio quality or latency.

---

## Tips for Using These Visualizations

### With WAVE mode
- Play a pure sine wave - see perfect circles
- Add a second sine wave - watch interference patterns form
- Use filter envelope - see rings grow/shrink
- Play chords - see complex harmonic resonance

### With GRID mode
- Record a drum beat - watch ripples radiate with each hit
- Sweep a filter - observe the deformation wave
- Use distortion - cells brighten unpredictably
- Play pads - smooth, flowing deformation

### With TRACE mode
- Look for the "shape" of your sound
- Simple tones = simple waveforms
- Harsh/distorted tones = complex oscillations
- Filter resonance = visible peaks in trace

### General Tips
- **Switch modes while playing** - all respond in real-time
- **Watch the bass** - usually dominates visuals
- **Notice treble response** - more subtle, higher frequency
- **Dynamics** - see how amplitude changes affect patterns

---

## Comparison

| Mode | Pattern Type | Best For | Complexity |
|------|-------------|----------|-----------|
| **WAVE** | Concentric interference | Harmonic analysis | Elegant |
| **GRID** | Hexagonal ripples | Frequency distribution | Clean |
| **TRACE** | Harmonic layering | Waveform shape | Technical |

---

## Mathematical Foundation

These visualizations aren't arbitrary - they're based on **physics**:

- **Wave interference** - same equations that describe light, sound, water waves
- **Harmonic resonance** - overtone series and Fourier analysis
- **Geometric symmetry** - natural patterns that emerge from harmonic mathematics
- **Amplitude modulation** - direct relationship between sound intensity and visual deformation

The patterns you see are **mathematical truth made visible** - a real-time window into the frequency and harmonic structure of your sound.

---

Now go create sounds and watch the geometry respond! 🌊✨
