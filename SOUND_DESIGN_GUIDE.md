# Live DAW - Sound Design Guide

Complete reference for creating sounds with the Live DAW sound design modules.

---

## 🎛️ Module Overview

### 1. **OSCILLATOR**
- **Wave Types**: SINE, SQUARE, SAWTOOTH, TRIANGLE
- **Volume**: Master output level (0-100%)

**Sound Character**:
- **SINE**: Pure, warm, smooth (good for pads, bass)
- **SQUARE**: Bright, hollow, retro (classic synth lead)
- **SAWTOOTH**: Bright, buzzy, rich (thick bass, leads)
- **TRIANGLE**: Warm, mellowish (between sine and square)

---

### 2. **AMP ENVELOPE** (Amplitude ADSR)
Controls how the note's volume evolves over time.

**Parameters**:
- **ATK (Attack)**: 0-500ms - Time to reach full volume
- **DEC (Decay)**: 0-500ms - Time to drop to sustain level
- **SUS (Sustain)**: 0-100% - Held level while key pressed
- **REL (Release)**: 0-1000ms - Time to fade out after key release

**Sound Examples**:
```
FAST ATTACK + SHORT DECAY + LOW SUSTAIN + LONG RELEASE = "Pluck"
  /|\
 / | \
/___|__\___

SLOW ATTACK + MEDIUM DECAY + MEDIUM SUSTAIN + MEDIUM RELEASE = "Pad"
    ___
   /   \
  /     \
_/       \__

FAST ATTACK + NO DECAY + HIGH SUSTAIN + SHORT RELEASE = "Lead"
__________
|          \___
```

---

### 3. **FILTER** (Biquad Lowpass/Highpass/Bandpass)
Removes frequencies based on cutoff point. **This is the most powerful module!**

**Parameters**:
- **CUT (Cutoff)**: 20-20000 Hz - Frequency point where filter cuts
- **RES (Resonance/Q)**: 0.1-20 - Peak emphasis at cutoff (creates "character")
- **Type**: LP (Lowpass), HP (Highpass), BP (Bandpass)

**Filter Types**:
- **Lowpass (LP)**: Keep low frequencies, remove high frequencies
  - Use for: Dark sounds, bass, smooth pads, filtering noise
- **Highpass (HP)**: Keep high frequencies, remove low frequencies
  - Use for: Thin sounds, leads, removing rumble
- **Bandpass (BP)**: Keep middle frequencies, remove both extremes
  - Use for: Phone-like sounds, synth textures

**Cutoff Guidelines**:
- **20-1000 Hz**: Very dark, muffled, bass-focused
- **1000-5000 Hz**: Mid-range, balanced
- **5000-20000 Hz**: Bright, cutting, aggressive

**Resonance Guidelines**:
- **0.1-1.0**: Smooth, natural (recommended for most sounds)
- **1.0-5.0**: Noticeable peak, character starts to show
- **5.0-20.0**: Extreme peak, self-oscillates (creates whistles, screams)

---

### 4. **FILTER ENV** (Filter Envelope Modulation)
Makes the filter cutoff move over time - creates dynamic filter sweeps!

**Parameters**:
- **ATK**: 0-500ms - Time for envelope to peak
- **DEC**: 0-500ms - Time to drop to sustain
- **AMT**: 0-10000 Hz - How much envelope modulates cutoff

**Magic Happens Here**: This creates the "classic synth sound"
- High ATK + High AMT = Filter sweeps open (bass stab, pluck)
- Short ATK + High DEC = Quick "chirp" effect
- Zero AMT = No filter modulation (static filter cutoff)

**Classic Sounds with Filter Envelope**:
```
BASS: Sawtooth + LP Filter + High Filter Env Amount + Long Attack
  = Filter sweeps from closed to open = DEEP BASS

PLUCK: Sawtooth + LP Filter + Fast Attack + Short Decay + High Amount
  = "Tick" sound from filter

PAD: Sine + LP Filter + Slow Attack + Slow Decay + Medium Amount
  = Smooth evolving pad
```

---

### 5. **LFO** (Low Frequency Oscillator)
Periodically modulates a target parameter at a slow frequency.

**Parameters**:
- **RATE**: 0.1-20 Hz - Speed of modulation (cycles per second)
- **DEPTH**: 0-100% - How much it modulates target
- **WAVEFORM**: SIN, TRI, SQR, SAW - Shape of modulation

**Target Options**:
- **CUTOFF**: Modulates filter cutoff (classic wobble/wah)
- **AMP**: Modulates volume (tremolo effect)
- **PITCH**: Modulates note frequency (vibrato effect)

**LFO Guidelines**:
- **0.1-1 Hz**: Very slow, atmospheric, swelling
- **1-5 Hz**: Medium, natural vibrato/tremolo
- **5-15 Hz**: Fast, wobbling, syncopated effect
- **15+ Hz**: Very fast, creates distortion/roughness

**Example Sounds**:
```
WOBBLE BASS: Sawtooth → Filter → LFO on CUTOFF at 2Hz = Classic wobble bass

TREMOLO PAD: Sine → AMP ENVELOPE → LFO on AMP at 4Hz = Pulsing pad

VIBRATO LEAD: Sawtooth → LFO on PITCH at 5Hz = Vocal-like vibrato
```

---

### 6. **UNISON & FX**

#### **UNISON Mode** (Enable/Disable)
Plays 2 copies of the oscillator, each slightly detuned = **THICK SOUND**

**Parameters**:
- **Toggle**: ON/OFF
- **DTUNE (Detune)**: 0-100 cents - How far apart the copies are
  - 0 cents = perfectly in tune (thin)
  - 5-15 cents = sweet spot (thick, lush)
  - 50+ cents = very separated (chorus-like)

**When to Use Unison**:
- Making thin oscillators (sine) sound huge
- Creating "Massive-like" supersaw sounds
- Adding width and richness to any tone

#### **NOISE Amount** (0-100%)
Blends white noise with the oscillators.

**Uses**:
- 0-30%: Add sparkle/air to pads
- 30-70%: Create texture, wind sounds
- 70-100%: Mostly noise (hi-hats, snare-like)

#### **DISTORTION** (Drive 0-100%)
Adds harmonics and aggression through soft clipping.

**Uses**:
- 0-20%: Warmth and character (slight grit)
- 20-50%: Noticeable drive, aggressive
- 50-100%: Heavy distortion, synth growl

---

## 🎹 Sound Design Recipes

### **WARM PAD**
```
Wave: SINE
Volume: 50%
AMP ADSR: A=100ms, D=300ms, S=70%, R=500ms
Filter: LP at 3000Hz, Resonance 2.0
Filter Env: A=100ms, D=400ms, Amount=2000Hz
LFO: 1Hz sine on CUTOFF, 30% depth
Unison: ON, 8 cents detune
Noise: 5%
Distortion: 5%
```

### **BASS STAB**
```
Wave: SAWTOOTH
Volume: 60%
AMP ADSR: A=10ms, D=200ms, S=80%, R=100ms
Filter: LP at 2000Hz, Resonance 1.2
Filter Env: A=50ms, D=300ms, Amount=5000Hz
LFO: OFF
Unison: ON, 5 cents
Noise: 0%
Distortion: 10%
```

### **WOBBLE BASS (Dubstep)** ⚠️ LOUD
```
Wave: SAWTOOTH
Volume: 40%
AMP ADSR: A=5ms, D=100ms, S=90%, R=50ms
Filter: LP at 800Hz, Resonance 3.0
Filter Env: A=30ms, D=100ms, Amount=3000Hz
LFO: 2Hz sine on CUTOFF, 70% depth (THIS IS THE WOBBLE!)
Unison: ON, 10 cents
Noise: 0%
Distortion: 20%
```

### **PLUCK/BELL**
```
Wave: TRIANGLE
Volume: 50%
AMP ADSR: A=5ms, D=200ms, S=0%, R=400ms (key is fast decay + long release)
Filter: LP at 6000Hz, Resonance 2.0
Filter Env: A=20ms, D=150ms, Amount=4000Hz
LFO: OFF
Unison: OFF
Noise: 2%
Distortion: 0%
```

### **LEAD/BRASS**
```
Wave: SAWTOOTH
Volume: 50%
AMP ADSR: A=50ms, D=100ms, S=80%, R=200ms
Filter: LP at 5000Hz, Resonance 1.5
Filter Env: A=30ms, D=200ms, Amount=2000Hz
LFO: 5Hz sine on PITCH, 30% depth (VIBRATO)
Unison: ON, 12 cents
Noise: 0%
Distortion: 15%
```

### **ETHEREAL/AMBIENT**
```
Wave: SINE
Volume: 40%
AMP ADSR: A=500ms, D=1000ms, S=30%, R=1000ms
Filter: LP at 2000Hz, Resonance 1.0
Filter Env: A=200ms, D=800ms, Amount=1000Hz
LFO: 0.3Hz sine on CUTOFF, 50% depth (VERY SLOW)
Unison: ON, 20 cents (very detuned)
Noise: 10%
Distortion: 2%
```

---

## 🎯 Quick Tweaks for Common Sounds

### "Make it sound fatter"
→ Enable UNISON, increase detune to 8-12 cents

### "Make it sound brighter"
→ Increase filter CUTOFF or add RESONANCE

### "Make it sound darker"
→ Decrease filter CUTOFF or increase DISTORTION slightly

### "Make it sound more alive"
→ Increase LFO DEPTH or add vibrato (LFO on PITCH)

### "Make it more aggressive"
→ Increase DISTORTION, reduce filter CUTOFF, increase RESONANCE

### "Make it sound like a pluck"
→ Set AMP Decay FAST, Filter Env AMOUNT HIGH, Sustain LOW

### "Make it sound like a pad"
→ Set AMP Attack SLOW, Sustain HIGH, LFO on CUTOFF with LOW RATE (0.5-1Hz)

---

## 📊 Module Signal Flow

```
┌─────────────────────────────────────────────────────────┐
│  3 OSCILLATORS (with UNISON on/off)                     │
│  + NOISE GENERATOR                                      │
└────────────────┬────────────────────────────────────────┘
                 │
            MIXER
                 │
        ┌────────▼────────┐
        │ DISTORTION      │
        │ (optional)      │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │ FILTER (Lowpass/High/Band) │
        └────────┬────────────────────┘
                 │
    ┌────────────┼────────────────┐
    │            │                │
    │    FILTER ENV GAIN      AMPLITUDE GAIN
    │            │                │
    │    ┌───────▼────────┐  ┌────▼──────────┐
    │    │ Modulates      │  │ ADSR ENVELOPE │
    │    │ Cutoff Freq    │  │ (Amplitude)   │
    │    └────────────────┘  └────┬──────────┘
    │                             │
    └─────────────────────────────┼─────────┐
                                  │         │
                          MASTER GAIN      LFO
                                  │         │
                                  └────┬────┘
                                       │
                              Master Output
```

---

## 🔧 Troubleshooting

**Sound is too quiet**
→ Increase VOLUME knob, check AMP Sustain level, check master volume

**Sound is too bright/harsh**
→ Lower filter CUTOFF, add DISTORTION (sounds paradoxical but works!), reduce RESONANCE

**Sound is clicking/popping**
→ Increase AMP ATTACK time, reduce DISTORTION amount

**Filter envelope isn't working**
→ Increase FILTER ENV AMOUNT knob, ensure Filter Env ATK is visible

**LFO isn't working**
→ Increase LFO DEPTH, check that a TARGET is selected (CUTOFF/AMP/PITCH)

**Notes sound shaky/wonky**
→ Reduce UNISON DETUNE, enable UNISON properly

---

## 🎓 Sound Design Philosophy

1. **Start Simple**: Use SINE wave, no unison, no effects
2. **Add Character**: Change wave type, add distortion
3. **Add Movement**: Enable LFO on cutoff for wobble
4. **Add Thickness**: Enable unison mode
5. **Add Texture**: Mix in noise, fine-tune envelope
6. **Polish**: Adjust all knobs until you like it!

**Remember**: There are no "wrong" settings - if it sounds good, it IS good! 🎵

---

**Happy Sound Design! 🔊**
