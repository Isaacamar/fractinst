# FractInst Architecture Explained

This document explains how the entire system works - from oscillators to oscilloscopes, from MIDI recording to playback.

## Table of Contents
1. [High-Level Overview](#high-level-overview)
2. [Audio Engine (audio-engine-v2.js)](#audio-engine)
3. [Transport System (transport.js)](#transport-system)
4. [MIDI Recording (midi-recorder.js)](#midi-recording)
5. [Playback Scheduler (playback-scheduler.js)](#playback-scheduler)
6. [Oscilloscope (oscilloscope-v2.js)](#oscilloscope)
7. [Piano Roll (piano-roll.js)](#piano-roll)
8. [Integration Layer (app-v2-integration.js)](#integration-layer)
9. [How It All Works Together](#how-it-all-works-together)

---

## High-Level Overview

FractInst is a browser-based synthesizer and mini-DAW built with **direct Web Audio API** (no Tone.js). The architecture follows these principles:

1. **Single Source of Truth for Time**: `audioContext.currentTime` is the master clock
2. **Modular Design**: Separate classes for transport, recording, playback, visualization
3. **Low Latency**: Direct Web Audio API with minimal nodes
4. **True Bypass Effects**: Effects can be completely disconnected when bypassed
5. **Voice Pooling**: Efficient polyphonic synthesis with object pooling

---

## Audio Engine (audio-engine-v2.js)

### What It Does
The audio engine generates sound using oscillators, applies filters and effects, and manages multiple simultaneous notes (polyphony).

### Key Components

#### 1. **Audio Context**
```javascript
this.context = new AudioContext({ sampleRate: 44100 });
```
- The Web Audio API's main interface
- Sample rate: 44.1kHz (CD quality)
- Provides `currentTime` - the master clock for all timing

#### 2. **Voice Management**
- **Voice Pool**: Array of reusable voice objects (max 8 voices)
- **Active Voices**: Map of `noteKey -> Voice` for currently playing notes
- **Object Pooling**: Reuses voice objects instead of creating/destroying them

**How a Voice Works:**
```javascript
Voice {
    oscillator: OscillatorNode,  // Generates the waveform (sine, sawtooth, etc.)
    envelope: GainNode,           // ADSR envelope for volume shaping
    filter: BiquadFilterNode,     // Low-pass filter
    noteKey: string               // Unique identifier for this note
}
```

**Signal Flow Through a Voice:**
```
Oscillator → Envelope → Filter → Effects Chain → Master Gain → Speakers
```

#### 3. **Oscillators**
- Generate waveforms: sine, square, sawtooth, triangle
- Frequency calculated from MIDI note: `440 * 2^((midiNote - 69) / 12)`
- Each voice has its own oscillator

#### 4. **ADSR Envelope**
Controls how a note's volume changes over time:
- **Attack**: How quickly the note reaches full volume (0.01s = instant)
- **Decay**: How quickly it drops to sustain level (0.1s)
- **Sustain**: The held volume level (0.7 = 70%)
- **Release**: How quickly it fades out when released (0.2s)

#### 5. **Filter**
- **Low-pass filter**: Removes high frequencies (makes sound darker/warmer)
- **Cutoff**: Frequency above which sounds are filtered (12000 Hz default)
- **Resonance**: Emphasis around the cutoff frequency (1.5 default)

#### 6. **Effects Chain (True Bypass)**
Effects are connected in series, but each can be bypassed:

```
Filter → [Distortion] → [Compressor] → [Chorus] → [Delay] → [Reverb] → Master Gain
```

**True Bypass Architecture:**
- Each effect has TWO paths: effect path and bypass path
- A mixer combines both paths
- When bypassed: effect gain = 0, bypass gain = 1
- When active: effect gain = 1, bypass gain = 0
- This allows effects to be completely disconnected when not needed

**Effects Explained:**
- **Distortion**: Waveshaping curve that adds harmonics (saturation)
- **Compressor**: Reduces dynamic range (makes quiet parts louder)
- **Chorus**: Duplicates signal with slight delay/detune (thickens sound)
- **Delay**: Echo effect with feedback loop
- **Reverb**: Convolution reverb using impulse response (simulates room acoustics)

#### 7. **LFO (Low-Frequency Oscillator)**
- Slow oscillator (0.1-10 Hz) that modulates other parameters
- Can modulate: filter cutoff, oscillator frequency, etc.
- Creates vibrato, wah-wah effects

### How Notes Are Played

1. **`playNote(frequency, noteKey, velocity)`**:
   - Gets a voice from the pool (or creates one)
   - Sets oscillator frequency
   - Applies velocity (volume) via envelope
   - Connects voice to effects chain
   - Stores in `activeVoices` map

2. **`releaseNote(noteKey)`**:
   - Finds voice in `activeVoices`
   - Triggers release phase of envelope
   - After release completes, returns voice to pool

---

## Transport System (transport.js)

### What It Does
The transport is the **master clock** for the entire DAW. It tracks playback position, BPM, and provides timing for recording and playback.

### Key Concepts

#### 1. **Time Reference**
- Uses `audioContext.currentTime` as the absolute time reference
- Converts between **seconds** (for audio) and **beats** (for display)
- Formula: `beats = (seconds * bpm) / 60`

#### 2. **Position Tracking**
```javascript
position = positionAtStart + (currentTime - startTime)
```
- `positionAtStart`: Position when playback started
- `startTime`: `audioContext.currentTime` when playback started
- `currentTime`: Current `audioContext.currentTime`
- This allows seeking while playing

#### 3. **Looping**
- Default loop: 4 bars (16 beats at 4/4 time)
- When position reaches `loopEnd`, wraps to `loopStart`
- Prevents drift by recalculating `startTime` on loop

#### 4. **Update Loop**
- Uses `requestAnimationFrame` (~60fps) to update UI
- Calls registered callbacks with current time
- Piano roll playhead, oscilloscope, etc. use these callbacks

### Methods

- **`play()`**: Starts playback, sets `isPlaying = true`
- **`stop()`**: Stops playback, saves current position
- **`seek(timeSeconds)`**: Jumps to a specific time
- **`getCurrentTime()`**: Returns current position in seconds
- **`getCurrentBeat()`**: Returns current position in beats
- **`setBpm(bpm)`**: Changes tempo (recalculates loop boundaries)
- **`onUpdate(callback)`**: Register callback for UI updates

---

## MIDI Recording (midi-recorder.js)

### What It Does
Records MIDI note-on and note-off events with precise timestamps relative to the transport.

### Data Structures

#### **RecordedMidiEvent**
```javascript
{
    type: 'noteOn' | 'noteOff',
    channel: 0,
    time: 1.5,              // Time in seconds relative to clip start
    note: 60,                // MIDI note number (C4 = 60)
    velocity: 100,           // 0-127
    frequency: 261.63,       // Calculated frequency
    noteKey: 'qwerty-A'      // Unique key identifier
}
```

#### **MidiClip**
```javascript
{
    id: 'clip-1234567890',
    startTime: 0.0,          // Transport time when recording started
    length: 4.0,             // Duration in seconds
    events: [RecordedMidiEvent, ...]
}
```

#### **MidiTrack**
```javascript
{
    id: 'track-1',
    name: 'Track 1',
    clips: [MidiClip, ...]
}
```

### Recording Process

1. **`startRecording()`**:
   - Sets `isRecording = true`
   - Records `recordingStartTime` from transport
   - Creates new `MidiClip` with empty events array

2. **`recordNoteOn(noteData)`**:
   - Calculates relative time: `now - recordingStartTime`
   - Creates note-on event with timestamp
   - Stores in `pendingNotes` map (waiting for note-off)

3. **`recordNoteOff(noteKey)`**:
   - Finds pending note-on
   - Creates note-off event
   - Removes from `pendingNotes`

4. **`stopRecording()`**:
   - Closes any pending notes
   - Calculates clip length
   - Adds clip to track
   - Returns finalized clip

---

## Playback Scheduler (playback-scheduler.js)

### What It Does
Schedules MIDI events from recorded clips for playback using precise Web Audio timing.

### How It Works

#### 1. **Lookahead Scheduling**
- Schedules events slightly in the future (25ms ahead)
- Prevents audio glitches from late scheduling
- Runs every 25ms to keep buffer filled

#### 2. **Event Scheduling**
```javascript
const scheduleTime = audioContext.currentTime + lookaheadTime;
synthEngine.playNote(frequency, noteKey, velocity);
```

#### 3. **Loop Handling**
- Normalizes event times to loop boundaries
- If event time > loop end, wraps to loop start
- Ensures events repeat correctly when looping

#### 4. **Preventing Double-Triggering**
- Tracks scheduled events in a Set
- Only schedules events once per loop cycle
- Clears Set when loop restarts

### Process

1. **`start()`**: Begins lookahead scheduling loop
2. **`scheduleEvents()`**: 
   - Gets clips from MIDI recorder
   - Calculates which events should play in next 25ms
   - Schedules note-on/note-off events
3. **`stop()`**: Stops scheduling loop

---

## Oscilloscope (oscilloscope-v2.js)

### What It Does
Visualizes the audio waveform in real-time using a bar graph style (Riemann sum visualization).

### How It Works

#### 1. **Audio Analysis**
- Uses `AnalyserNode` from Web Audio API
- Gets frequency domain data (FFT) or time domain data
- Updates at ~60fps via `requestAnimationFrame`

#### 2. **Data Processing**
- **Smoothing**: Averages adjacent samples to reduce noise
- **Phase Alignment**: Rotates buffer to start at zero crossing (makes waveform stable)
- **Frame Averaging**: Averages multiple frames for stability (16 frames)
- **Period Detection**: Finds waveform period to display exactly 2 periods

#### 3. **Rendering**
- **Bar Graph Style**: Each sample becomes a vertical bar
- **Riemann Sum**: Bars extend from center line (positive/negative)
- **Smooth Curves**: Uses quadratic curves to connect bars
- **Gradient Fill**: Subtle gradient for visual appeal

#### 4. **Display Logic**
```javascript
// Normalize sample to -1 to 1
const normalized = (sample / 128.0) - 1.0;

// Convert to screen coordinates
const y = centerY - (normalized * maxAmplitude);
const x = (sampleIndex / totalSamples) * canvasWidth;

// Draw bar or curve
```

### Visual Features
- Dark background (#0a0a0a)
- Subtle grid lines
- Center line (zero crossing)
- Smooth waveform curve with gradient fill
- Shows exactly 2 periods of the waveform

---

## Piano Roll (piano-roll.js)

### What It Does
Visualizes and edits MIDI notes on a grid representing time (horizontal) and pitch (vertical).

### Layout

#### **Left Sidebar: Piano Keys**
- Shows MIDI note names (C, C#, D, etc.)
- Clickable to preview notes
- Scrollable to show full range

#### **Right Side: Grid**
- **Horizontal**: Time (beats/bars)
- **Vertical**: MIDI notes (pitch)
- **Grid Lines**: Beat divisions (1/64th note resolution)
- **Playhead**: Red line showing current playback position

### Rendering

#### 1. **Grid Creation**
- Creates rows for each MIDI note (C0 to C8)
- Creates cells for each beat
- Subdivides beats into 1/64th note grid lines

#### 2. **Note Display**
- Each recorded note becomes a rectangle
- **X Position**: `(note.time - clip.startTime) * pixelsPerSecond`
- **Y Position**: Row corresponding to MIDI note
- **Width**: `note.duration * pixelsPerSecond`
- **Color**: Varies by note (hue based on MIDI note)

#### 3. **Playhead**
- Updates via `transport.onUpdate()` callback
- Position: `transport.getCurrentTime() * pixelsPerSecond`
- Smoothly animates at 60fps

### Editing Features

#### **Note Dragging**
- Click and drag notes horizontally (change time)
- Drag vertically (change pitch)
- **Quantization**: Snaps to 1/64th note grid when enabled
- Updates MIDI clip data in real-time

#### **Scrubbing**
- Click on grid to seek transport
- Playhead jumps to clicked position
- Can drag playhead for scrubbing

### Real-Time Updates
- During recording: Notes appear as they're played
- Uses `requestAnimationFrame` to continuously update display
- Shows current recording clip in real-time

---

## Integration Layer (app-v2-integration.js)

### What It Does
Wires everything together - handles UI events, initializes components, synchronizes state.

### Initialization Flow

1. **Create Instances**:
   ```javascript
   synthEngine = new LowLatencySynthEngine();
   dawCore = new DAWCore();
   keyboardController = new KeyboardController(synthEngine);
   midiDeviceHandler = new MidiDeviceHandler(synthEngine, dawCore);
   ```

2. **Lazy Audio Initialization**:
   - Waits for user interaction (click)
   - Initializes audio context (browser security requirement)
   - Sets up DAW core with audio context

3. **Connect Components**:
   - Keyboard controller → DAW core (for recording)
   - MIDI device handler → DAW core (for recording)
   - DAW core → Piano roll (for display)
   - Transport → Piano roll (for playhead)

### Event Flow

#### **Recording Flow**:
1. User clicks Record button
2. `dawCore.record()` called
3. Transport starts playing (auto-play)
4. Lead-in metronome plays for 4 beats
5. `midiRecorder.startRecording()` called
6. User plays notes → `keyboardController` → `dawCore.recordMidiNote()`
7. Notes recorded with timestamps
8. Piano roll updates in real-time
9. User clicks Stop → `midiRecorder.stopRecording()`
10. Clip finalized and added to track

#### **Playback Flow**:
1. User clicks Play button
2. `dawCore.play()` called
3. Transport starts
4. `playbackScheduler.start()` called
5. Scheduler reads clips from `midiRecorder`
6. Schedules note-on/note-off events
7. `synthEngine` plays notes
8. Piano roll playhead moves
9. Oscilloscope visualizes audio

---

## How It All Works Together

### Example: Recording and Playing Back a Note

1. **User presses Record**:
   - Transport starts at position 0
   - Lead-in metronome plays (4 beats)
   - Recording starts at beat 4

2. **User presses 'A' key** (at beat 5):
   - `keyboardController` detects keypress
   - Calls `synthEngine.playNote(440, 'qwerty-A', 1.0)`
   - Sound plays immediately
   - Calls `dawCore.recordMidiNote({ note: 69, time: 1.0 })`
   - `midiRecorder` records note-on event at time 1.0 seconds
   - Piano roll shows note appearing in real-time

3. **User releases 'A' key** (at beat 6):
   - `keyboardController` calls `synthEngine.releaseNote('qwerty-A')`
   - Sound fades out (release envelope)
   - Calls `dawCore.recordMidiNoteRelease('qwerty-A')`
   - `midiRecorder` records note-off event at time 2.0 seconds

4. **User stops recording**:
   - Clip finalized: `{ startTime: 0, length: 4.0, events: [...] }`
   - Clip added to track

5. **User presses Play**:
   - Transport starts
   - `playbackScheduler` reads clip
   - At time 1.0: schedules note-on → `synthEngine.playNote(440, ...)`
   - At time 2.0: schedules note-off → `synthEngine.releaseNote(...)`
   - Piano roll playhead moves
   - Oscilloscope visualizes waveform

### Timing Synchronization

All timing uses `audioContext.currentTime`:
- **Transport**: Tracks position using `currentTime`
- **Recording**: Records events with `transport.getCurrentTime()`
- **Playback**: Schedules events using `currentTime + lookahead`
- **UI Updates**: `requestAnimationFrame` reads transport time

This ensures everything stays in sync!

---

## Key Design Decisions

1. **No Tone.js**: Direct Web Audio API for lower latency and more control
2. **Voice Pooling**: Efficient polyphony without garbage collection issues
3. **True Bypass**: Effects completely disconnected when bypassed (no CPU waste)
4. **Single Clock**: `audioContext.currentTime` is the only time reference
5. **Modular Architecture**: Each component has a single responsibility
6. **Event-Driven**: Components communicate via events/callbacks

---

## File Structure Summary

- **audio-engine-v2.js**: Sound generation, effects, voice management
- **transport.js**: Master clock, playback position, BPM
- **midi-recorder.js**: Records MIDI events with timestamps
- **playback-scheduler.js**: Schedules recorded events for playback
- **oscilloscope-v2.js**: Visualizes audio waveform
- **piano-roll.js**: MIDI note visualization and editing
- **daw-core.js**: Orchestrates transport, recording, playback
- **app-v2-integration.js**: Wires everything together, handles UI
- **keyboard-controller.js**: Maps QWERTY keyboard to MIDI notes
- **midi-device-handler.js**: Connects hardware MIDI devices

---

This architecture provides a solid foundation for a browser-based DAW with low latency, precise timing, and real-time visualization!

