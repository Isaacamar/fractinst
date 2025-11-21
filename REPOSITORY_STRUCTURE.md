# Repository Structure

## Overview

This repository has been reorganized for the React + TypeScript migration. Old JavaScript files have been moved to `legacy/` and documentation has been organized in `docs/`.

## Directory Structure

```
fractinst/
├── src/                    # Source code (React + TypeScript)
│   ├── components/         # React components
│   │   └── TransportBar/   # Transport bar component
│   ├── engines/            # Core audio engines (TypeScript)
│   │   ├── AudioEngine.ts
│   │   ├── Transport.ts
│   │   ├── MidiRecorder.ts
│   │   ├── PlaybackScheduler.ts
│   │   ├── DAWCore.ts
│   │   └── types.ts
│   ├── stores/             # Zustand state stores
│   │   ├── audioStore.ts
│   │   ├── transportStore.ts
│   │   └── midiStore.ts
│   ├── hooks/              # Custom React hooks (empty, for future use)
│   ├── utils/              # Utility functions (empty, for future use)
│   ├── App.tsx             # Main app component
│   ├── App.css             # App styles
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
│   └── README.md
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── ARCHITECTURE_EXPLAINED.md
│   ├── PROJECT_STATE.md
│   ├── CYMATIC_FIX_PROMPT.md
│   └── README.md
│
├── legacy/                 # Old JavaScript files (for reference)
│   ├── audio-engine-v2.js
│   ├── transport.js
│   ├── midi-recorder.js
│   ├── playback-scheduler.js
│   ├── daw-core.js
│   ├── app-v2-integration.js
│   ├── oscilloscope-v2.js
│   ├── piano-roll.js
│   ├── module-system.js
│   ├── module-ui.js
│   ├── module-layout.js
│   ├── knob.js
│   ├── keyboard-controller.js
│   ├── keyboard-help.js
│   ├── midi-device-handler.js
│   ├── onboarding.js
│   ├── index.html
│   ├── styles.css
│   └── README.md
│
├── index.html              # Entry HTML (Vite)
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # TypeScript config for Node
├── package.json            # Dependencies
├── .gitignore              # Git ignore rules
├── README.md               # Main project README
└── REFACTOR_STATUS.md      # Migration status
```

## File Organization

### Active Files (Used by React App)

- **src/** - All React/TypeScript source code
- **index.html** - Entry point for Vite
- **vite.config.ts** - Build configuration
- **tsconfig.json** - TypeScript configuration
- **package.json** - Dependencies

### Legacy Files (Not Used)

- **legacy/** - All old JavaScript files moved here
  - Can be deleted once migration is complete
  - Kept for reference during migration

### Documentation

- **docs/** - Architecture and project documentation
- **README.md** - Main project README
- **REFACTOR_STATUS.md** - Migration progress

## Migration Status

See [REFACTOR_STATUS.md](./REFACTOR_STATUS.md) for detailed migration status.

## Next Steps

1. Complete remaining React components (Oscilloscope, Piano Roll, etc.)
2. Migrate keyboard/MIDI input handling
3. Delete legacy files once migration is complete
4. Add tests

