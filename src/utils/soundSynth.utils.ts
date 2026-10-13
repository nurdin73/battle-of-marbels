import { SoundSynthesisOptions } from '../types/audio.types';

class MarbleAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

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
  }

  public getMuted(): boolean {
    return this.isMuted;
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
}

export const marbleAudio = new MarbleAudioSynthesizer();
