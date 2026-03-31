class AudioEngine {
  private ctx: AudioContext | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.initialized = true;
    } catch (e) {
      console.error("Web Audio API not supported or failed to initialize", e);
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.error("Failed to resume audio context", e);
      }
    }
  }

  playTone(frequency: number, type: OscillatorType = 'sine', duration: number = 0.1) {
    if (!this.ctx) return;
    this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Error playing tone", e);
    }
  }

  playClick() {
    this.playTone(600, 'sine', 0.05);
  }

  playBet() {
    this.playTone(400, 'square', 0.2);
    setTimeout(() => this.playTone(600, 'square', 0.3), 100);
  }

  playWin() {
    this.playTone(440, 'sine', 0.1);
    setTimeout(() => this.playTone(554, 'sine', 0.1), 100);
    setTimeout(() => this.playTone(659, 'sine', 0.2), 200);
    setTimeout(() => this.playTone(880, 'sine', 0.4), 300);
  }

  playLose() {
    this.playTone(300, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4), 200);
  }
}

export const audio = new AudioEngine();
