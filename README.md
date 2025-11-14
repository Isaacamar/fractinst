# FractInst - Browser-Based Synth & DAW

This is a project I'm working on - a browser-based synthesizer and mini-DAW built with vanilla JavaScript and the Web Audio API. It's still very much a work in progress.

## What Works

- **Synthesizer**: Polyphonic synthesis with 8 voices, multiple waveforms, filters, LFO, effects (distortion, chorus, delay, reverb)
- **QWERTY Keyboard**: Play notes using your computer keyboard
- **Real-time Visualization**: Oscilloscope showing the waveform
- **Transport Controls**: Play, stop, metronome, BPM control
- **Piano Roll**: Visual sequencer interface (UI is there, but still working on the recording/playback integration)

## What Doesn't Work Yet

- **MIDI Recording**: The recording system is partially implemented but not fully working yet. You can see the piano roll UI, but recording notes and playing them back is still buggy.
- **Playback**: The playback scheduler needs more work - notes don't always play back correctly
- **Piano Roll Scrubbing**: The playhead dragging works visually but the audio scrubbing needs fixes

## Current State

I recently refactored the transport and recording system to use a cleaner architecture:
- New `Transport` class that uses `audioContext.currentTime` as the primary clock
- `MidiRecorder` for capturing MIDI events
- `PlaybackScheduler` for scheduling playback
- Refactored piano roll to use seconds-based timing

The architecture is cleaner now, but I'm still debugging the integration. The piano roll view sometimes doesn't switch properly, and the recording/playback flow needs work.

## How to Use

1. Open `index.html` in a modern browser
2. Click anywhere to initialize audio (browser requirement)
3. Use QWERTY keys to play notes (Q = C, W = C#, etc.)
4. Adjust knobs to tweak the sound
5. Click Play to start the transport
6. Piano Roll button switches to the sequencer view (though recording isn't working yet)

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Web Audio API (no Tone.js)
- Canvas for visualization
- CSS Grid/Flexbox for layout

## Files

- `audio-engine-v2.js` - Low-latency synth engine
- `transport.js` - Transport/timing system (new)
- `midi-recorder.js` - MIDI recording (new, still debugging)
- `playback-scheduler.js` - Playback scheduling (new, still debugging)
- `piano-roll.js` - Piano roll UI
- `daw-core.js` - High-level DAW wrapper
- `app-v2-integration.js` - Main integration layer
- `oscilloscope-v2.js` - Waveform visualization
- `keyboard-controller.js` - Keyboard input handling

## Goals

Eventually I want this to be a fully functional mini-DAW where you can:
- Record MIDI notes reliably
- Edit notes on the piano roll
- Play back recordings smoothly
- Maybe add audio recording too
- Multi-track support would be cool

But right now it's mostly a synth with a piano roll UI that's partially working. The synth itself works great though!

## Notes

This is a learning project for me - I'm figuring out Web Audio API timing, MIDI recording, and DAW architecture as I go. The code is probably messy in places, and I'm sure there are better ways to do things. But it's fun to build!

If you want to check it out, feel free. Just know it's incomplete and some things are broken.

