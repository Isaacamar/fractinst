# Contributing to FractInst

First off, thank you for considering contributing to FractInst! 🎉

FractInst is a community-driven open-source project, and we welcome contributions of all kinds.

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (links to recordings, screenshots, etc.)
- **Describe the behavior you observed** and what you expected
- **Include browser and OS information**
- **Note if the problem started recently** or has always existed

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternative solutions** you've considered

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Test thoroughly in multiple browsers if possible
4. Ensure the build passes: `npm run build`
5. Update documentation if needed
6. Write a clear pull request description

#### Pull Request Guidelines

- **Keep changes focused** - One feature/fix per PR
- **Write clear commit messages** - Use present tense ("Add feature" not "Added feature")
- **Update the README** if you change functionality
- **Add comments** to complex code sections
- **Test audio features** carefully - audio bugs are hard to reproduce

## 🎨 Design Contributions

We welcome:
- **Preset instruments** - Share your synth patches
- **Drum patterns** - Create interesting rhythms
- **UI improvements** - Better layouts, colors, accessibility
- **Documentation** - Tutorials, guides, videos

## 📝 Documentation

Help improve the manual, README, or code comments:
- Fix typos and clarify instructions
- Add examples and tutorials
- Improve the in-app manual
- Create video tutorials or demos

## 💻 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- A modern browser (Chrome/Firefox/Edge recommended)

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/fractinst.git
cd fractinst

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production (to test)
npm run build
npm run preview
```

### Project Structure

```
src/
├── components/     # React UI components
├── engines/        # Audio processing engines
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

### Key Files
- `src/engines/AudioEngine.ts` - Core synthesizer
- `src/engines/DAWCore.ts` - Transport & recording
- `src/engines/DrumMachine.ts` - Sample playback
- `src/components/ModuleSystem/` - Synth UI modules
- `src/stores/` - Global state (audio params, tracks, etc.)

## 🧪 Testing

Before submitting a PR, please test:

1. **Audio playback** - No crackling, glitches, or dropouts
2. **UI responsiveness** - Smooth interactions, no lag
3. **Browser compatibility** - Test in Chrome, Firefox, Safari if possible
4. **Mobile** - Basic functionality on mobile browsers
5. **Edge cases** - High polyphony, rapid parameter changes, etc.

### Testing Audio Changes
```bash
# Run dev server
npm run dev

# Test these scenarios:
- Play single notes
- Play chords (high polyphony)
- Adjust parameters while notes are playing
- Enable/disable effects
- Record and playback
- Load/save presets
```

## 🎵 Audio Development Notes

- **Web Audio API** runs on audio thread - minimize main thread work
- **Avoid audio glitches** - be careful with real-time parameter changes
- **Test polyphony** - ensure changes work with 32 active voices
- **True bypass** - disabled effects should use zero CPU
- **Sample rate** - assume 48kHz but don't hardcode it

## 📋 Code Style

- Use **TypeScript** for all new code
- Use **functional components** and hooks
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Use **meaningful variable names**
- Keep functions small and focused

### Example
```typescript
/**
 * Applies ADSR envelope to audio parameter
 * @param param - Web Audio API AudioParam to modulate
 * @param time - Start time in seconds
 * @param attack - Attack time in seconds
 * @param decay - Decay time in seconds
 * @param sustain - Sustain level (0-1)
 * @param release - Release time in seconds
 */
function applyEnvelope(
  param: AudioParam,
  time: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number
): void {
  // Implementation
}
```

## 🔒 Security

If you discover a security vulnerability, please **DO NOT** open a public issue. Email the maintainer directly instead.

## 📜 Code of Conduct

- **Be respectful** and considerate
- **Be collaborative** - help others learn
- **Be patient** - remember everyone was a beginner once
- **Give credit** where it's due
- **Accept constructive criticism** gracefully

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions, ideas, showcase
- **Pull Requests** - Code contributions

## 🙏 Recognition

All contributors will be recognized in:
- The project's README
- Release notes
- A CONTRIBUTORS.md file (coming soon)

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FractInst! Your help makes this project better for everyone.** 🎹🎶
