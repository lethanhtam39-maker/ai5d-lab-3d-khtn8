// Web Audio API procedural sound synthesizer (zero external assets needed)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bubblingOsc: OscillatorNode | null = null;
  private bubblingGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.bubblingGain) {
      this.bubblingGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft glass clink when Zn pellet falls into the tube
  public playDropZn() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(8, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);

    // Second bounce
    setTimeout(() => {
      if (this.isMuted || !this.ctx) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(1600, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.06);
    }, 90);
  }

  // Realistic liquid pouring sound (white noise filtered with variable bubbling resonant peaks)
  public playPour() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.8);
    filter.Q.setValueAtTime(6, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
  }

  // Realistic bubbling effervescence when H2 produces
  public startBubbling() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || this.bubblingOsc) return;

    // Create gentle low random fizz
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    this.bubblingGain = gain;
  }

  public stopBubbling() {
    if (this.bubblingGain && this.ctx) {
      this.bubblingGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.bubblingGain = null;
    }
  }

  // Affirmative chime on correct step
  public playSuccess() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  // Subtle warning when user attempts invalid operation
  public playWarning() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }
}

export const soundManager = new SoundManager();
