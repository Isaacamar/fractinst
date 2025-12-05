import React from 'react';
import { Link } from 'react-router-dom';
import './Manual.css';

export const Manual: React.FC = () => {
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="manual-layout">
            <aside className="manual-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="back-link">← Back to DAW</Link>
                    <h1 className="manual-title">FractInst</h1>
                    <p className="manual-version">v2.0.0</p>
                </div>

                <nav className="manual-nav">
                    <div className="nav-group">
                        <h3>Getting Started</h3>
                        <ul>
                            <li><a href="#introduction" onClick={(e) => handleNavClick(e, 'introduction')}>Introduction</a></li>
                            <li><a href="#quick-start" onClick={(e) => handleNavClick(e, 'quick-start')}>Quick Start</a></li>
                            <li><a href="#interface-overview" onClick={(e) => handleNavClick(e, 'interface-overview')}>Interface Overview</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Sound Modules</h3>
                        <ul>
                            <li><a href="#oscillator" onClick={(e) => handleNavClick(e, 'oscillator')}>Oscillator</a></li>
                            <li><a href="#envelope" onClick={(e) => handleNavClick(e, 'envelope')}>ADSR Envelope</a></li>
                            <li><a href="#filter" onClick={(e) => handleNavClick(e, 'filter')}>Filter</a></li>
                            <li><a href="#filter-envelope" onClick={(e) => handleNavClick(e, 'filter-envelope')}>Filter Envelope</a></li>
                            <li><a href="#lfo" onClick={(e) => handleNavClick(e, 'lfo')}>LFO</a></li>
                            <li><a href="#voice" onClick={(e) => handleNavClick(e, 'voice')}>Voice Module</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Effects</h3>
                        <ul>
                            <li><a href="#distortion" onClick={(e) => handleNavClick(e, 'distortion')}>Distortion</a></li>
                            <li><a href="#compressor" onClick={(e) => handleNavClick(e, 'compressor')}>Compressor</a></li>
                            <li><a href="#chorus" onClick={(e) => handleNavClick(e, 'chorus')}>Chorus</a></li>
                            <li><a href="#delay" onClick={(e) => handleNavClick(e, 'delay')}>Delay</a></li>
                            <li><a href="#reverb" onClick={(e) => handleNavClick(e, 'reverb')}>Reverb</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Drums & Sequencing</h3>
                        <ul>
                            <li><a href="#drum-machine" onClick={(e) => handleNavClick(e, 'drum-machine')}>Drum Machine</a></li>
                            <li><a href="#drum-kits" onClick={(e) => handleNavClick(e, 'drum-kits')}>Drum Kits</a></li>
                            <li><a href="#step-sequencer" onClick={(e) => handleNavClick(e, 'step-sequencer')}>Step Sequencer</a></li>
                            <li><a href="#pattern-presets" onClick={(e) => handleNavClick(e, 'pattern-presets')}>Pattern Presets</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Interface Guide</h3>
                        <ul>
                            <li><a href="#transport-bar" onClick={(e) => handleNavClick(e, 'transport-bar')}>Transport Bar</a></li>
                            <li><a href="#piano-roll" onClick={(e) => handleNavClick(e, 'piano-roll')}>Piano Roll</a></li>
                            <li><a href="#track-system" onClick={(e) => handleNavClick(e, 'track-system')}>Track System</a></li>
                            <li><a href="#instrument-library" onClick={(e) => handleNavClick(e, 'instrument-library')}>Instrument Library</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Keyboard Reference</h3>
                        <ul>
                            <li><a href="#keyboard-piano" onClick={(e) => handleNavClick(e, 'keyboard-piano')}>Piano Keys</a></li>
                            <li><a href="#keyboard-chords" onClick={(e) => handleNavClick(e, 'keyboard-chords')}>Chord Keys</a></li>
                            <li><a href="#keyboard-drums" onClick={(e) => handleNavClick(e, 'keyboard-drums')}>Drum Keys</a></li>
                            <li><a href="#keyboard-shortcuts" onClick={(e) => handleNavClick(e, 'keyboard-shortcuts')}>Shortcuts</a></li>
                        </ul>
                    </div>

                    <div className="nav-group">
                        <h3>Tutorials</h3>
                        <ul>
                            <li><a href="#making-beat" onClick={(e) => handleNavClick(e, 'making-beat')}>Making a Beat</a></li>
                            <li><a href="#designing-sound" onClick={(e) => handleNavClick(e, 'designing-sound')}>Designing Sounds</a></li>
                            <li><a href="#using-presets" onClick={(e) => handleNavClick(e, 'using-presets')}>Using Presets</a></li>
                            <li><a href="#recording-midi" onClick={(e) => handleNavClick(e, 'recording-midi')}>Recording MIDI</a></li>
                        </ul>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <p>Dev: Isaac Amar</p>
                </div>
            </aside>

            <main className="manual-content">
                <div className="content-wrapper">
                    {/* GETTING STARTED */}
                    <section id="introduction" className="manual-section">
                        <h2>Introduction</h2>
                        <p>
                            FractInst is a powerful, low-latency browser-based digital audio workstation (DAW) and modular synthesizer.
                            Built on the Web Audio API, it delivers professional-grade sound design and music production capabilities
                            without requiring any software installation.
                        </p>
                        <p>
                            With 32-voice polyphony, a comprehensive modular synthesis engine, professional effects processing,
                            and an integrated drum machine, FractInst provides everything you need to create, perform, and produce music directly in your browser.
                        </p>
                    </section>

                    <section id="quick-start" className="manual-section">
                        <h2>Quick Start</h2>
                        <ol>
                            <li><strong>Open the App</strong>: Navigate to the FractInst URL in your browser.</li>
                            <li><strong>Start Audio</strong>: Click anywhere on the page to initialize the audio engine.</li>
                            <li><strong>Play Notes</strong>: Use your keyboard (keys <code>A</code> through <code>K</code>) to play the piano. Use <code>W</code>, <code>E</code>, <code>T</code>, <code>Y</code>, <code>U</code> for sharps/flats.</li>
                            <li><strong>Try Percussion</strong>: Click the <strong>DRUMS</strong> button, then use number keys (1-0) to trigger drum sounds.</li>
                            <li><strong>Make a Beat</strong>: Switch to <strong>SEQ</strong> view and click grid cells to create drum patterns.</li>
                            <li><strong>Record Music</strong>: Switch to <strong>ROLL</strong> view, click <strong>Record</strong>, and play notes on your keyboard.</li>
                        </ol>
                    </section>

                    <section id="interface-overview" className="manual-section">
                        <h2>Interface Overview</h2>
                        <p>FractInst's interface is organized into several key areas:</p>
                        <ul>
                            <li><strong>Transport Bar</strong>: Top section with playback controls (Play, Stop, Record), BPM, metronome, and time display.</li>
                            <li><strong>View Toggles</strong>: Switch between <code>INST</code> (Instrument/Module view), <code>ROLL</code> (Piano Roll editor), and <code>SEQ</code> (Step Sequencer).</li>
                            <li><strong>Mode Controls</strong>: <code>BINDINGS</code> for keyboard shortcuts, <code>DRUMS</code> for percussion mode, <code>?</code> for onboarding tour.</li>
                            <li><strong>Track Selector</strong>: Dropdown menu to switch between multiple tracks.</li>
                            <li><strong>Octave Controls</strong>: <code>-OCT</code> and <code>+OCT</code> buttons adjust the keyboard's octave range.</li>
                            <li><strong>Main Workspace</strong>: Changes based on selected view (modules, piano roll, or sequencer).</li>
                            <li><strong>Left Sidebar</strong>: Contains the Oscilloscope (waveform visualizer) and Instrument Library.</li>
                        </ul>
                    </section>

                    <hr className="section-divider" />

                    {/* SOUND MODULES */}
                    <section id="oscillator" className="manual-section">
                        <h2>Oscillator Module</h2>
                        <p>
                            The Oscillator is the primary sound source in FractInst. It generates periodic waveforms that form the basis of your synthesized sounds.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Wave Type</strong>: Choose from Sine, Square, Sawtooth, or Triangle waves.
                                <ul>
                                    <li><strong>Sine</strong>: Pure tone, smooth and simple. Great for bass, pads, and smooth leads.</li>
                                    <li><strong>Square</strong>: Hollow, clarinet-like sound. Rich in odd harmonics. Perfect for retro game sounds and aggressive leads.</li>
                                    <li><strong>Sawtooth</strong>: Bright, buzzy sound with all harmonics. Excellent for brass, strings, and classic analog leads.</li>
                                    <li><strong>Triangle</strong>: Similar to sine but with slightly more harmonics. Softer than sawtooth. Good for flutes and mellow tones.</li>
                                </ul>
                            </li>
                            <li><strong>VOL (Master Volume)</strong>: 0-100%. Controls the overall output level of the oscillator.</li>
                            <li><strong>TUNE (Master Detune)</strong>: -100 to +100 cents. Shifts pitch up or down in hundredths of a semitone. Great for creating subtle tuning variations or detuned effects.</li>
                        </ul>
                    </section>

                    <section id="envelope" className="manual-section">
                        <h2>ADSR Envelope</h2>
                        <p>
                            The ADSR Envelope controls how your sound's volume changes over time. ADSR stands for Attack, Decay, Sustain, Release.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Attack</strong> (0-1000ms): Time it takes for the sound to reach full volume after a note is pressed. Short attacks (0-10ms) create percussive, plucky sounds. Long attacks (500-1000ms) create slow swells.</li>
                            <li><strong>Decay</strong> (0-1000ms): Time it takes to drop from peak volume to the sustain level. Short decay creates punchy sounds. Long decay creates evolving tones.</li>
                            <li><strong>Sustain</strong> (0-100%): The volume level maintained while a key is held down. 100% sustain means the sound stays at full volume. Lower sustain creates sounds that fade while held.</li>
                            <li><strong>Release</strong> (0-1000ms): Time it takes for the sound to fade to silence after releasing a key. Short release (0-50ms) creates abrupt cutoffs. Long release (500-1000ms) creates smooth tails.</li>
                        </ul>
                        <h3>Common Envelope Settings</h3>
                        <ul>
                            <li><strong>Pluck/Piano</strong>: Attack 0ms, Decay 200ms, Sustain 30%, Release 100ms</li>
                            <li><strong>Pad</strong>: Attack 500ms, Decay 300ms, Sustain 80%, Release 800ms</li>
                            <li><strong>Organ</strong>: Attack 0ms, Decay 0ms, Sustain 100%, Release 10ms</li>
                            <li><strong>Brass</strong>: Attack 50ms, Decay 100ms, Sustain 70%, Release 200ms</li>
                        </ul>
                    </section>

                    <section id="filter" className="manual-section">
                        <h2>Filter Module</h2>
                        <p>
                            The Filter shapes your sound by removing certain frequencies. It's one of the most important tools for sound design.
                        </p>
                        <h3>Filter Types</h3>
                        <ul>
                            <li><strong>Lowpass</strong>: Removes high frequencies, allowing lows to pass through. Creates warm, muffled sounds. Most commonly used filter type.</li>
                            <li><strong>Highpass</strong>: Removes low frequencies, allowing highs to pass through. Creates thin, bright sounds. Great for removing bass rumble.</li>
                            <li><strong>Bandpass</strong>: Only allows a specific frequency range to pass through. Creates vocal-like or telephone-quality sounds.</li>
                        </ul>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>CUT (Cutoff Frequency)</strong>: 20Hz-20kHz. The frequency where the filter begins cutting. Lower cutoff = darker sound. Higher cutoff = brighter sound.</li>
                            <li><strong>RES (Resonance)</strong>: 0.1-20. Emphasizes frequencies at the cutoff point, creating a peak. Low resonance (1-5) = subtle filtering. High resonance (15-20) = aggressive, screaming sounds.</li>
                            <li><strong>Bypass</strong>: Toggle to completely remove the filter from the signal path (true bypass).</li>
                        </ul>
                        <h3>Tips</h3>
                        <ul>
                            <li>Start with cutoff around 50% and adjust to taste.</li>
                            <li>High resonance with low cutoff creates classic "acid" sounds.</li>
                            <li>Automate the cutoff with an LFO or Filter Envelope for movement.</li>
                        </ul>
                    </section>

                    <section id="filter-envelope" className="manual-section">
                        <h2>Filter Envelope</h2>
                        <p>
                            The Filter Envelope automatically modulates the filter cutoff over time, creating evolving timbres and dynamic sounds.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Attack</strong> (0-1000ms): Time for the filter to sweep from the base cutoff to the peak. Fast attack = sharp filter opening. Slow attack = gradual brightening.</li>
                            <li><strong>Decay</strong> (0-1000ms): Time for the filter to return from peak to base cutoff. Controls how quickly the brightness fades.</li>
                            <li><strong>Amount</strong> (0-5000Hz): How much the envelope moves the cutoff frequency. Higher amount = more dramatic filter sweeps.</li>
                        </ul>
                        <h3>Use Cases</h3>
                        <ul>
                            <li><strong>Pluck Sounds</strong>: Fast attack (0-10ms), medium decay (100-300ms), high amount (2000-4000Hz).</li>
                            <li><strong>Evolving Pads</strong>: Slow attack (500-1000ms), slow decay (500-1000ms), medium amount (1000-2000Hz).</li>
                            <li><strong>Wah Effect</strong>: Very fast attack (0ms), fast decay (50ms), extreme amount (4000-5000Hz).</li>
                        </ul>
                    </section>

                    <section id="lfo" className="manual-section">
                        <h2>LFO (Low-Frequency Oscillator)</h2>
                        <p>
                            The LFO creates rhythmic or evolving modulation by automatically changing parameters over time. Unlike audio oscillators, LFOs operate at sub-audio frequencies (below 20Hz).
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Wave Type</strong>: Sine, Triangle, Square, Sawtooth. Determines the shape of the modulation.
                                <ul>
                                    <li><strong>Sine</strong>: Smooth, natural modulation. Best for vibrato and tremolo.</li>
                                    <li><strong>Triangle</strong>: Similar to sine but with sharper peaks.</li>
                                    <li><strong>Square</strong>: Abrupt on/off switching. Creates rhythmic gating effects.</li>
                                    <li><strong>Sawtooth</strong>: Gradual ramp then sudden drop. Creates rising/falling filter sweeps.</li>
                                </ul>
                            </li>
                            <li><strong>RATE</strong> (0.1-20Hz): Speed of the LFO. Lower rates (0.1-2Hz) create slow sweeps. Higher rates (10-20Hz) create tremolo/vibrato effects.</li>
                            <li><strong>DEPTH</strong> (0-100%): Intensity of the modulation. Higher depth = more dramatic effect.</li>
                            <li><strong>Target</strong>: What parameter the LFO controls.
                                <ul>
                                    <li><strong>CUT (Cutoff)</strong>: Modulates filter cutoff for wah-wah or sweeping effects.</li>
                                    <li><strong>AMP (Amplitude)</strong>: Modulates volume for tremolo effects.</li>
                                    <li><strong>PIT (Pitch)</strong>: Modulates pitch for vibrato effects (experimental).</li>
                                </ul>
                            </li>
                        </ul>
                        <h3>Creative Uses</h3>
                        <ul>
                            <li><strong>Wah-Wah</strong>: Target Cutoff, Sine wave, Rate 1-3Hz, Depth 50-80%.</li>
                            <li><strong>Tremolo</strong>: Target Amplitude, Sine wave, Rate 4-8Hz, Depth 40-60%.</li>
                            <li><strong>Rhythmic Gating</strong>: Target Amplitude, Square wave, synced to tempo, Depth 80-100%.</li>
                        </ul>
                    </section>

                    <section id="voice" className="manual-section">
                        <h2>Voice Module</h2>
                        <p>
                            The Voice Module controls voice layering and noise generation, adding thickness and texture to your sounds.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Unison Mode</strong>: ON/OFF. When enabled, each note plays multiple slightly detuned copies, creating a thicker, wider sound.</li>
                            <li><strong>Unison Detune</strong> (0-50 cents): Amount of detuning between unison voices. Higher values create chorus-like effects. Lower values add subtle thickness.</li>
                            <li><strong>Noise Amount</strong> (0-100%): Mixes white noise into your sound. Great for:
                                <ul>
                                    <li>Adding breath to wind instruments</li>
                                    <li>Creating snare/hi-hat sounds</li>
                                    <li>Adding grit and texture</li>
                                </ul>
                            </li>
                        </ul>
                        <h3>Tips</h3>
                        <ul>
                            <li>Unison + slight detune (5-15 cents) = lush supersaw lead</li>
                            <li>Noise (10-30%) + short envelope = snare drum</li>
                            <li>Noise (5-10%) + filter = realistic wind/breath sounds</li>
                        </ul>
                    </section>

                    <hr className="section-divider" />

                    {/* EFFECTS */}
                    <section id="distortion" className="manual-section">
                        <h2>Distortion Effect</h2>
                        <p>
                            Distortion adds harmonic saturation and grit to your sounds by clipping and waveshaping the signal.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>DRIVE</strong> (0-100): Controls the amount of distortion. Higher values create more aggressive, saturated tones.</li>
                            <li><strong>Bypass</strong>: True bypass switch - completely removes the effect from the signal path when off.</li>
                        </ul>
                        <h3>Use Cases</h3>
                        <ul>
                            <li><strong>Subtle Warmth</strong>: Drive 10-30. Adds analog-style saturation.</li>
                            <li><strong>Overdrive</strong>: Drive 40-60. Great for guitar-like tones.</li>
                            <li><strong>Heavy Distortion</strong>: Drive 70-100. Aggressive, industrial sounds.</li>
                        </ul>
                    </section>

                    <section id="compressor" className="manual-section">
                        <h2>Compressor Effect</h2>
                        <p>
                            The Compressor reduces the dynamic range of your sound, making loud parts quieter and quiet parts louder. This creates a more consistent, punchy sound.
                        </p>
                        <h3>Fixed Parameters</h3>
                        <ul>
                            <li><strong>Threshold</strong>: -24dB (signals above this level are compressed)</li>
                            <li><strong>Ratio</strong>: 12:1 (aggressive compression)</li>
                            <li><strong>Attack</strong>: 3ms (fast response)</li>
                            <li><strong>Release</strong>: 250ms (medium release time)</li>
                            <li><strong>Bypass</strong>: True bypass switch</li>
                        </ul>
                        <h3>What It Does</h3>
                        <p>
                            The compressor automatically controls volume, making your sounds more consistent and powerful. Great for:
                        </p>
                        <ul>
                            <li>Controlling peaks in dynamic performances</li>
                            <li>Adding punch to drums</li>
                            <li>Creating sustained, even tones</li>
                            <li>Gluing mix elements together</li>
                        </ul>
                    </section>

                    <section id="chorus" className="manual-section">
                        <h2>Chorus Effect</h2>
                        <p>
                            Chorus creates a thicker, richer sound by mixing your original signal with slightly delayed and pitch-modulated copies. It simulates the effect of multiple instruments playing in unison.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Wet Level</strong> (0-100%): Amount of chorus effect mixed with the dry signal. Higher values create more obvious chorusing.</li>
                            <li><strong>Bypass</strong>: True bypass switch</li>
                        </ul>
                        <h3>Internal Settings</h3>
                        <ul>
                            <li>Base Delay: ~3.5ms</li>
                            <li>LFO Rate: 1.5Hz (gentle modulation)</li>
                            <li>Modulation: Sine wave</li>
                        </ul>
                        <h3>Tips</h3>
                        <ul>
                            <li><strong>Subtle Width</strong>: Wet 20-40%. Adds stereo width without obvious chorusing.</li>
                            <li><strong>Classic Chorus</strong>: Wet 50-70%. The classic 80s chorus sound.</li>
                            <li><strong>Intense Shimmer</strong>: Wet 80-100%. Very obvious, shimmering effect.</li>
                        </ul>
                    </section>

                    <section id="delay" className="manual-section">
                        <h2>Delay Effect</h2>
                        <p>
                            Delay creates echoes of your sound, repeating at a set time interval. It adds space, depth, and rhythmic interest.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Wet Level</strong> (0-100%): Amount of delayed signal mixed with the dry signal.</li>
                            <li><strong>Bypass</strong>: True bypass switch</li>
                        </ul>
                        <h3>Fixed Settings</h3>
                        <ul>
                            <li>Delay Time: ~250ms (eighth note at 120 BPM)</li>
                            <li>Feedback: 30% (3-4 audible repeats)</li>
                        </ul>
                        <h3>Creative Uses</h3>
                        <ul>
                            <li><strong>Slapback</strong>: Wet 20-40%. Quick single echo, great for vocals and leads.</li>
                            <li><strong>Rhythmic Delay</strong>: Wet 50-70%. Creates rhythmic patterns.</li>
                            <li><strong>Ambient Space</strong>: Wet 60-90%. Creates spacious, atmospheric sounds.</li>
                        </ul>
                    </section>

                    <section id="reverb" className="manual-section">
                        <h2>Reverb Effect</h2>
                        <p>
                            Reverb simulates acoustic spaces by adding reflections and ambience to your sound. It can make your music sound like it's being played in a room, hall, or cathedral.
                        </p>
                        <h3>Parameters</h3>
                        <ul>
                            <li><strong>Wet Level</strong> (0-100%): Amount of reverb mixed with the dry signal.</li>
                            <li><strong>Bypass</strong>: True bypass switch</li>
                        </ul>
                        <h3>Technical Details</h3>
                        <ul>
                            <li>Type: Convolution reverb with algorithmic impulse response</li>
                            <li>IR Duration: 2 seconds</li>
                            <li>Character: Medium room/hall ambience</li>
                        </ul>
                        <h3>Settings Guide</h3>
                        <ul>
                            <li><strong>Dry/Close</strong>: Wet 10-20%. Adds subtle space without drowning the sound.</li>
                            <li><strong>Room Sound</strong>: Wet 30-50%. Natural room ambience.</li>
                            <li><strong>Hall/Cathedral</strong>: Wet 60-80%. Large, spacious reverb.</li>
                            <li><strong>Ambient Wash</strong>: Wet 90-100%. Extremely wet, atmospheric effect.</li>
                        </ul>
                    </section>

                    <hr className="section-divider" />

                    {/* DRUMS & SEQUENCING */}
                    <section id="drum-machine" className="manual-section">
                        <h2>Drum Machine</h2>
                        <p>
                            FractInst includes a professional drum machine with high-quality samples. Switch to drum mode by clicking the <code>DRUMS</code> button in the top bar.
                        </p>
                        <h3>Features</h3>
                        <ul>
                            <li>10 drum sounds per kit</li>
                            <li>Multiple drum kits (TR909, BVKER)</li>
                            <li>Real-time triggering via keyboard or sequencer</li>
                            <li>Individual velocity control per hit</li>
                            <li>Dedicated oscilloscope visualization</li>
                            <li>Pattern freezing for CPU optimization</li>
                        </ul>
                    </section>

                    <section id="drum-kits" className="manual-section">
                        <h2>Drum Kits</h2>
                        <p>
                            When in drum mode, use the kit selector dropdown to switch between different drum kits.
                        </p>
                        <h3>Available Kits</h3>
                        <ul>
                            <li><strong>TR-909</strong>: Classic Roland TR-909 drum machine samples. The legendary sound of techno, house, and electronic music.</li>
                            <li><strong>BVKER</strong>: Professional BVKER 909 Kit series. Modern, punchy versions of classic 909 sounds.</li>
                        </ul>
                        <h3>Drum Sounds (10 per kit)</h3>
                        <ol>
                            <li><strong>Kick</strong>: Bass drum - the foundation of your beat</li>
                            <li><strong>Snare</strong>: Snare drum - backbeat and fill element</li>
                            <li><strong>Clap</strong>: Hand clap - alternative to snare</li>
                            <li><strong>Closed Hi-Hat</strong>: Closed hi-hat cymbal - rhythmic pulse</li>
                            <li><strong>Open Hi-Hat</strong>: Open hi-hat cymbal - accent and release</li>
                            <li><strong>Low Tom</strong>: Low-pitched tom drum</li>
                            <li><strong>High Tom</strong>: High-pitched tom drum</li>
                            <li><strong>Ride</strong>: Ride cymbal - alternative to hi-hats</li>
                            <li><strong>Rim</strong>: Rim shot - percussive accent</li>
                            <li><strong>Crash</strong>: Crash cymbal - transitions and emphasis</li>
                        </ol>
                    </section>

                    <section id="step-sequencer" className="manual-section">
                        <h2>Step Sequencer</h2>
                        <p>
                            The Step Sequencer provides a grid-based interface for programming drum patterns. Click <code>SEQ</code> to access it.
                        </p>
                        <h3>Interface</h3>
                        <ul>
                            <li><strong>Grid</strong>: 10 rows (one per drum sound) × adjustable columns (steps)</li>
                            <li><strong>Active Steps</strong>: Highlighted cells = drum hits. Click to toggle on/off.</li>
                            <li><strong>Playhead</strong>: Moving indicator shows current step during playback.</li>
                            <li><strong>Sound Preview</strong>: Clicking a cell triggers the drum sound for preview.</li>
                        </ul>
                        <h3>Controls</h3>
                        <ul>
                            <li><strong>Steps</strong>: Choose pattern length (commonly 8, 16, 32, or 64 steps)</li>
                            <li><strong>Resolution</strong>: Select note value per step
                                <ul>
                                    <li>1 = Quarter notes (slower, more space)</li>
                                    <li>2 = Eighth notes (standard tempo)</li>
                                    <li>4 = Sixteenth notes (default - most common)</li>
                                    <li>8 = Thirty-second notes (fast, rolling patterns)</li>
                                </ul>
                            </li>
                            <li><strong>Clear</strong>: Removes all steps from the pattern</li>
                            <li><strong>Mute</strong>: Silences drum output while keeping pattern visible</li>
                            <li><strong>SET/UNSET (Freeze)</strong>: Renders pattern to audio buffer for CPU optimization. Green = frozen.</li>
                        </ul>
                    </section>

                    <section id="pattern-presets" className="manual-section">
                        <h2>Pattern Presets</h2>
                        <p>
                            Save and load drum patterns using the preset system.
                        </p>
                        <h3>Built-in Patterns</h3>
                        <ul>
                            <li><strong>Classic House</strong>: Four-on-the-floor kick, clap on 2 and 4, steady closed hi-hats. The foundation of house music.</li>
                            <li><strong>Techno Rumble</strong>: Driving kick pattern with ride cymbal and tom fills. Dark, hypnotic techno groove.</li>
                            <li><strong>Hip Hop Bounce</strong>: Syncopated kick and snare with hi-hat variations. Classic boom-bap feel.</li>
                            <li><strong>Trap Basics</strong>: 32-step pattern with fast hi-hat rolls at eighth note resolution. Modern trap beat.</li>
                        </ul>
                        <h3>Saving Custom Patterns</h3>
                        <ol>
                            <li>Create your drum pattern in the sequencer grid</li>
                            <li>Click the preset dropdown</li>
                            <li>Select <code>+ Save Preset</code></li>
                            <li>Enter a name for your pattern</li>
                            <li>Pattern is saved to browser storage and appears in the preset list</li>
                        </ol>
                        <h3>Loading Patterns</h3>
                        <ul>
                            <li>Click the preset dropdown</li>
                            <li>Select any pattern from the list</li>
                            <li>The grid updates instantly with the loaded pattern</li>
                            <li>Press Play to hear your pattern</li>
                        </ul>
                    </section>

                    <hr className="section-divider" />

                    {/* INTERFACE GUIDE */}
                    <section id="transport-bar" className="manual-section">
                        <h2>Transport Bar</h2>
                        <p>The Transport Bar is located at the very top of the screen and controls playback and timing.</p>
                        <h3>Playback Controls</h3>
                        <ul>
                            <li><strong>Play</strong>: Starts playback from current position. Sequencer patterns and piano roll clips will play.</li>
                            <li><strong>Stop</strong>: Stops playback immediately and resets to the beginning. Also stops recording if active.</li>
                            <li><strong>Record</strong>: Enables MIDI recording. Notes you play on the keyboard will be captured into the piano roll.</li>
                        </ul>
                        <h3>Timing Controls</h3>
                        <ul>
                            <li><strong>BPM (Tempo)</strong>: 20-300 BPM range. Default is 120 BPM. Click and type to change, or drag to adjust.</li>
                            <li><strong>Loop Length</strong>: Set the length of your loop in bars (measures). Default is 4 bars.</li>
                            <li><strong>Time Display</strong>: Shows current position as Bars:Beats:Subbeats (e.g., 01:01:0.0)</li>
                        </ul>
                        <h3>Additional Controls</h3>
                        <ul>
                            <li><strong>Metronome</strong>: Toggle click track on/off. Plays 1000Hz beep on downbeat, 600Hz on other beats.</li>
                            <li><strong>Lead-In</strong>: Count-in before recording starts (4 beats by default)</li>
                        </ul>
                    </section>

                    <section id="piano-roll" className="manual-section">
                        <h2>Piano Roll Editor</h2>
                        <p>
                            The Piano Roll is a powerful MIDI editor for creating melodies, chords, and musical arrangements. Click <code>ROLL</code> to access it.
                        </p>
                        <h3>Layout</h3>
                        <ul>
                            <li><strong>Top Section</strong>: Timeline view showing all tracks and their clips</li>
                            <li><strong>Bottom Section</strong>: Note editor showing individual MIDI notes for the selected clip</li>
                            <li><strong>Left Side</strong>: Piano keyboard showing note names (C4, D#5, etc.)</li>
                        </ul>
                        <h3>Timeline View (Top)</h3>
                        <ul>
                            <li><strong>Track Lanes</strong>: Each track has its own horizontal lane with color coding</li>
                            <li><strong>Clips</strong>: Rectangular blocks containing MIDI notes. Click to select.</li>
                            <li><strong>Drag Clips</strong>: Click and drag to move clips in time</li>
                            <li><strong>Resize Clips</strong>: Drag the right edge to change clip length</li>
                            <li><strong>Select Multiple</strong>: Hold Shift and click to select multiple clips</li>
                            <li><strong>Seek</strong>: Click anywhere on the timeline to move the playhead</li>
                        </ul>
                        <h3>Note Editor (Bottom)</h3>
                        <ul>
                            <li><strong>Add Notes</strong>: Click on the grid to place a note</li>
                            <li><strong>Move Notes</strong>: Click and drag notes to change pitch (vertical) and timing (horizontal)</li>
                            <li><strong>Resize Notes</strong>: Drag the right edge of a note to change duration</li>
                            <li><strong>Select Multiple</strong>: Hold Shift and click to select multiple notes</li>
                            <li><strong>Delete Notes</strong>: Select and press Delete key</li>
                        </ul>
                        <h3>Note Range</h3>
                        <ul>
                            <li>Covers C1 (MIDI note 24) to C7 (MIDI note 96)</li>
                            <li>6 full octaves displayed</li>
                            <li>White keys and black keys (sharps/flats) clearly marked</li>
                        </ul>
                    </section>

                    <section id="track-system" className="manual-section">
                        <h2>Multi-Track System</h2>
                        <p>
                            FractInst supports unlimited tracks, allowing you to build complex arrangements with different instruments on each track.
                        </p>
                        <h3>Track Properties</h3>
                        <ul>
                            <li><strong>Name</strong>: Each track has a customizable name</li>
                            <li><strong>Color</strong>: Visual identifier for easy recognition</li>
                            <li><strong>Volume</strong>: Per-track volume control (0-100%)</li>
                            <li><strong>Pan</strong>: Stereo positioning (-100% left to +100% right)</li>
                            <li><strong>Mute</strong>: Silence a track without deleting it</li>
                            <li><strong>Solo</strong>: Play only this track (mutes all others)</li>
                            <li><strong>Instrument</strong>: Each track can have its own synth configuration</li>
                        </ul>
                        <h3>Working with Tracks</h3>
                        <ul>
                            <li><strong>Add Track</strong>: Create a new track with default instrument</li>
                            <li><strong>Select Track</strong>: Use the track selector dropdown to switch active track</li>
                            <li><strong>Delete Track</strong>: Remove unwanted tracks (automatically selects next track)</li>
                            <li><strong>Load Instrument</strong>: When you switch tracks, the instrument automatically loads</li>
                        </ul>
                        <h3>Clips & Organization</h3>
                        <ul>
                            <li>Each track can contain multiple MIDI clips</li>
                            <li>Clips are positioned on the timeline</li>
                            <li>Recording adds new clips to the active track</li>
                        </ul>
                    </section>

                    <section id="instrument-library" className="manual-section">
                        <h2>Instrument Library</h2>
                        <p>
                            The Instrument Library (left sidebar) lets you save and recall complete synthesizer configurations.
                        </p>
                        <h3>Features</h3>
                        <ul>
                            <li><strong>Save Instruments</strong>: Export your current synth settings (all modules, effects, parameters)</li>
                            <li><strong>Load Instruments</strong>: Recall saved configurations instantly</li>
                            <li><strong>Browser Storage</strong>: Instruments are saved locally in your browser</li>
                            <li><strong>Preset Instruments</strong>: Built-in presets to get you started</li>
                        </ul>
                        <h3>What Gets Saved</h3>
                        <p>When you export an instrument, everything is captured:</p>
                        <ul>
                            <li>All audio parameters (oscillator, filter, envelope, LFO, voice)</li>
                            <li>All effect settings (distortion, compressor, chorus, delay, reverb)</li>
                            <li>Bypass states for filter and effects</li>
                            <li>Module positions and states</li>
                        </ul>
                        <h3>How to Use</h3>
                        <ol>
                            <li>Design a sound you like in INST view</li>
                            <li>Open the Instrument Library (left sidebar)</li>
                            <li>Click the save/export button</li>
                            <li>Give your instrument a name</li>
                            <li>It now appears in your library for instant recall</li>
                        </ol>
                    </section>

                    <hr className="section-divider" />

                    {/* KEYBOARD REFERENCE */}
                    <section id="keyboard-piano" className="manual-section">
                        <h2>Piano Keys (QWERTY Keyboard)</h2>
                        <p>Your computer keyboard becomes a piano when not in drum mode.</p>
                        <h3>White Keys (Natural Notes)</h3>
                        <ul>
                            <li><code>A</code> = C</li>
                            <li><code>S</code> = D</li>
                            <li><code>D</code> = E</li>
                            <li><code>F</code> = F</li>
                            <li><code>G</code> = G</li>
                            <li><code>H</code> = A</li>
                            <li><code>J</code> = B</li>
                            <li><code>K</code> = C (next octave)</li>
                        </ul>
                        <h3>Black Keys (Sharps/Flats)</h3>
                        <ul>
                            <li><code>W</code> = C# / Db</li>
                            <li><code>E</code> = D# / Eb</li>
                            <li><code>T</code> = F# / Gb</li>
                            <li><code>Y</code> = G# / Ab</li>
                            <li><code>U</code> = A# / Bb</li>
                        </ul>
                        <h3>Octave Range</h3>
                        <ul>
                            <li>Use <code>-OCT</code> and <code>+OCT</code> buttons to shift octaves (0-8)</li>
                            <li>Or use keyboard shortcuts: <code>-</code> (octave down), <code>=</code> (octave up)</li>
                            <li>Current octave is displayed (e.g., C4 means octave 4)</li>
                        </ul>
                    </section>

                    <section id="keyboard-chords" className="manual-section">
                        <h2>Chord Keys</h2>
                        <p>Number keys (0-9) can be programmed to play chords. Open the Bindings modal to customize.</p>
                        <h3>Available Chord Types</h3>
                        <ul>
                            <li><strong>Major</strong>: Happy, bright sound (root, major 3rd, perfect 5th)</li>
                            <li><strong>Minor</strong>: Sad, dark sound (root, minor 3rd, perfect 5th)</li>
                            <li><strong>Diminished</strong>: Tense, unstable (root, minor 3rd, diminished 5th)</li>
                            <li><strong>Augmented</strong>: Dissonant, dreamy (root, major 3rd, augmented 5th)</li>
                            <li><strong>Major 7</strong>: Jazzy, sophisticated (major triad + major 7th)</li>
                            <li><strong>Minor 7</strong>: Mellow, jazz (minor triad + minor 7th)</li>
                            <li><strong>Dominant 7</strong>: Bluesy, tension (major triad + minor 7th)</li>
                            <li><strong>Suspended 4</strong>: Open, unresolved (root, 4th, 5th)</li>
                            <li><strong>Suspended 2</strong>: Open, bright (root, 2nd, 5th)</li>
                            <li><strong>Power Chord</strong>: Rock sound (root + 5th only)</li>
                            <li><strong>Octave</strong>: Just root note doubled</li>
                            <li><strong>Major 9</strong>: Extended major chord with 9th</li>
                            <li><strong>Minor 9</strong>: Extended minor chord with 9th</li>
                        </ul>
                    </section>

                    <section id="keyboard-drums" className="manual-section">
                        <h2>Drum Keys (Percussion Mode)</h2>
                        <p>When <code>DRUMS</code> mode is active, your keyboard triggers drum sounds.</p>
                        <h3>Primary Mapping (Number Row)</h3>
                        <ul>
                            <li><code>1</code> = Kick</li>
                            <li><code>2</code> = Snare</li>
                            <li><code>3</code> = Clap</li>
                            <li><code>4</code> = Closed Hi-Hat</li>
                            <li><code>5</code> = Open Hi-Hat</li>
                            <li><code>6</code> = Low Tom</li>
                            <li><code>7</code> = High Tom</li>
                            <li><code>8</code> = Ride</li>
                            <li><code>9</code> = Rim</li>
                            <li><code>0</code> = Crash</li>
                        </ul>
                        <h3>Alternative Mappings</h3>
                        <p>The same 10 drums are also mapped to QWERTY, ASDF, and ZXCV rows for different playing styles.</p>
                    </section>

                    <section id="keyboard-shortcuts" className="manual-section">
                        <h2>Keyboard Shortcuts</h2>
                        <h3>Transport</h3>
                        <ul>
                            <li><code>Space</code> - Play/Pause/Stop</li>
                            <li><code>R</code> - Start/Stop Recording</li>
                        </ul>
                        <h3>Octave</h3>
                        <ul>
                            <li><code>-</code> (Minus) - Octave Down</li>
                            <li><code>=</code> (Plus/Equal) - Octave Up</li>
                        </ul>
                        <h3>View the Full List</h3>
                        <p>Click the <code>BINDINGS</code> button in the top bar to see all keyboard shortcuts and customize chord bindings.</p>
                    </section>

                    <hr className="section-divider" />

                    {/* TUTORIALS */}
                    <section id="making-beat" className="manual-section">
                        <h2>Tutorial: Making Your First Beat</h2>
                        <p>Let's create a classic four-on-the-floor house beat from scratch.</p>
                        <ol>
                            <li><strong>Switch to Sequencer</strong>: Click <code>SEQ</code> in the view toggles</li>
                            <li><strong>Set Up</strong>: Choose 16 steps and 1/16 (sixteenth note) resolution</li>
                            <li><strong>Add Kick</strong>: Click the Kick row on steps 1, 5, 9, and 13 (every 4 steps = four-on-the-floor)</li>
                            <li><strong>Add Clap</strong>: Click the Clap row on steps 5 and 13 (2 and 4 in musical terms - the backbeat)</li>
                            <li><strong>Add Closed Hi-Hat</strong>: Click the Closed HH row on every other step (1, 3, 5, 7, 9, 11, 13, 15)</li>
                            <li><strong>Play It</strong>: Press the Play button in the transport bar</li>
                            <li><strong>Variation</strong>: Try adding an Open HH on step 16 for a release before the loop</li>
                            <li><strong>Save It</strong>: Open the preset dropdown and save your pattern</li>
                        </ol>
                        <h3>Next Steps</h3>
                        <ul>
                            <li>Try different step counts (32 steps for more complex patterns)</li>
                            <li>Experiment with the TR-909 vs BVKER kits</li>
                            <li>Add fills using toms and crash cymbals</li>
                        </ul>
                    </section>

                    <section id="designing-sound" className="manual-section">
                        <h2>Tutorial: Designing a Classic Synth Lead</h2>
                        <p>Let's create a bright, cutting lead sound perfect for electronic music.</p>
                        <ol>
                            <li><strong>Go to INST View</strong>: Click <code>INST</code></li>
                            <li><strong>Oscillator</strong>: Select <strong>Sawtooth</strong> wave (bright, harmonically rich)</li>
                            <li><strong>Filter</strong>:
                                <ul>
                                    <li>Type: <strong>Lowpass</strong></li>
                                    <li>Cutoff: ~60% (bright but not harsh)</li>
                                    <li>Resonance: ~40% (adds character)</li>
                                </ul>
                            </li>
                            <li><strong>Filter Envelope</strong>:
                                <ul>
                                    <li>Attack: 0ms (immediate)</li>
                                    <li>Decay: 200ms (quick sweep)</li>
                                    <li>Amount: 3000Hz (dramatic movement)</li>
                                </ul>
                            </li>
                            <li><strong>ADSR Envelope</strong>:
                                <ul>
                                    <li>Attack: 10ms (slight pluck)</li>
                                    <li>Decay: 100ms</li>
                                    <li>Sustain: 70%</li>
                                    <li>Release: 200ms (smooth tail)</li>
                                </ul>
                            </li>
                            <li><strong>Voice Module</strong>:
                                <ul>
                                    <li>Enable Unison</li>
                                    <li>Detune: 10 cents (thickness without detuned sound)</li>
                                </ul>
                            </li>
                            <li><strong>Chorus</strong>: Enable at 40% for width</li>
                            <li><strong>Test</strong>: Play some notes - you should hear a bright, cutting lead</li>
                            <li><strong>Save</strong>: Export to Instrument Library as "Bright Lead"</li>
                        </ol>
                        <h3>Variations</h3>
                        <ul>
                            <li><strong>Darker Lead</strong>: Lower filter cutoff to 40%, reduce resonance</li>
                            <li><strong>Pluck Sound</strong>: Reduce sustain to 30%, shorter release</li>
                            <li><strong>Aggressive Lead</strong>: Add distortion (drive 30-50%)</li>
                        </ul>
                    </section>

                    <section id="using-presets" className="manual-section">
                        <h2>Tutorial: Using and Modifying Presets</h2>
                        <p>Learn to work with the built-in drum patterns and create variations.</p>
                        <h3>Loading a Preset</h3>
                        <ol>
                            <li>Go to <code>SEQ</code> view</li>
                            <li>Click the <strong>Preset</strong> dropdown</li>
                            <li>Select <strong>Techno Rumble</strong></li>
                            <li>The grid updates with the pattern</li>
                            <li>Press Play to hear it</li>
                        </ol>
                        <h3>Modifying the Pattern</h3>
                        <ol>
                            <li>The pattern has kick and ride. Let's add hi-hats.</li>
                            <li>Click the Closed HH row on every other step</li>
                            <li>Add an Open HH on step 8 and step 16</li>
                            <li>Try adding a crash on step 1 for impact</li>
                        </ol>
                        <h3>Saving Your Version</h3>
                        <ol>
                            <li>Open the preset dropdown again</li>
                            <li>Select <strong>+ Save Preset</strong></li>
                            <li>Name it "Techno Rumble Extended"</li>
                            <li>Your pattern is now saved and appears in the list</li>
                        </ol>
                    </section>

                    <section id="recording-midi" className="manual-section">
                        <h2>Tutorial: Recording a MIDI Melody</h2>
                        <p>Learn to record your keyboard performance into the piano roll.</p>
                        <ol>
                            <li><strong>Prepare</strong>:
                                <ul>
                                    <li>Go to <code>ROLL</code> view</li>
                                    <li>Make sure you're not in DRUMS mode</li>
                                    <li>Set your desired octave (C4 is middle C)</li>
                                    <li>Set BPM to a comfortable tempo (e.g., 90 for slow, 120 for medium)</li>
                                </ul>
                            </li>
                            <li><strong>Start Recording</strong>:
                                <ul>
                                    <li>Click the <strong>Record</strong> button (or press R)</li>
                                    <li>The metronome will count in (4 beats)</li>
                                    <li>Playback starts automatically</li>
                                </ul>
                            </li>
                            <li><strong>Play Your Melody</strong>:
                                <ul>
                                    <li>Use A-K keys for notes</li>
                                    <li>W, E, T, Y, U for sharps/flats</li>
                                    <li>Number keys for chords</li>
                                </ul>
                            </li>
                            <li><strong>Stop Recording</strong>:
                                <ul>
                                    <li>Click Stop (or press Spacebar)</li>
                                    <li>Your notes appear as a clip in the active track</li>
                                </ul>
                            </li>
                            <li><strong>Edit Your Recording</strong>:
                                <ul>
                                    <li>Click on the clip to select it</li>
                                    <li>The note editor shows your MIDI notes</li>
                                    <li>Drag notes to fix timing or pitch</li>
                                    <li>Resize notes to adjust duration</li>
                                </ul>
                            </li>
                            <li><strong>Add More Takes</strong>:
                                <ul>
                                    <li>Move the playhead to a different position</li>
                                    <li>Record again to add more clips</li>
                                    <li>Or create a new track for a different instrument</li>
                                </ul>
                            </li>
                        </ol>
                    </section>
                </div>
            </main>
        </div>
    );
};
