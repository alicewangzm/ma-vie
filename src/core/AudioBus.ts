/**
 * Central audio: procedural white-noise bed + master mute.
 * WebAudio can only start after a user gesture, so everything is lazy.
 * Full audio pass (piano ambient, purr, thunder) lands in Stage 3.
 */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  muted = false;

  /** Wake a context the browser parked while waiting for a gesture. */
  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  /** Safe to call any time; audio flows as soon as the browser allows. */
  start(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.startNoiseBed();
  }

  /** Gentle filtered white noise — wind between the clouds. */
  private startNoiseBed(): void {
    if (!this.ctx || !this.master) return;
    const sr = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sr * 4, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    filter.Q.value = 0.4;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    // slow fade-in so the bed never pops
    this.noiseGain.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 4);

    src.connect(filter).connect(this.noiseGain).connect(this.master);
    src.start();
  }

  /**
   * One thunder clap: a noise burst through a falling lowpass + a low sine
   * thump. Fully procedural — no sample to load. No-op before start().
   */
  thunder(intensity = 1): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime;
    const dur = 2.6;

    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t0);
    filter.frequency.exponentialRampToValueAtTime(90, t0 + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.5 * intensity, t0 + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);

    const thump = this.ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(52, t0);
    thump.frequency.exponentialRampToValueAtTime(30, t0 + 1.2);
    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0.25 * intensity, t0);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
    thump.connect(thumpGain).connect(this.master);
    thump.start(t0);
    thump.stop(t0 + 1.5);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }
}
