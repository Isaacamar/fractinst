# Credits & Acknowledgments

## Primary Developer

**Isaac Amar**
- Project creator and maintainer
- Architecture and design decisions
- Audio engine implementation
- User interface design
- Testing and quality assurance

## Development Assistance

This project was developed with significant assistance from Claude (Anthropic), Gemini (Google), and Composer (Cursor)

### What This Means

- **Architecture & Design**: Isaac Amar designed the overall system architecture, feature set, and user experience
- **Code Implementation**: Much of the code was written with Claude's assistance through pair programming
- **Problem Solving**: Claude helped debug issues, optimize performance, and implement complex features
- **Documentation**: Claude assisted in writing technical documentation and user guides

### Transparency Statement

FractInst is **free and open source** partially because AI assistance was used in development. This transparency is important:

- The **vision, design decisions, and curation** are entirely human-driven
- The **testing, iteration, and refinement** were done by Isaac
- The **quality and functionality** are what matter - the tool used to build it is secondary
- All code is provided as-is under the MIT License for inspection and modification

This development approach allowed for:
- Faster iteration and feature development
- More comprehensive documentation
- Better code quality through pair programming
- Focus on user experience over boilerplate

## Audio Samples & Assets

### Drum Samples

#### TR-909 Kit
- **Source**: Public domain TR-909 drum machine samples
- **License**: Public domain / CC0
- **Original Hardware**: Roland TR-909 Rhythm Composer (1983)

#### BVKER 909 Kit
- **Source**: BVKER sample pack collection
- **License**: Royalty-free for use in productions
- **Note**: Please verify specific license if redistributing samples separately
- **Website**: [BVKER on respective platform]

*If you are the rights holder for any samples and have concerns about their use, please contact the maintainer.*

## Libraries & Dependencies

FractInst is built on excellent open-source libraries:

### Core Framework
- **[React](https://react.dev/)** - MIT License - Meta Platforms, Inc.
- **[TypeScript](https://www.typescriptlang.org/)** - Apache 2.0 - Microsoft
- **[Vite](https://vitejs.dev/)** - MIT License - Evan You & contributors

### State & Routing
- **[Zustand](https://github.com/pmndrs/zustand)** - MIT License - Poimandres
- **[React Router](https://reactrouter.com/)** - MIT License - Remix Software Inc.

### UI & Utilities
- **[Driver.js](https://driverjs.com/)** - MIT License - Kamran Ahmed
- **[idb](https://github.com/jakearchibald/idb)** - ISC License - Jake Archibald

### 3D Visualization (if used)
- **[Three.js](https://threejs.org/)** - MIT License - Three.js authors
- **[React Three Fiber](https://github.com/pmndrs/react-three-fiber)** - MIT License - Poimandres

See [package.json](package.json) for complete dependency list.

## Design Inspiration

- **Roland TB-303** - Classic acid bassline synthesizer
- **Roland TR-909** - Legendary drum machine
- **Moog synthesizers** - Modular synthesis concepts
- **Ableton Live** - Modern DAW workflow inspiration
- **FL Studio** - Step sequencer pattern approach
- **VCV Rack** - Modular synthesis UI patterns

## Web Audio API

Built entirely on the native **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)**:
- No external audio processing libraries
- Direct access to browser's audio engine
- Maximum performance and low latency
- Thanks to the W3C Audio Working Group

## Special Thanks

- **The Web Audio API community** - for documentation, examples, and support
- **Open source contributors** - for the amazing libraries we depend on
- **Early testers and users** - for feedback and bug reports
- **Musicians and producers** - who inspire this project
- **Anthropic** - for Claude, which made this development possible

## Educational Resources

Resources that helped shape this project:

- [MDN Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Book](https://webaudioapi.com/) by Boris Smus
- [Sound on Sound - Synth Secrets](https://www.soundonsound.com/series/synth-secrets) articles
- [The Audio Programmer](https://www.youtube.com/@TheAudioProgrammer) YouTube channel

## License Summary

- **FractInst source code**: MIT License (see [LICENSE](LICENSE))
- **TR-909 samples**: Public domain
- **BVKER samples**: Royalty-free (verify before redistribution)
- **Dependencies**: Various open-source licenses (see package.json)

## Questions or Concerns?

If you have questions about licensing, attributions, or credits:
- Open an issue on GitHub
- Email: [your email]
- Check the [FAQ](#) (coming soon)

---

**FractInst would not exist without the contributions of countless developers, musicians, and open-source enthusiasts. Thank you!**
