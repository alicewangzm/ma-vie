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

  /** Call from a user-gesture handler (click/tap). Safe to call twice. */
  start(): void {
    if (this.ctx) return;
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

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }
}
