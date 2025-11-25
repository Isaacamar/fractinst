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
      const fullPath = `${cleanBase}/${cleanPath}`;

      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    console.log(`DrumMachine triggering: ${key}`);

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
}
