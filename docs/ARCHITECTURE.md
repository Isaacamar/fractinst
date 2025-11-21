# DAW Architecture Documentation

## Overview

This document describes the clean architecture for MIDI recording, playback, and piano roll visualization in the FractInst DAW.

## Core Architecture

The system is built around four main components:

1. **Transport** - Single source of truth for timing
2. **MidiRecorder** - Records MIDI events with proper timestamps
3. **PlaybackScheduler** - Schedules recorded events for playback
4. **PianoRoll** - Visual representation and editing interface

### Transport (`transport.js`)

The Transport class is the single source of truth for DAW timing. It uses `audioContext.currentTime` as the primary clock.

**Key Features:**
- All timing is in **seconds** (converted to beats when needed for display)
- Provides smooth playhead updates via `requestAnimationFrame`
- Supports play, stop, seek, loop
- Handles looping automatically

**API:**
```javascript
transport.play()           // Start playback
transport.stop()           // Stop playback
transport.seek(timeSeconds) // Seek to specific time
transport.getCurrentTime()  // Get current position in seconds
transport.getCurrentBeat()  // Get current position in beats
transport.setBpm(bpm)      // Set BPM
transport.setLoopLengthBars(bars) // Set loop length
```

**Time Representation:**
- Primary unit: **seconds** (from `audioContext.currentTime`)
- Display unit: **beats** (calculated from seconds and BPM)
- Conversion: `beats = (seconds * bpm) / 60`

### MidiRecorder (`midi-recorder.js`)

Records MIDI events with timestamps relative to the recording start time.

**Data Model:**
- **RecordedMidiEvent**: `{ type, channel, time, note, velocity, frequency, noteKey }`
- **MidiClip**: `{ id, startTime, length, events: RecordedMidiEvent[] }`
- **MidiTrack**: `{ id, name, clips: MidiClip[] }`

**Key Features:**
- Records note-on and note-off events with precise timestamps
- Creates clips that can be stored and replayed
- Events are stored with relative time (seconds from clip start)

**API:**
```javascript
recorder.startRecording()        // Start a new clip
recorder.stopRecording()         // Finalize current clip
recorder.recordNoteOn(noteData)  // Record note-on event
recorder.recordNoteOff(noteKey) // Record note-off event
recorder.getClips()             // Get all recorded clips
```

### PlaybackScheduler (`playback-scheduler.js`)

Schedules MIDI events for playback using a lookahead window.

**Key Features:**
- Uses a 100ms lookahead window
- Checks every 25ms for events to schedule
- Handles looping automatically
- Prevents double-scheduling of events

**Scheduling Strategy:**
- Events are scheduled relative to `audioContext.currentTime`
- Uses `setTimeout` for scheduling notes (acceptable for note scheduling)
- Tracks scheduled events to prevent duplicates
- Handles loop boundaries correctly

**API:**
```javascript
scheduler.start()  // Start scheduling
scheduler.stop()   // Stop scheduling
scheduler.reset()  // Reset (called on seek/stop)
```

### PianoRoll (`piano-roll.js`)

Visual sequencer that displays clips and provides playhead visualization.

**Key Features:**
- Uses seconds-based timeline (converted to pixels for display)
- Smooth playhead updates via Transport's `onUpdate` callback
- Draggable playhead for scrubbing
- Real-time updates during recording

**Timeline:**
- Timeline is in **seconds**
- Display uses pixels per second (calculated from BPM)
- Grid shows bars/beats for visual reference

**API:**
```javascript
pianoRoll.displayClips(clips)      // Display clips on grid
pianoRoll.updatePlaybackLine(time) // Update playhead position
pianoRoll.onBpmChange()            // Recalculate when BPM changes
```

## Data Flow

### Recording Flow

1. User presses Record → `dawCore.record()` called
2. `transport.play()` starts transport
3. `midiRecorder.startRecording()` creates new clip
4. User plays notes → `keyboardController` calls `dawCore.recordMidiNote()`
5. `midiRecorder.recordNoteOn()` records event with timestamp
6. Piano roll updates in real-time via `requestAnimationFrame`
7. User presses Stop → `midiRecorder.stopRecording()` finalizes clip
8. Piano roll displays final clip

### Playback Flow

1. User presses Play → `dawCore.play()` called
2. `transport.play()` starts transport
3. `playbackScheduler.start()` begins scheduling
4. Scheduler checks for events in lookahead window
5. Events are scheduled relative to `audioContext.currentTime`
6. Notes play via `synthEngine.playNote()`
7. Piano roll playhead updates smoothly via Transport's `onUpdate`

### Scrubbing Flow

1. User drags playhead → `pianoRoll` handles mouse events
2. Calculates time from mouse position
3. On mouseup → `dawCore.seek(timeSeconds)` called
4. `playbackScheduler.reset()` clears scheduled events
5. `transport.seek(timeSeconds)` updates position
6. If was playing, scheduler restarts

## Time Representation

### Primary: Seconds

All internal timing uses **seconds** from `audioContext.currentTime`. This is the most accurate and reliable timing source.

### Display: Beats

For user-facing display, beats are calculated from seconds:
```javascript
beats = (seconds * bpm) / 60
```

### Conversion

The Transport class provides conversion methods:
- `beatsToSeconds(beats)` - Convert beats to seconds
- `secondsToBeats(seconds)` - Convert seconds to beats

## BPM and Loop Length

- **BPM**: Beats per minute (default: 120)
- **Beats per Bar**: 4 (fixed)
- **Loop Length**: Configurable in bars (default: 4 bars = 16 beats)

When BPM changes:
- Transport recalculates loop boundaries
- Piano roll recalculates pixels per second
- Playback continues from current position

## Extension Points

### Multi-Track Support

Currently supports a single track. To add multi-track:
1. Extend `MidiRecorder` to support multiple tracks
2. Update `PianoRoll` to display multiple tracks
3. Update `PlaybackScheduler` to schedule from multiple tracks

### Quantization

To add quantization:
1. Add quantization step parameter (e.g., 1/16 notes)
2. Round event times to nearest quantization step in `MidiRecorder`
3. Update piano roll grid to show quantization grid

### Loop Regions

To add loop regions:
1. Extend `Transport` to support multiple loop regions
2. Update `PlaybackScheduler` to handle region boundaries
3. Add UI for setting loop start/end points

## Tradeoffs

1. **setTimeout for Scheduling**: While Web Audio API doesn't have direct note scheduling, we use `setTimeout` which is acceptable for note scheduling. For more precise timing, consider using scheduled gain nodes.

2. **Single Track**: Currently supports one track. Multi-track requires architectural changes but the design supports it.

3. **No Quantization**: Events are recorded with exact timestamps. Quantization can be added as a post-processing step.

4. **Simple Loop**: Looping is basic (start to end). More sophisticated loop regions require additional logic.

## File Structure

```
transport.js          - Transport timing system
midi-recorder.js      - MIDI recording system
playback-scheduler.js - Playback scheduling
piano-roll.js         - Piano roll visualization
daw-core.js           - High-level DAW wrapper
app-v2-integration.js - Integration layer
```

## Usage Example

```javascript
// Initialize
const transport = new Transport(audioContext);
const recorder = new MidiRecorder(transport, synthEngine);
const scheduler = new PlaybackScheduler(transport, synthEngine, recorder);
const pianoRoll = new PianoRoll(transport, synthEngine, recorder);

// Record
transport.play();
recorder.startRecording();
// ... play notes ...
recorder.stopRecording();

// Playback
transport.play();
scheduler.start();
// Notes play automatically

// Seek
transport.seek(5.0); // Seek to 5 seconds
```

