/// <reference types="vite/client" />

/**
 * Drum Machine Engine
 * Handles loading and playback of drum samples
 */

export type DrumSound = 'kick' | 'snare' | 'clap' | 'hihat-closed' | 'hihat-open' | 'tom-low' | 'tom-high' | 'ride' | 'rim' | 'crash';
export type DrumKit = 'tr909' | 'bvker';

export class DrumMachine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map(); // Key: "kit:sound"
  private activeKit: DrumKit = 'tr909';
  private analyser: AnalyserNode | null = null;
  private waveformData: Uint8Array | null = null;

  // Sample paths
  private samplePaths: Record<DrumKit, Record<DrumSound, string>> = {
    'tr909': {
      'kick': 'samples/tr909/kick.wav',
      'snare': 'samples/tr909/snare.wav',
      'clap': 'samples/tr909/clap.wav',
      'hihat-closed': 'samples/tr909/hihat-closed.wav',
      'hihat-open': 'samples/tr909/hihat-open.wav',
      'tom-low': 'samples/tr909/tom-low.wav',
      'tom-high': 'samples/tr909/tom-high.wav',
      'ride': 'samples/tr909/ride.wav',
      'rim': 'samples/tr909/rim.wav',
      'crash': 'samples/tr909/ride.wav' // Fallback for now
    },
    'bvker': {
      'kick': 'samples/bvker/kick/BVKER - 909 Kit - Kick 01.wav',
      'snare': 'samples/bvker/snare/BVKER - 909 Kit - Snare 01.wav',
      'clap': 'samples/bvker/clap/BVKER - 909 Kit - Clap 01.wav',
      'hihat-closed': 'samples/bvker/hihat/BVKER - 909 Kit - Hat Closed 01.wav',
      'hihat-open': 'samples/bvker/hihat/BVKER - 909 Kit - Hat Open 01.wav',
      'tom-low': 'samples/bvker/tom/BVKER - 909 Kit - Tom 01.wav',
      'tom-high': 'samples/bvker/tom/BVKER - 909 Kit - Tom 06.wav',
      'ride': 'samples/bvker/cymbals/BVKER - 909 Kit - Ride 01.wav',
      'rim': 'samples/bvker/rim/BVKER - 909 Kit - Rim Shot 01.wav',
      'crash': 'samples/bvker/cymbals/BVKER - 909 Kit - Crash 01.wav'
    }
  };

  constructor() { }

  /**
   * Initialize with audio context
   */
  async init(context: AudioContext, destination: AudioNode): Promise<void> {
    this.context = context;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.8; // Default volume
    this.masterGain.connect(destination);

    // Create analyser for drum waveform visualization
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;
    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new ArrayBuffer(bufferLength);
    this.waveformData = new Uint8Array(buffer);

    // Tap the drum signal after masterGain for visualization
    this.masterGain.connect(this.analyser);

    await this.loadSamples();
  }

  /**
   * Load all samples
   */
  private async loadSamples(): Promise<void> {
    if (!this.context) return;

    const promises: Promise<void>[] = [];

    // Load all kits
    for (const kit of ['tr909', 'bvker'] as DrumKit[]) {
      for (const [sound, path] of Object.entries(this.samplePaths[kit])) {
        promises.push(this.loadSample(kit, sound as DrumSound, path));
      }
    }

    await Promise.all(promises);
    console.log('Drum machine samples loaded');
  }

  private async loadSample(kit: DrumKit, sound: DrumSound, path: string): Promise<void> {
    try {
      // Handle base URL for Vite (production/dev consistency)
      const baseUrl = import.meta.env.BASE_URL;
      // Remove trailing slash from base if present, and leading slash from path if present
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      // Encode path to handle spaces (e.g. "Kick 01.wav" -> "Kick%2001.wav")
      const encodedPath = encodeURI(cleanPath);
      const fullPath = `${cleanBase}/${encodedPath}`;

      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of audio. Path might be incorrect: ${fullPath}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
      this.buffers.set(`${kit}:${sound}`, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sample ${kit}:${sound} from ${path}:`, error);
    }
  }

  /**
   * Set active kit
   */
  setKit(kit: DrumKit): void {
    this.activeKit = kit;
  }

  /**
   * Trigger a drum sound
   */
  trigger(sound: DrumSound, time: number = 0, velocity: number = 1): void {
    const key = `${this.activeKit}:${sound}`;

    if (!this.context) {
      console.error('DrumMachine: No AudioContext');
      return;
    }
    if (!this.masterGain) {
      console.error('DrumMachine: No MasterGain');
      return;
    }
    if (!this.buffers.has(key)) {
      console.warn(`DrumMachine: Buffer not found for ${key}. Available:`, Array.from(this.buffers.keys()));
      return;
    }

    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(key)!;

    const gain = this.context.createGain();
    gain.gain.value = velocity;

    source.connect(gain);
    gain.connect(this.masterGain);

    // If time is 0 or in the past, play immediately
    const playTime = Math.max(this.context.currentTime, time);
    source.start(playTime);
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get audio context
   */
  getContext(): AudioContext | null {
    return this.context;
  }

  /**
   * Get drum waveform data for visualization
   */
  getWaveformData(): Uint8Array | null {
    if (!this.analyser || !this.waveformData) return null;
    this.analyser.getByteTimeDomainData(this.waveformData as any);
    return this.waveformData;
  }

  // --- Freeze / Offline Rendering ---

  private frozenBuffer: AudioBuffer | null = null;
  private frozenSource: AudioBufferSourceNode | null = null;

  /**
   * Render the current pattern to a single audio buffer
   */
  async renderPattern(
    patterns: Record<DrumSound, boolean[]>,
    stepCount: number,
    stepResolution: number, // 1=quarter, 2=8th, 4=16th, etc.
    bpm: number
  ): Promise<AudioBuffer | null> {
    if (!this.context) return null;

    // Calculate total duration
    // 60 seconds / BPM = seconds per beat
    // Calculate total duration
    // stepResolution is steps per beat (1=quarter, 2=8th, 4=16th)
    // Total beats = stepCount / stepResolution
    const secondsPerBeat = 60 / bpm;
    const totalDuration = (stepCount / stepResolution) * secondsPerBeat;

    // Create OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(
      2, // Stereo
      Math.ceil(totalDuration * this.context.sampleRate),
      this.context.sampleRate
    );

    // We need to load the buffers into the offline context? 
    // Actually, we can reuse the decoded AudioBuffers from this.buffers, 
    // but we need to create buffer sources attached to the offline context.

    const offlineMaster = offlineCtx.createGain();
    offlineMaster.connect(offlineCtx.destination);
    offlineMaster.gain.value = 0.8; // Match master volume

    // Schedule events
    const secondsPerStep = secondsPerBeat / stepResolution;

    for (const [sound, pattern] of Object.entries(patterns)) {
      const key = `${this.activeKit}:${sound}`;
      const buffer = this.buffers.get(key);

      if (!buffer) continue;

      pattern.forEach((isActive, stepIndex) => {
        if (isActive && stepIndex < stepCount) {
          const time = stepIndex * secondsPerStep;

          const source = offlineCtx.createBufferSource();
          source.buffer = buffer;

          // Simple gain for velocity (fixed at 1 for now)
          const gain = offlineCtx.createGain();
          gain.gain.value = 1.0;

          source.connect(gain);
          gain.connect(offlineMaster);

          source.start(time);
        }
      });
    }

    // Render
    try {
      const renderedBuffer = await offlineCtx.startRendering();
      this.frozenBuffer = renderedBuffer;
      console.log('Pattern rendered successfully', renderedBuffer.duration);
      return renderedBuffer;
    } catch (e) {
      console.error('Failed to render pattern:', e);
      return null;
    }
  }

  playFrozen(startTime: number = 0, offset: number = 0): void {
    if (!this.context || !this.frozenBuffer || !this.masterGain) return;

    this.stopFrozen();

    this.frozenSource = this.context.createBufferSource();
    this.frozenSource.buffer = this.frozenBuffer;
    this.frozenSource.loop = true;
    this.frozenSource.connect(this.masterGain);

    // Calculate correct start time
    const playTime = Math.max(this.context.currentTime, startTime);
    this.frozenSource.start(playTime, offset);
  }

  stopFrozen(): void {
    if (this.frozenSource) {
      try {
        this.frozenSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.frozenSource.disconnect();
      this.frozenSource = null;
    }
  }

  clearFrozen(): void {
    this.stopFrozen();
    this.frozenBuffer = null;
  }
}
