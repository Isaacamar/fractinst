# Legacy Files

This directory contains the original vanilla JavaScript implementation files. These are kept for reference during the React + TypeScript migration.

## Files

- **audio-engine-v2.js** - Original audio engine (migrated to `src/engines/AudioEngine.ts`)
- **transport.js** - Original transport system (migrated to `src/engines/Transport.ts`)
- **midi-recorder.js** - Original MIDI recorder (migrated to `src/engines/MidiRecorder.ts`)
- **playback-scheduler.js** - Original scheduler (migrated to `src/engines/PlaybackScheduler.ts`)
- **daw-core.js** - Original DAW core (migrated to `src/engines/DAWCore.ts`)
- **app-v2-integration.js** - Original integration layer (migrated to `src/App.tsx`)
- **oscilloscope-v2.js** - Original oscilloscope (will be replaced by Three.js component)
- **piano-roll.js** - Original piano roll (will be replaced by React component)
- **module-system.js**, **module-ui.js**, **module-layout.js** - Original module system (will be replaced by React components)
- **knob.js** - Original knob component (will be replaced by React component)
- **keyboard-controller.js** - Keyboard input handler (needs React integration)
- **keyboard-help.js** - Keyboard help modal (needs React integration)
- **midi-device-handler.js** - MIDI device handler (needs React integration)
- **onboarding.js** - Onboarding system (needs React integration)
- **index.html** - Original HTML file (replaced by new `index.html`)

These files are not used by the new React application and can be safely deleted once migration is complete.

