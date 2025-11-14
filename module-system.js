/**
 * Module System - Universal modular synthesizer architecture
 * Allows adding, removing, and routing audio modules dynamically
 */

// Base Module Class - All modules inherit from this
class SynthModule {
    constructor(type, name, options = {}) {
        this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.name = name;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.parameters = {};
        this.inputs = [];
        this.outputs = [];
        this.uiElement = null;
    }

    // Initialize the module (override in subclasses)
    initialize(audioContext) {
        this.audioContext = audioContext;
    }

    // Connect this module to another module
    connect(targetModule) {
        if (this.outputs.length > 0 && targetModule.inputs.length > 0) {
            this.outputs[0].connect(targetModule.inputs[0]);
        }
    }

    // Disconnect from all targets
    disconnect() {
        this.outputs.forEach(output => {
            if (output && output.disconnect) {
                output.disconnect();
            }
        });
    }

    // Enable/disable the module
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.disconnect();
        }
        this.onEnabledChange(enabled);
    }

    // Called when enabled state changes (override in subclasses)
    onEnabledChange(enabled) {}

    // Get module parameter value
    getParameter(name) {
        return this.parameters[name];
    }

    // Set module parameter value
    setParameter(name, value) {
        this.parameters[name] = value;
        this.onParameterChange(name, value);
    }

    // Called when parameter changes (override in subclasses)
    onParameterChange(name, value) {}

    // Create UI for this module (override in subclasses)
    createUI() {
        return null;
    }

    // Dispose of the module and clean up resources
    dispose() {
        this.disconnect();
        if (this.uiElement && this.uiElement.parentNode) {
            this.uiElement.parentNode.removeChild(this.uiElement);
        }
    }
}

// Module Manager - Manages all active modules
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.moduleDefinitions = new Map();
        this.audioContext = null;
        this.listeners = {
            moduleAdded: [],
            moduleRemoved: [],
            moduleToggled: []
        };
    }

    // Set audio context
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
    }

    // Register a module type
    registerModuleType(type, definition) {
        this.moduleDefinitions.set(type, definition);
    }

    // Get all registered module types
    getAvailableModules() {
        return Array.from(this.moduleDefinitions.entries()).map(([type, def]) => ({
            type,
            name: def.name,
            description: def.description,
            category: def.category,
            icon: def.icon
        }));
    }

    // Add a module instance
    addModule(type, options = {}) {
        const definition = this.moduleDefinitions.get(type);
        if (!definition) {
            console.error(`Module type "${type}" not registered`);
            return null;
        }

        // Create module instance
        const module = definition.createInstance(options);

        // Initialize with audio context if available
        if (this.audioContext) {
            module.initialize(this.audioContext);
        }

        // Store module
        this.modules.set(module.id, module);

        // Emit event
        this.emit('moduleAdded', module);

        console.log(`Module added: ${module.name} (${module.id})`);
        return module;
    }

    // Remove a module instance
    removeModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) {
            console.error(`Module "${moduleId}" not found`);
            return false;
        }

        // Dispose of module
        module.dispose();

        // Remove from map
        this.modules.delete(moduleId);

        // Emit event
        this.emit('moduleRemoved', module);

        console.log(`Module removed: ${module.name} (${module.id})`);
        return true;
    }

    // Toggle module enabled state
    toggleModule(moduleId, enabled) {
        const module = this.modules.get(moduleId);
        if (!module) {
            console.error(`Module "${moduleId}" not found`);
            return false;
        }

        module.setEnabled(enabled);

        // Emit event
        this.emit('moduleToggled', { module, enabled });

        console.log(`Module ${enabled ? 'enabled' : 'disabled'}: ${module.name}`);
        return true;
    }

    // Get module by ID
    getModule(moduleId) {
        return this.modules.get(moduleId);
    }

    // Get all modules of a specific type
    getModulesByType(type) {
        return Array.from(this.modules.values()).filter(m => m.type === type);
    }

    // Get all active modules
    getAllModules() {
        return Array.from(this.modules.values());
    }

    // Event system
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Clear all modules
    clearAll() {
        this.modules.forEach(module => module.dispose());
        this.modules.clear();
    }
}

// Example module definitions

// VCO (Voltage Controlled Oscillator) Module
const VCOModule = {
    name: 'VCO (Oscillator)',
    description: 'Voltage controlled oscillator with multiple waveforms',
    category: 'source',
    icon: '~',
    createInstance: (options) => {
        const module = new SynthModule('vco', options.name || 'VCO', options);

        module.initialize = function(audioContext) {
            this.audioContext = audioContext;
            this.oscillator = null;
            this.gainNode = audioContext.createGain();
            this.outputs = [this.gainNode];

            this.parameters = {
                waveform: 'sine',
                detune: 0,
                volume: 1
            };
        };

        module.onParameterChange = function(name, value) {
            if (name === 'waveform' && this.oscillator) {
                this.oscillator.type = value;
            } else if (name === 'detune' && this.oscillator) {
                this.oscillator.detune.value = value;
            } else if (name === 'volume' && this.gainNode) {
                this.gainNode.gain.value = value;
            }
        };

        return module;
    }
};

// Filter Module
const FilterModule = {
    name: 'Filter',
    description: 'Multi-mode filter with cutoff and resonance',
    category: 'processor',
    icon: '⚡',
    createInstance: (options) => {
        const module = new SynthModule('filter', options.name || 'Filter', options);

        module.initialize = function(audioContext) {
            this.audioContext = audioContext;
            this.filterNode = audioContext.createBiquadFilter();
            this.inputs = [this.filterNode];
            this.outputs = [this.filterNode];

            this.parameters = {
                type: 'lowpass',
                cutoff: 5000,
                resonance: 1
            };

            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.value = 5000;
            this.filterNode.Q.value = 1;
        };

        module.onParameterChange = function(name, value) {
            if (name === 'type') {
                this.filterNode.type = value;
            } else if (name === 'cutoff') {
                this.filterNode.frequency.value = value;
            } else if (name === 'resonance') {
                this.filterNode.Q.value = value;
            }
        };

        module.onEnabledChange = function(enabled) {
            if (!enabled) {
                this.filterNode.frequency.value = 20000; // Bypass
                this.filterNode.Q.value = 0.1;
            } else {
                this.filterNode.frequency.value = this.parameters.cutoff;
                this.filterNode.Q.value = this.parameters.resonance;
            }
        };

        return module;
    }
};

// LFO Module
const LFOModule = {
    name: 'LFO',
    description: 'Low frequency oscillator for modulation',
    category: 'modulator',
    icon: '⟿',
    createInstance: (options) => {
        const module = new SynthModule('lfo', options.name || 'LFO', options);

        module.initialize = function(audioContext) {
            this.audioContext = audioContext;
            this.lfo = audioContext.createOscillator();
            this.lfoGain = audioContext.createGain();

            this.lfo.connect(this.lfoGain);
            this.lfo.start();

            this.outputs = [this.lfoGain];

            this.parameters = {
                rate: 2,
                depth: 20,
                waveform: 'sine'
            };

            this.lfo.frequency.value = 2;
            this.lfo.type = 'sine';
            this.lfoGain.gain.value = 20;
        };

        module.onParameterChange = function(name, value) {
            if (name === 'rate') {
                this.lfo.frequency.value = value;
            } else if (name === 'depth') {
                this.lfoGain.gain.value = value;
            } else if (name === 'waveform') {
                this.lfo.type = value;
            }
        };

        return module;
    }
};

// Distortion Module
const DistortionModule = {
    name: 'Distortion',
    description: 'Waveshaping distortion effect',
    category: 'processor',
    icon: '⚠',
    createInstance: (options) => {
        const module = new SynthModule('distortion', options.name || 'Distortion', options);

        module.initialize = function(audioContext) {
            this.audioContext = audioContext;
            this.preGain = audioContext.createGain();
            this.waveshaper = audioContext.createWaveShaper();
            this.postGain = audioContext.createGain();

            this.preGain.connect(this.waveshaper);
            this.waveshaper.connect(this.postGain);

            this.inputs = [this.preGain];
            this.outputs = [this.postGain];

            this.parameters = {
                drive: 0
            };

            this.updateDistortionCurve(0);
        };

        module.updateDistortionCurve = function(amount) {
            const samples = 44100;
            const curve = new Float32Array(samples);
            const deg = Math.PI / 180;

            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
            }

            this.waveshaper.curve = curve;
        };

        module.onParameterChange = function(name, value) {
            if (name === 'drive') {
                this.updateDistortionCurve(value / 10);
                this.preGain.gain.value = 1 + (value / 50);
                this.postGain.gain.value = 1 / (1 + (value / 50));
            }
        };

        module.onEnabledChange = function(enabled) {
            if (!enabled) {
                this.updateDistortionCurve(0);
            } else {
                this.updateDistortionCurve(this.parameters.drive / 10);
            }
        };

        return module;
    }
};

// Base UI Modules (these are UI-only, connecting to existing synth engine)

// Oscillator Base Module
const OscillatorBaseModule = {
    name: 'OSCILLATOR',
    description: 'Waveform selection and master volume',
    category: 'base',
    icon: '~',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('oscillator-base', options.name || 'OSCILLATOR', options);

        module.createUI = function() {
            return `
                <div class="wave-selector">
                    <button class="wave-btn active" data-wave="sine">SINE</button>
                    <button class="wave-btn" data-wave="square">SQR</button>
                    <button class="wave-btn" data-wave="sawtooth">SAW</button>
                    <button class="wave-btn" data-wave="triangle">TRI</button>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="master-volume-knob" data-param="master-volume">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="master-volume-value">50</div>
                            <div class="knob-label">VOL</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="master-detune-knob" data-param="master-detune">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="master-detune-value">0</div>
                            <div class="knob-label">TUNE</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// Voice Base Module (Unison & Effects)
const VoiceBaseModule = {
    name: 'VOICE',
    description: 'Unison and noise controls',
    category: 'base',
    icon: '♪',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('voice-base', options.name || 'VOICE', options);

        module.createUI = function() {
            return `
                <div class="unison-toggle">
                    <button id="unison-toggle-btn" class="toggle-btn">UNISON: OFF</button>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="unison-detune-knob" data-param="unison-detune">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="unison-detune-value">5</div>
                            <div class="knob-label">DTUNE</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="noise-amount-knob" data-param="noise-amount">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="noise-amount-value">0</div>
                            <div class="knob-label">NOISE</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// Amplitude Base Module (ADSR Envelope)
const AmplitudeBaseModule = {
    name: 'AMPLITUDE',
    description: 'Amplitude envelope (ADSR)',
    category: 'base',
    icon: '▲',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('amplitude-base', options.name || 'AMPLITUDE', options);

        module.createUI = function() {
            return `
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="attack-knob" data-param="attack">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="attack-value">10</div>
                            <div class="knob-label">ATK</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="decay-knob" data-param="decay">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="decay-value">100</div>
                            <div class="knob-label">DEC</div>
                        </div>
                    </div>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="sustain-knob" data-param="sustain">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="sustain-value">70</div>
                            <div class="knob-label">SUS</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="release-knob" data-param="release">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="release-value">200</div>
                            <div class="knob-label">REL</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// Filter Envelope Base Module
const FilterEnvBaseModule = {
    name: 'FILTER ENV',
    description: 'Filter envelope controls',
    category: 'base',
    icon: '◆',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('filter-env-base', options.name || 'FILTER ENV', options);

        module.createUI = function() {
            return `
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="filter-env-atk-knob" data-param="filter-env-atk">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="filter-env-atk-value">50</div>
                            <div class="knob-label">ATK</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="filter-env-dec-knob" data-param="filter-env-dec">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="filter-env-dec-value">200</div>
                            <div class="knob-label">DEC</div>
                        </div>
                    </div>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="filter-env-amt-knob" data-param="filter-env-amt">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="filter-env-amt-value">3000</div>
                            <div class="knob-label">AMT</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// Filter Base Module
const FilterBaseModule = {
    name: 'FILTER',
    description: 'Multi-mode filter with cutoff and resonance',
    category: 'base',
    icon: '⚡',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('filter-base', options.name || 'FILTER', options);

        module.createUI = function() {
            return `
                <div class="filter-type-selector">
                    <button class="filter-type-btn active" data-filter="lowpass">LP</button>
                    <button class="filter-type-btn" data-filter="highpass">HP</button>
                    <button class="filter-type-btn" data-filter="bandpass">BP</button>
                </div>
                <div class="filter-bypass-toggle">
                    <button id="filter-bypass-btn" class="filter-bypass-btn" data-bypassed="false">FILTER: ON</button>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="filter-cutoff-knob" data-param="filter-cutoff">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="filter-cutoff-value">5000</div>
                            <div class="knob-label">CUT</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="filter-resonance-knob" data-param="filter-resonance">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="filter-resonance-value">1.0</div>
                            <div class="knob-label">RES</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// Distortion Base Module
const DistortionBaseModule = {
    name: 'DISTORTION',
    description: 'Waveshaping distortion effect',
    category: 'base',
    icon: '⚠',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('distortion-base', options.name || 'DISTORTION', options);

        module.createUI = function() {
            return `
                <div class="effect-bypass-toggle">
                    <button id="distortion-bypass-btn" class="effect-bypass-btn" data-bypassed="false">DISTORTION: ON</button>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="distortion-knob" data-param="distortion">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="distortion-value">0</div>
                            <div class="knob-label">DRIVE</div>
                        </div>
                    </div>
                </div>
            `;
        };

        return module;
    }
};

// LFO Base Module
const LFOBaseModule = {
    name: 'LFO',
    description: 'Low frequency oscillator for modulation',
    category: 'base',
    icon: '⟿',
    isBaseModule: true,
    createInstance: (options) => {
        const module = new SynthModule('lfo-base', options.name || 'LFO', options);

        module.createUI = function() {
            return `
                <div class="lfo-target-selector">
                    <button class="lfo-target-btn active" data-target="cutoff">CUT</button>
                    <button class="lfo-target-btn" data-target="amplitude">AMP</button>
                    <button class="lfo-target-btn" data-target="pitch">PIT</button>
                </div>
                <div class="knobs-row">
                    <div class="knob-container">
                        <div class="knob" id="lfo-rate-knob" data-param="lfo-rate">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="lfo-rate-value">2.0</div>
                            <div class="knob-label">RATE</div>
                        </div>
                    </div>
                    <div class="knob-container">
                        <div class="knob" id="lfo-depth-knob" data-param="lfo-depth">
                            <div class="knob-indicator"></div>
                            <div class="knob-value" id="lfo-depth-value">20</div>
                            <div class="knob-label">DEPTH</div>
                        </div>
                    </div>
                </div>
                <div class="lfo-wave-selector">
                    <button class="lfo-wave-btn active" data-wave="sine">SIN</button>
                    <button class="lfo-wave-btn" data-wave="triangle">TRI</button>
                    <button class="lfo-wave-btn" data-wave="square">SQR</button>
                    <button class="lfo-wave-btn" data-wave="sawtooth">SAW</button>
                </div>
            `;
        };

        return module;
    }
};

// Global module manager instance
const moduleManager = new ModuleManager();

// Register base modules (UI-only, connect to existing synth engine)
moduleManager.registerModuleType('oscillator-base', OscillatorBaseModule);
moduleManager.registerModuleType('voice-base', VoiceBaseModule);
moduleManager.registerModuleType('amplitude-base', AmplitudeBaseModule);
moduleManager.registerModuleType('filter-env-base', FilterEnvBaseModule);
moduleManager.registerModuleType('filter-base', FilterBaseModule);
moduleManager.registerModuleType('distortion-base', DistortionBaseModule);
moduleManager.registerModuleType('lfo-base', LFOBaseModule);

// Register effect modules (these create actual audio processing nodes)
moduleManager.registerModuleType('vco', VCOModule);
moduleManager.registerModuleType('filter', FilterModule);
moduleManager.registerModuleType('lfo', LFOModule);
moduleManager.registerModuleType('distortion', DistortionModule);
