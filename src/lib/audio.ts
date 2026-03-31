class SafeAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  private init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(console.error);
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.isInitialized = true;
      }
    } catch (e) {
      console.error("Web Audio API initialization failed:", e);
    }
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio play failed:", e);
    }
  }

  click() {
    this.playTone(600, 'sine', 0.1, 0.05);
  }

  bet() {
    this.playTone(400, 'square', 0.2, 0.05);
    setTimeout(() => this.playTone(600, 'square', 0.3, 0.05), 100);
  }

  win() {
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659, 'sine', 0.3, 0.1), 200);
  }

  lose() {
    this.playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4, 0.1), 200);
  }
}

export const audioEngine = new SafeAudioEngine();
