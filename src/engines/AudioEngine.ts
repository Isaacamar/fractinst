/**
 * Low-Latency Audio Engine V2
 * Direct Web Audio API implementation for minimal latency and true bypass
 * TypeScript version
 */

import type { Voice, Effects, EffectBypassed, AudioEngineParams, ActiveFrequency } from './types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private sampleRate: number = 44100;

  // Master gain
  private masterGain: GainNode | null = null;

  // Filter
  private filter: BiquadFilterNode | null = null;
  private filterBypassed: boolean = false;

  // Effects with true bypass
  private effects: Effects = {
    distortion: null,
    compressor: null,
    chorus: null,
    delay: null,
    reverb: null
  };

  // Effect bypass states - distortion off by default for cleaner sound
  private effectBypassed: EffectBypassed = {
    distortion: true, // Bypassed by default
    compressor: false,
    chorus: false,
    delay: false,
    reverb: false
  };

  // Voice management
  private voicePool: Voice[] = [];
  private activeVoices: Map<string | number, Voice> = new Map();
  private maxVoices: number = 8;

  // Module enable/disable states
  private moduleStates: Map<string, boolean> = new Map();

  // Parameters
  public params: AudioEngineParams = {
    waveType: 'sine',
    masterVolume: 0.5,

    // ADSR
    attackTime: 0.01,
    decayTime: 0.1,
    sustainLevel: 0.7,
    releaseTime: 0.2,

    // Filter - better defaults for a brighter, more musical sound
    filterCutoff: 12000, // Higher cutoff for brighter sound
    filterResonance: 1.5, // Slight resonance for more character
    filterType: 'lowpass',

    // Effects
    distortionAmount: 0,
    chorusAmount: 0,
    reverbAmount: 0,

    // LFO
    lfoRate: 2,
    lfoDepth: 20,
    lfoWaveType: 'sine',
    lfoTarget: 'cutoff',

    // Unison
    unisonMode: false,
    unisonVoices: 2,
    unisonDetune: 5,

    // Tuning
    masterDetune: 0,

    // Additional params
    noiseAmount: 0,
    filterEnvAttack: 50,
    filterEnvDecay: 200,
    filterEnvAmount: 3000
  };

  // LFO
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Analyser for visualization
  private analyser: AnalyserNode | null = null;
  private waveformData: Uint8Array | null = null;

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;

  // Metronome
  private metronomeEnabled: boolean = false;

  /**
   * Initialize audio context and signal chain
   */
  async init(): Promise<void> {
    if (this.context) return;

    // Create audio context with optimal settings
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass({
      sampleRate: 48000, // Higher sample rate for better quality
      latencyHint: 'interactive' // Low latency mode
    });

    this.sampleRate = this.context.sampleRate;
    console.log('Audio context initialized:', this.sampleRate, 'Hz');

    // Create master gain
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.params.masterVolume;
    this.masterGain.connect(this.context.destination);

    // Create filter
    this.filter = this.context.createBiquadFilter();
    this.filter.type = this.params.filterType;
    this.filter.frequency.value = this.params.filterCutoff;
    this.filter.Q.value = this.params.filterResonance;

    // Create effects with true bypass
    this.createEffects();

    // Setup signal routing
    this.setupSignalChain();

    // Create LFO
    this.createLFO();

    // Create analyser
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;
    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new ArrayBuffer(bufferLength);
    this.waveformData = new Uint8Array(buffer);

    // Connect analyser to filter output (before effects) for clean waveform visualization
    // This shows the raw oscillator shape
    this.filter.connect(this.analyser);

    // Initialize voice pool
    this.initVoicePool();

    // Setup recording
    this.setupRecording();

    console.log('Low-latency audio engine initialized');
  }

  /**
   * Get master gain node
   */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Create all effects with true bypass capability
   */
  private createEffects(): void {
    if (!this.context) return;

    // Distortion (using waveshaper)
    this.effects.distortion = {
      node: this.context.createWaveShaper(),
      bypassGain: this.context.createGain(),
      active: false
    };
    this.updateDistortionCurve(0);

    // Compressor
    this.effects.compressor = {
      node: this.context.createDynamicsCompressor(),
      bypassGain: this.context.createGain(),
      active: false
    };
    const compressor = this.effects.compressor.node as DynamicsCompressorNode;
    compressor.threshold.value = -24;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Chorus (using delay and LFO)
    const chorusDelay = this.context.createDelay(0.1);
    const chorusLfo = this.context.createOscillator();
    const chorusLfoGain = this.context.createGain();
    const chorusDelayGain = this.context.createGain();
    const chorusDryGain = this.context.createGain();
    const chorusBypassGain = this.context.createGain();

    chorusDelay.delayTime.value = 0.0035;
    chorusLfo.frequency.value = 1.5;
    chorusLfoGain.gain.value = 0.002;
    chorusDelayGain.gain.value = 0;
    chorusDryGain.gain.value = 1;
    chorusLfo.connect(chorusLfoGain);
    chorusLfoGain.connect(chorusDelay.delayTime);
    chorusLfo.start();

    this.effects.chorus = {
      node: chorusDelay,
      lfo: chorusLfo,
      lfoGain: chorusLfoGain,
      delayGain: chorusDelayGain,
      dryGain: chorusDryGain,
      bypassGain: chorusBypassGain,
      active: false
    };

    // Delay
    const delayNode = this.context.createDelay(1.0);
    const delayFeedback = this.context.createGain();
    const delayWetGain = this.context.createGain();
    const delayDryGain = this.context.createGain();
    const delayBypassGain = this.context.createGain();

    delayNode.delayTime.value = 0.25; // 8n at 120 BPM
    delayFeedback.gain.value = 0.3;
    delayWetGain.gain.value = 0;
    delayDryGain.gain.value = 1;

    this.effects.delay = {
      node: delayNode,
      feedback: delayFeedback,
      wetGain: delayWetGain,
      dryGain: delayDryGain,
      bypassGain: delayBypassGain,
      active: false
    };

    // Reverb (using convolver with impulse response)
    const reverbNode = this.context.createConvolver();
    const reverbWetGain = this.context.createGain();
    const reverbDryGain = this.context.createGain();
    const reverbBypassGain = this.context.createGain();

    reverbWetGain.gain.value = 0;
    reverbDryGain.gain.value = 1;

    this.effects.reverb = {
      node: reverbNode,
      wetGain: reverbWetGain,
      dryGain: reverbDryGain,
      bypassGain: reverbBypassGain,
      active: false
    };

    this.createReverbImpulse();
  }

  /**
   * Create reverb impulse response
   */
  private createReverbImpulse(): void {
    if (!this.context || !this.effects.reverb) return;

    const length = this.sampleRate * 2; // 2 seconds
    const impulse = this.context.createBuffer(2, length, this.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }

    (this.effects.reverb.node as ConvolverNode).buffer = impulse;
  }

  /**
   * Update distortion curve
   */
  private updateDistortionCurve(amount: number): void {
    if (!this.effects.distortion) return;

    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    const k = amount * 10;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    (this.effects.distortion.node as WaveShaperNode).curve = curve;
  }

  /**
   * Setup signal chain with true bypass routing
   */
  private setupSignalChain(): void {
    if (!this.filter || !this.masterGain) return;

    // Start: Filter output
    let currentOutput: AudioNode = this.filter;

    // Route through effects with true bypass
    // Each effect has a bypass path that can be switched

    // Distortion
    currentOutput = this.setupEffectBypass(currentOutput, 'distortion', this.effects.distortion);

    // Compressor
    currentOutput = this.setupEffectBypass(currentOutput, 'compressor', this.effects.compressor);

    // Chorus
    currentOutput = this.setupEffectBypass(currentOutput, 'chorus', this.effects.chorus);

    // Delay
    currentOutput = this.setupEffectBypass(currentOutput, 'delay', this.effects.delay);

    // Reverb
    currentOutput = this.setupEffectBypass(currentOutput, 'reverb', this.effects.reverb);

    // Final connection to master gain
    currentOutput.connect(this.masterGain);

    // Update bypass states
    this.updateAllBypasses();
  }

  /**
   * Setup effect bypass routing
   */
  private setupEffectBypass(input: AudioNode, name: string, effect: Effects[keyof Effects] | null): AudioNode {
    if (!this.context || !effect) return input;

    // Create mixer for effect and bypass
    const mixer = this.context.createGain();
    const effectGain = this.context.createGain();
    const bypassGain = this.context.createGain();

    // Connect input to both effect and bypass paths
    input.connect(effectGain);
    input.connect(bypassGain);

    // Connect effect path (handle special routing for chorus/delay/reverb)
    if (name === 'chorus') {
      // Chorus: input splits to dry and delayed (wet) signals
      effectGain.connect(effect.dryGain!);
      effect.dryGain!.connect(mixer);
      effectGain.connect(effect.node);
      effect.node.connect(effect.delayGain!);
      effect.delayGain!.connect(mixer);
    } else if (name === 'delay') {
      // Delay: input splits to dry and delayed (wet) signals with feedback
      effectGain.connect(effect.dryGain!);
      effect.dryGain!.connect(mixer);
      effectGain.connect(effect.node);
      effect.node.connect(effect.wetGain!);
      effect.wetGain!.connect(mixer);
      // Feedback loop: delay output feeds back into delay input
      effect.node.connect(effect.feedback!);
      effect.feedback!.connect(effect.node);
    } else if (name === 'reverb') {
      // Reverb: input splits to dry and reverb (wet) signals
      effectGain.connect(effect.dryGain!);
      effect.dryGain!.connect(mixer);
      effectGain.connect(effect.node);
      effect.node.connect(effect.wetGain!);
      effect.wetGain!.connect(mixer);
    } else {
      // Simple effects: input -> effect -> mixer
      effectGain.connect(effect.node);
      effect.node.connect(mixer);
    }

    // Connect bypass path
    bypassGain.connect(mixer);

    // Store references for bypass control
    effect.inputGain = effectGain;
    effect.bypassGain = bypassGain;
    effect.mixer = mixer;

    return mixer;
  }

  /**
   * Update all effect bypass states
   */
  private updateAllBypasses(): void {
    Object.keys(this.effectBypassed).forEach(name => {
      this.setEffectBypass(name as keyof EffectBypassed, this.effectBypassed[name as keyof EffectBypassed]);
    });
  }

  /**
   * Set effect bypass state (TRUE bypass - disconnect/reconnect)
   */
  setEffectBypass(name: keyof EffectBypassed, bypassed: boolean): void {
    this.effectBypassed[name] = bypassed;
    const effect = this.effects[name];

    if (!effect || !effect.inputGain || !effect.bypassGain) return;

    if (bypassed) {
      // TRUE bypass: mute effect path, enable bypass path
      effect.inputGain.gain.value = 0;
      effect.bypassGain.gain.value = 1;
      effect.active = false;
    } else {
      // Effect active: enable effect path, mute bypass path
      effect.inputGain.gain.value = 1;
      effect.bypassGain.gain.value = 0;
      effect.active = true;
    }

    console.log(`${name} bypass:`, bypassed ? 'ON' : 'OFF');
  }

  /**
   * Initialize voice pool
   */
  private initVoicePool(): void {
    for (let i = 0; i < this.maxVoices; i++) {
      this.voicePool.push(this.createVoice());
    }
  }

  /**
   * Create a single voice
   */
  private createVoice(): Voice {
    return {
      oscillator: null,
      envelope: null,
      isActive: false,
      noteKey: '',
      frequency: 0,
      startTime: 0
    };
  }

  /**
   * Get a free voice from pool
   */
  private getFreeVoice(): Voice {
    // Find inactive voice
    for (const voice of this.voicePool) {
      if (!voice.isActive) {
        return voice;
      }
    }

    // If all voices active, steal oldest
    let oldestVoice: Voice | null = null;
    let oldestTime = Infinity;

    for (const voice of this.voicePool) {
      if (voice.startTime < oldestTime) {
        oldestTime = voice.startTime;
        oldestVoice = voice;
      }
    }

    return oldestVoice || this.voicePool[0];
  }

  /**
   * Play a note
   */
  playNote(frequency: number, noteKey: string | number = frequency): void {
    if (!this.context) {
      console.warn('Audio context not initialized');
      return;
    }

    // Check if oscillator module is enabled
    if (!this.getModuleEnabled('oscillator-base')) {
      console.log('Oscillator module is disabled, not playing note');
      return;
    }

    if (this.context.state !== 'running') {
      console.warn('Audio context not running, state:', this.context.state);
      // Try to resume
      this.context.resume().then(() => {
        console.log('Audio context resumed');
        this.playNote(frequency, noteKey);
      }).catch(err => {
        console.error('Failed to resume audio context:', err);
      });
      return;
    }

    // Check if note already playing
    if (this.activeVoices.has(noteKey)) {
      console.log('Note already playing:', noteKey);
      return;
    }

    console.log('Playing note:', frequency, 'Hz, key:', noteKey);

    // Get free voice
    const voice = this.getFreeVoice();

    // Stop voice if it was active
    if (voice.isActive) {
      this.releaseVoice(voice);
    }

    // Create nodes for this voice
    voice.oscillator = this.context.createOscillator();
    voice.envelope = this.context.createGain();

    // Configure oscillator
    voice.oscillator.type = this.params.waveType;
    voice.oscillator.frequency.value = frequency;

    // Apply master detune
    if (this.params.masterDetune !== 0) {
      const detuneCents = this.params.masterDetune;
      const detuneRatio = Math.pow(2, detuneCents / 1200);
      voice.oscillator.frequency.value *= detuneRatio;
    }

    // Configure envelope - start at 0, ramp to 1, then to sustain
    // Check if amplitude module is enabled
    const amplitudeEnabled = this.getModuleEnabled('adsr-base');
    const now = this.context.currentTime;
    voice.envelope.gain.setValueAtTime(0, now);
    if (amplitudeEnabled) {
      voice.envelope.gain.linearRampToValueAtTime(1, now + this.params.attackTime);
      voice.envelope.gain.linearRampToValueAtTime(
        this.params.sustainLevel,
        now + this.params.attackTime + this.params.decayTime
      );
    } else {
      // If amplitude module is disabled, keep envelope at 0 (muted)
      voice.envelope.gain.setValueAtTime(0, now);
    }

    // Connect voice signal chain - oscillator -> envelope -> main filter
    // No per-voice filter to avoid double filtering
    voice.oscillator.connect(voice.envelope);
    voice.envelope.connect(this.filter!);

    // Start oscillator
    voice.oscillator.start(this.context.currentTime);

    // Store voice state
    voice.isActive = true;
    voice.noteKey = noteKey;
    voice.frequency = frequency;
    voice.startTime = this.context.currentTime;

    this.activeVoices.set(noteKey, voice);
  }

  /**
   * Release a note
   */
  releaseNote(noteKey: string | number): void {
    const voice = this.activeVoices.get(noteKey);
    if (!voice || !voice.isActive) return;

    this.releaseVoice(voice);
    this.activeVoices.delete(noteKey);
  }

  /**
   * Release a voice (start release envelope)
   */
  private releaseVoice(voice: Voice): void {
    if (!voice.isActive || !voice.envelope || !this.context) return;

    const now = this.context.currentTime;
    const currentGain = voice.envelope.gain.value;

    // Start release phase
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(currentGain, now);
    voice.envelope.gain.linearRampToValueAtTime(0, now + this.params.releaseTime);

    // Stop oscillator after release
    const stopTime = now + this.params.releaseTime + 0.01;
    voice.oscillator!.stop(stopTime);

    // Clean up after stop
    setTimeout(() => {
      if (voice.oscillator) {
        try {
          voice.oscillator.disconnect();
        } catch (e) { }
      }
      if (voice.envelope) {
        try {
          voice.envelope.disconnect();
        } catch (e) { }
      }
      voice.isActive = false;
      voice.oscillator = null;
      voice.envelope = null;
    }, (this.params.releaseTime + 0.01) * 1000);
  }

  /**
   * Stop all notes
   */
  stopAllNotes(): void {
    for (const [, voice] of this.activeVoices) {
      this.releaseVoice(voice);
    }
    this.activeVoices.clear();
  }

  /**
   * Create LFO
   */
  private createLFO(): void {
    if (!this.context) return;

    this.lfo = this.context.createOscillator();
    this.lfoGain = this.context.createGain();

    this.lfo.type = this.params.lfoWaveType;
    this.lfo.frequency.value = this.params.lfoRate;
    this.lfoGain.gain.value = this.params.lfoDepth / 100;

    this.lfo.connect(this.lfoGain);
    this.lfo.start();

    this.routeLFO();
  }

  /**
   * Route LFO to target
   */
  private routeLFO(): void {
    if (!this.lfoGain || !this.context) return;

    // Disconnect LFO from all targets
    this.lfoGain.disconnect();

    switch (this.params.lfoTarget) {
      case 'cutoff':
        if (this.filter && !this.filterBypassed) {
          const scale = this.context.createGain();
          scale.gain.value = this.params.filterCutoff * 0.5;
          this.lfoGain.connect(scale);
          scale.connect(this.filter.frequency);
        }
        break;
      case 'amplitude':
        const ampScale = this.context.createGain();
        ampScale.gain.value = 0.3;
        this.lfoGain.connect(ampScale);
        ampScale.connect(this.masterGain!.gain);
        break;
      case 'pitch':
        // Would need to modulate oscillator frequency
        // For now, skip
        break;
    }
  }

  /**
   * Setup recording
   */
  private setupRecording(): void {
    if (!this.context || !this.masterGain) return;

    try {
      this.recordingDestination = this.context.createMediaStreamDestination();
      this.masterGain.connect(this.recordingDestination);
    } catch (e) {
      console.warn('Recording setup failed:', e);
    }
  }

  // Update audio parameters
  updateParams(params: AudioEngineParams): void {
    this.params = { ...params };

    // Apply all parameters
    this.setWaveType(this.params.waveType);
    this.setMasterVolume(this.params.masterVolume * 100);
    this.setAttackTime(this.params.attackTime);
    this.setDecayTime(this.params.decayTime);
    this.setSustainLevel(this.params.sustainLevel * 100);
    this.setReleaseTime(this.params.releaseTime);
    this.setFilterCutoff(this.params.filterCutoff);
    this.setFilterResonance(this.params.filterResonance);
    this.setFilterType(this.params.filterType);
    this.setDistortionAmount(this.params.distortionAmount);
    this.setChorusAmount(this.params.chorusAmount);
    this.setReverbAmount(this.params.reverbAmount);
    this.setLFORate(this.params.lfoRate);
    this.setLFODepth(this.params.lfoDepth);
    this.setLFOWaveType(this.params.lfoWaveType);
    this.setLFOTarget(this.params.lfoTarget);
    this.setMasterDetune(this.params.masterDetune);
  }

  // ===== PARAMETER SETTERS =====

  setWaveType(type: OscillatorType): void {
    this.params.waveType = type;
    // Update all active voices
    for (const voice of this.activeVoices.values()) {
      if (voice.oscillator) {
        voice.oscillator.type = type;
      }
    }
  }

  setMasterVolume(volume: number): void {
    this.params.masterVolume = volume / 100;
    if (this.masterGain) {
      this.masterGain.gain.value = this.params.masterVolume;
    }
  }

  setAttackTime(time: number): void {
    this.params.attackTime = time;
  }

  setDecayTime(time: number): void {
    this.params.decayTime = time;
  }

  setSustainLevel(level: number): void {
    this.params.sustainLevel = level / 100;
  }

  setReleaseTime(time: number): void {
    this.params.releaseTime = time;
  }

  setFilterCutoff(freq: number): void {
    this.params.filterCutoff = Math.max(20, Math.min(20000, freq));
    if (this.filter && !this.filterBypassed) {
      this.filter.frequency.value = this.params.filterCutoff;
    }
  }

  setFilterResonance(q: number): void {
    this.params.filterResonance = Math.max(0.1, Math.min(20, q));
    if (this.filter && !this.filterBypassed) {
      this.filter.Q.value = this.params.filterResonance;
    }
  }

  setFilterType(type: BiquadFilterType): void {
    this.params.filterType = type;
    if (this.filter && !this.filterBypassed) {
      this.filter.type = type;
    }
  }

  setFilterBypass(bypassed: boolean): void {
    this.filterBypassed = bypassed;
    if (!this.filter) return;

    if (bypassed) {
      // Set filter to all-pass
      if (this.params.filterType === 'lowpass') {
        this.filter.frequency.value = 20000;
      } else if (this.params.filterType === 'highpass') {
        this.filter.frequency.value = 20;
      } else {
        this.filter.frequency.value = 10000;
        this.filter.Q.value = 0.1;
      }
    } else {
      this.filter.frequency.value = this.params.filterCutoff;
      this.filter.Q.value = this.params.filterResonance;
      this.filter.type = this.params.filterType;
    }
  }

  setDistortionAmount(amount: number): void {
    this.params.distortionAmount = Math.max(0, Math.min(100, amount));
    if (this.effects.distortion && !this.effectBypassed.distortion) {
      this.updateDistortionCurve(this.params.distortionAmount);
    }
  }

  setDistortionBypass(bypassed: boolean): void {
    this.setEffectBypass('distortion', bypassed);
  }

  setChorusAmount(amount: number): void {
    this.params.chorusAmount = Math.max(0, Math.min(100, amount));
    if (this.effects.chorus && !this.effectBypassed.chorus) {
      const wetLevel = this.params.chorusAmount / 100;
      this.effects.chorus.delayGain!.gain.value = wetLevel;
      this.effects.chorus.dryGain!.gain.value = 1 - wetLevel * 0.5; // Keep some dry signal
    }
  }

  setChorusBypass(bypassed: boolean): void {
    this.setEffectBypass('chorus', bypassed);
  }

  setReverbAmount(amount: number): void {
    this.params.reverbAmount = Math.max(0, Math.min(100, amount));
    if (this.effects.reverb && !this.effectBypassed.reverb) {
      this.effects.reverb.wetGain!.gain.value = this.params.reverbAmount / 100;
      this.effects.reverb.dryGain!.gain.value = 1 - (this.params.reverbAmount / 100);
    }
  }

  setReverbBypass(bypassed: boolean): void {
    this.setEffectBypass('reverb', bypassed);
  }

  setCompressorBypass(bypassed: boolean): void {
    this.setEffectBypass('compressor', bypassed);
  }

  setDelayBypass(bypassed: boolean): void {
    this.setEffectBypass('delay', bypassed);
  }

  setLFORate(rate: number): void {
    this.params.lfoRate = Math.max(0.1, Math.min(20, rate));
    if (this.lfo) {
      this.lfo.frequency.value = this.params.lfoRate;
    }
  }

  setLFODepth(depth: number): void {
    this.params.lfoDepth = Math.max(0, Math.min(100, depth));
    if (this.lfoGain) {
      this.lfoGain.gain.value = this.params.lfoDepth / 100;
    }
  }

  setLFOWaveType(type: OscillatorType): void {
    this.params.lfoWaveType = type;
    if (this.lfo) {
      this.lfo.type = type;
    }
  }

  setLFOTarget(target: 'cutoff' | 'amplitude' | 'pitch'): void {
    this.params.lfoTarget = target;
    this.routeLFO();
  }

  setMasterDetune(cents: number): void {
    this.params.masterDetune = Math.max(-100, Math.min(100, cents));
  }

  // ===== UTILITY METHODS =====

  async resumeAudio(): Promise<void> {
    await this.init();
    if (this.context && this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  getWaveformData(): Uint8Array | null {
    if (!this.analyser || !this.waveformData) return null;
    this.analyser.getByteTimeDomainData(this.waveformData as any);
    return this.waveformData;
  }

  /**
   * Get frequency data for cymatic visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequencyData);
    return frequencyData;
  }

  getActiveNoteCount(): number {
    return this.activeVoices.size;
  }

  isNotePlaying(noteKey: string | number): boolean {
    return this.activeVoices.has(noteKey);
  }

  /**
   * Get the frequency of the first active note (for oscilloscope stabilization)
   */
  getPrimaryActiveFrequency(): number | null {
    if (this.activeVoices.size === 0) return null;

    // Get first active voice
    const firstVoice = this.activeVoices.values().next().value;
    if (firstVoice && firstVoice.oscillator) {
      return firstVoice.oscillator.frequency.value;
    }

    return null;
  }

  /**
   * Get all active frequencies with their amplitudes (for cymatic visualization)
   */
  getActiveFrequencies(): ActiveFrequency[] {
    const frequencies: ActiveFrequency[] = [];

    for (const voice of this.activeVoices.values()) {
      if (voice && voice.oscillator && voice.envelope) {
        const freq = voice.oscillator.frequency.value;
        // Use envelope gain as amplitude proxy
        const amplitude = voice.envelope.gain.value * 255; // Scale to 0-255 range
        frequencies.push({ frequency: freq, amplitude: Math.max(1, amplitude) });
      }
    }

    return frequencies;
  }

  // Recording methods
  startRecording(): void {
    if (!this.recordingDestination) return;
    if (this.isRecording) return;

    try {
      this.recordedChunks = [];
      let mimeType = 'audio/webm';

      const supportedTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'];
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.recordingDestination.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Recording failed:', error);
    }
  }

  stopRecording(): Promise<string | null> {
    if (!this.mediaRecorder || !this.isRecording) {
      return Promise.resolve(null);
    }

    this.isRecording = false;

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder!.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
        this.recordedChunks = [];

        if (audioBlob.size === 0) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        resolve(url);
      };

      this.mediaRecorder.stop();
    });
  }

  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
  }

  isMetronomeEnabled(): boolean {
    return this.metronomeEnabled;
  }

  playMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + duration);
  }

  // Static utility methods
  static midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  static frequencyToMidi(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  }

  // Getters
  getContext(): AudioContext | null {
    return this.context;
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Set module enabled state
   * This controls whether a module affects audio
   */
  setModuleEnabled(moduleType: string, enabled: boolean): void {
    this.moduleStates.set(moduleType, enabled);

    switch (moduleType) {
      case 'oscillator-base':
        // Mute all oscillators by stopping all active voices
        if (!enabled) {
          const voicesToStop = Array.from(this.activeVoices.keys());
          voicesToStop.forEach(key => this.releaseNote(key));
        }
        break;

      case 'filter-base':
        // Use existing filter bypass
        this.setFilterBypass(!enabled);
        break;

      case 'distortion-base':
        // Use existing distortion bypass
        this.setDistortionBypass(!enabled);
        break;

      case 'lfo-base':
        // Mute LFO by setting gain to 0
        if (this.lfoGain) {
          this.lfoGain.gain.value = enabled ? this.params.lfoDepth / 100 : 0;
        }
        break;

      case 'adsr-base':
        // Mute envelope by setting all active voice envelopes to 0
        this.activeVoices.forEach(voice => {
          if (voice.envelope) {
            voice.envelope.gain.value = enabled ? this.params.sustainLevel : 0;
          }
        });
        break;

      case 'filter-env-base':
        // Filter envelope is applied via modulation, so we'll handle this differently
        // For now, just track the state
        break;

      case 'voice-base':
        // Voice module controls unison - disable unison when muted
        if (!enabled) {
          // Disable unison mode
          this.params.unisonMode = false;
        }
        break;
    }
  }

  /**
   * Get module enabled state
   */
  getModuleEnabled(moduleType: string): boolean {
    return this.moduleStates.get(moduleType) ?? true;
  }
}

