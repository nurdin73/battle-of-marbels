import { SoundSynthesisOptions } from '../types/audio.types';

class MarbleAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private isAmbientPlaying: boolean = false;
  private cricketTimer: ReturnType<typeof setTimeout> | null = null;

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbientSound();
    } else {
      this.startAmbientSound();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Start procedural atmospheric evening breeze and village cricket soundscape
   */
  public startAmbientSound(): void {
    if (this.isAmbientPlaying || this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      this.isAmbientPlaying = true;
      const now = ctx.currentTime;

      // Master ambient gain
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.03, now + 1.5);
      this.ambientGain.connect(ctx.destination);

      // 1. Procedural Wind / Gentle Breeze (Filtered pink noise buffer)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.08;
      }

      this.ambientNoiseSource = ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuffer;
      this.ambientNoiseSource.loop = true;

      // Lowpass filter simulating evening yard breeze
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.Q.setValueAtTime(1.2, now);

      // LFO for organic wind swelling
      this.ambientLfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      this.ambientLfo.type = 'sine';
      this.ambientLfo.frequency.setValueAtTime(0.12, now); // ~8 sec wind cycles
      lfoGain.gain.setValueAtTime(120, now);

      this.ambientLfo.connect(filter.frequency);
      this.ambientNoiseSource.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientNoiseSource.start();
      this.ambientLfo.start();

      // 2. Schedule procedural village cricket chirps
      this.scheduleCricketPulse();
    } catch {
      // Audio context may require user interaction gesture in browser
      this.isAmbientPlaying = false;
    }
  }

  private scheduleCricketPulse(): void {
    if (!this.isAmbientPlaying || this.isMuted) return;

    const nextDelay = 2200 + Math.random() * 3000;
    this.cricketTimer = setTimeout(() => {
      this.playCricketChirp();
      this.scheduleCricketPulse();
    }, nextDelay);
  }

  /**
   * Synthesize realistic tropical village evening cricket / jangkrik chirps
   */
  private playCricketChirp(): void {
    if (!this.isAmbientPlaying || this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);
    const baseFreq = 4400 + Math.random() * 300;

    for (let i = 0; i < pulses; i++) {
      const pulseTime = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, pulseTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, pulseTime + 0.03);

      gain.gain.setValueAtTime(0.001, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.018, pulseTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.035);

      osc.connect(gain);
      if (this.ambientGain) {
        gain.connect(this.ambientGain);
      } else {
        gain.connect(ctx.destination);
      }

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.04);
    }
  }

  /**
   * Stop atmospheric ambient sound
   */
  public stopAmbientSound(): void {
    this.isAmbientPlaying = false;
    if (this.cricketTimer) {
      clearTimeout(this.cricketTimer);
      this.cricketTimer = null;
    }
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop();
        this.ambientNoiseSource.disconnect();
      } catch {
        // Safe disconnect
      }
      this.ambientNoiseSource = null;
    }
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
        this.ambientLfo.disconnect();
      } catch {
        // Safe disconnect
      }
      this.ambientLfo = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // Safe disconnect
      }
      this.ambientGain = null;
    }
  }

  /**
   * Synthesize procedural collision sound based on relative velocity and marble material
   */
  public playCollisionSound(options: SoundSynthesisOptions): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const velocityClamped = Math.min(Math.max(options.relativeVelocity, 0.1), 5.0);
    const volumeFactor = Math.min(1.0, velocityClamped / 2.5);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let baseFreq = 2600;
    let decayDuration = 0.05;

    switch (options.materialType) {
      case 'GLASS_CLASSIC':
        baseFreq = 2800 + Math.random() * 400;
        osc.type = 'sine';
        decayDuration = 0.06;
        break;
      case 'MARBLE_STONE':
        baseFreq = 750 + Math.random() * 150;
        osc.type = 'triangle';
        decayDuration = 0.08;
        break;
      case 'BEARING_STEEL':
        baseFreq = 4200 + Math.random() * 600;
        osc.type = 'sine';
        decayDuration = 0.12;
        break;
    }

    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + decayDuration);

    const initialGain = Math.max(0.05, 0.45 * volumeFactor);
    gain.gain.setValueAtTime(initialGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decayDuration + 0.02);
  }

  /**
   * Synthesize tactile hollow bamboo / wood knock sound when colliding with fence or props
   */
  public playWoodKnockSound(relativeVelocity: number = 1.0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const velocityClamped = Math.min(Math.max(relativeVelocity, 0.1), 4.0);
    const volumeFactor = Math.min(1.0, velocityClamped / 2.0);
    const now = ctx.currentTime;

    // 1. Main wooden body impact (sharp transient)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    const baseFreq = 540 + Math.random() * 120;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.05);

    gain1.gain.setValueAtTime(Math.max(0.04, 0.4 * volumeFactor), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.07);

    // 2. Hollow bamboo resonant overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    const overtoneFreq = baseFreq * 1.85;
    osc2.frequency.setValueAtTime(overtoneFreq, now);
    osc2.frequency.exponentialRampToValueAtTime(overtoneFreq * 0.8, now + 0.07);

    gain2.gain.setValueAtTime(Math.max(0.02, 0.22 * volumeFactor), now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.09);
  }

  /**
   * Synthesize sharp stone / river pebble collision crack
   */
  public playStoneClackSound(relativeVelocity: number = 1.0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const velocityClamped = Math.min(Math.max(relativeVelocity, 0.1), 4.0);
    const volumeFactor = Math.min(1.0, velocityClamped / 2.0);
    const now = ctx.currentTime;

    // High mineral transient
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    const baseFreq = 2800 + Math.random() * 400;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.035);

    gain1.gain.setValueAtTime(Math.max(0.04, 0.38 * volumeFactor), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // High harmonic ping
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(5100 + Math.random() * 500, now);
    gain2.gain.setValueAtTime(Math.max(0.02, 0.18 * volumeFactor), now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.04);
  }

  /**
   * Synthesize hollow earthenware terracotta pot / bucket resonant clink
   */
  public playCeramicClinkSound(relativeVelocity: number = 1.0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const velocityClamped = Math.min(Math.max(relativeVelocity, 0.1), 4.0);
    const volumeFactor = Math.min(1.0, velocityClamped / 2.0);
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    const baseFreq = 1180 + Math.random() * 120;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.07);

    gain1.gain.setValueAtTime(Math.max(0.03, 0.35 * volumeFactor), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 1.55, now);
    gain2.gain.setValueAtTime(Math.max(0.015, 0.16 * volumeFactor), now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
  }

  /**
   * Synthesize deep dull tree trunk bark thud
   */
  public playTreeThudSound(relativeVelocity: number = 1.0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const velocityClamped = Math.min(Math.max(relativeVelocity, 0.1), 4.0);
    const volumeFactor = Math.min(1.0, velocityClamped / 2.0);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 210 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

    gain.gain.setValueAtTime(Math.max(0.05, 0.45 * volumeFactor), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Synthesize tactile launch whoosh / release flick
   */
  public playLaunchSound(forceNormalized: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = 180 + forceNormalized * 150;
    const endFreq = 500 + forceNormalized * 400;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

    const volume = Math.min(0.35, 0.1 + forceNormalized * 0.25);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Synthesize crisp reward chime when a target marble is knocked out of the ring
   */
  public playCaptureSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (high harmonic)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, now); // A6
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second rising tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2637, now + 0.08); // E7
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.32, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  /**
   * Procedural countdown tick-tock
   */
  public playTickSound(isUrgent: boolean = false): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 520, now);
    gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Procedural buzz/dull tone for foul or turn timeout
   */
  public playFoulSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Procedural celebratory fanfare chord for combo streak
   */
  public playComboSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 major arpeggio
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  }

  /**
   * Procedural triumphant victory fanfare
   */
  public playVictorySound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.12 },
      { f: 659.25, t: 0.12, d: 0.12 },
      { f: 783.99, t: 0.24, d: 0.16 },
      { f: 1046.5, t: 0.42, d: 0.45 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.22, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.02);
    });
  }
}

export const marbleAudio = new MarbleAudioSynthesizer();
