# Live DAW - Quick Reference Card

## Keyboard Layout
```
QWERTY:       1 2 3 4 5
Q W E R T Y U  (C D E F G A B + sharps)
A S D F G H J  (C D E F G A B octave +1)
6 7 8 9 0     (+ sharps octave +1)

Use -OCT / +OCT buttons to change octave
```

## Module Parameters at a Glance

| Module | Parameter | Range | Default | Effect |
|--------|-----------|-------|---------|--------|
| **OSCILLATOR** | VOL | 0-100% | 50% | Master volume |
| | Wave | SINE/SQR/SAW/TRI | SINE | Tone character |
| **AMP ENV** | ATK | 0-500ms | 10ms | Attack time |
| | DEC | 0-500ms | 100ms | Decay time |
| | SUS | 0-100% | 70% | Sustain level |
| | REL | 0-1000ms | 200ms | Release time |
| **FILTER** | CUT | 20-20kHz | 5kHz | Cutoff frequency |
| | RES | 0.1-20 | 1.0 | Resonance/peak |
| | Type | LP/HP/BP | LP | Filter type |
| **FILTER ENV** | ATK | 0-500ms | 50ms | Envelope attack |
| | DEC | 0-500ms | 200ms | Envelope decay |
| | AMT | 0-10kHz | 3kHz | Modulation depth |
| **LFO** | RATE | 0.1-20Hz | 2Hz | Speed |
| | DEPTH | 0-100% | 20% | Modulation amount |
| | WAVE | SIN/TRI/SQR/SAW | SIN | LFO waveform |
| | TARGET | CUT/AMP/PITCH | CUT | Modulation target |
| **UNISON** | MODE | ON/OFF | OFF | Dual voice |
| | DTUNE | 0-100c | 5c | Detune amount |
| **FX** | NOISE | 0-100% | 0% | Noise mix |
| | DIST | 0-100% | 0% | Distortion drive |

---

## Quick Sound Recipes

### Warm Pad
- Wave: SINE, Vol: 50%
- Env: ATK=100ms, DEC=300ms, SUS=70%, REL=500ms
- Filter: 3kHz LP, RES=2.0
- Filter Env: AMT=2kHz
- LFO: 1Hz on CUTOFF 30%
- Unison: ON 8c
- Noise: 5%, Dist: 5%

### Bass Stab
- Wave: SAW, Vol: 60%
- Env: ATK=10ms, DEC=200ms, SUS=80%, REL=100ms
- Filter: 2kHz LP, RES=1.2
- Filter Env: ATK=50ms, AMT=5kHz
- Unison: ON 5c
- Noise: 0%, Dist: 10%

### Wobble Bass
- Wave: SAW, Vol: 40%
- Env: ATK=5ms, DEC=100ms, SUS=90%, REL=50ms
- Filter: 800Hz LP, RES=3.0
- Filter Env: ATK=30ms, AMT=3kHz
- **LFO: 2Hz on CUTOFF 70%** ← KEY SETTING
- Unison: ON 10c
- Noise: 0%, Dist: 20%

### Pluck/Bell
- Wave: TRI, Vol: 50%
- Env: ATK=5ms, DEC=200ms, SUS=0%, REL=400ms
- Filter: 6kHz LP, RES=2.0
- Filter Env: ATK=20ms, AMT=4kHz
- Unison: OFF
- Noise: 2%, Dist: 0%

### Lead
- Wave: SAW, Vol: 50%
- Env: ATK=50ms, DEC=100ms, SUS=80%, REL=200ms
- Filter: 5kHz LP, RES=1.5
- Filter Env: ATK=30ms, AMT=2kHz
- **LFO: 5Hz on PITCH 30%** ← Vibrato
- Unison: ON 12c
- Noise: 0%, Dist: 15%

### Ambient/Ethereal
- Wave: SINE, Vol: 40%
- Env: ATK=500ms, DEC=1000ms, SUS=30%, REL=1000ms
- Filter: 2kHz LP, RES=1.0
- Filter Env: ATK=200ms, AMT=1kHz
- **LFO: 0.3Hz on CUTOFF 50%** ← Very slow
- Unison: ON 20c (heavy detune)
- Noise: 10%, Dist: 2%

---

## One-Knob Tweaks

| Want To... | Adjust |
|-----------|--------|
| Make fatter | Unison DTUNE ↑ |
| Make brighter | Filter CUT ↑ |
| Make darker | Filter CUT ↓ |
| Add movement | LFO DEPTH ↑ |
| More aggressive | DIST ↑ |
| More smooth | Filter RES ↓ |
| Classic wobble | LFO on CUT, RATE 2Hz |
| Vocal vibrato | LFO on PITCH, RATE 5Hz |

---

## Transport Controls

- **PLAY (▶)**: Start playback & enable recording
- **STOP (■)**: Stop everything, release all notes
- **RECORD (⦿)**: Record loop (only during playback)
- **BPM**: 20-300 beats per minute
- **-OCT / +OCT**: Change keyboard octave
- **TIME**: Bar:Beat:Fraction display
- **LOOP**: Bar indicator (e.g., "4/4")

---

## Tips & Tricks

✓ **Filter + Filter Env = MAGIC** - This is where 80% of great synth sounds come from

✓ **Unison + Detune = WIDTH** - Makes thin oscillators sound professional

✓ **LFO on Cutoff = WOBBLE** - Classic dance/bass sound

✓ **High Resonance = CHARACTER** - Use carefully at high values!

✓ **Start with SINE** - Easier to hear changes, then switch wave types

✓ **Filter Env Amount** - Don't leave this at 0! Gives sounds life

✓ **Slow LFO RATE** - Under 1Hz is very atmospheric

✓ **Release Time Matters** - High value = pad/sustain, Low value = stab/pluck

---

## Audio Routing

```
[Oscillators + Noise] → [Mixer] → [Distortion]
→ [Filter] → [Amp Envelope] → [Master]
                    ↑
           [Filter Envelope Modulates Cutoff]

              [Global LFO]
              ├→ Filter Cutoff (Wobble)
              ├→ Amplitude (Tremolo)
              └→ Pitch (Vibrato)
```

---

**Made with ❤️ for sound designers everywhere** 🎛️🎵
