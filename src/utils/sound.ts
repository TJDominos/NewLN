class SoundManager {
  ctx: AudioContext | null = null;
  buffers: Record<string, AudioBuffer> = {};
  bgmSource: AudioBufferSourceNode | null = null;
  bgmGainNode: GainNode | null = null;
  spinSource: AudioBufferSourceNode | null = null;
  isLoaded = false;
  isInitializing = false;
  soundEnabled = false;

  async init() {
    if (this.isLoaded) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    if (this.isInitializing) {
      // Wait for initialization to complete if already in progress
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.isInitializing = true;

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isInitializing = false;
      return;
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      this.isInitializing = false;
      return;
    }
    
    this.ctx = new AudioContextClass();
    
    // Unlock audio on iOS by playing a silent buffer immediately
    const buffer = this.ctx.createBuffer(1, 1, 22050);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(0);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    await this.generateSounds();
    this.isLoaded = true;
    this.isInitializing = false;
    
    if (this.soundEnabled) {
      this.setBgm(true);
    }
  }

  async generateSounds() {
    if (!this.ctx) return;
    
    this.buffers['spin'] = this.createNoiseBuffer(0.05, 0.3);
    this.buffers['spin_loop'] = this.createTickingBuffer(0.05, 0.1, 0.3);
    this.buffers['coin'] = await this.createToneBuffer([1200, 2000], 0.1, 'sine', true);
    
    // Win levels - progressively more impactful
    this.buffers['win_1x'] = await this.createImpactfulWinBuffer([523.25], 1.0, 'sine', false, false); // C5
    this.buffers['win_2x'] = await this.createImpactfulWinBuffer([523.25, 659.25], 1.4, 'sine', false, false); // C5, E5
    this.buffers['win_3x'] = await this.createImpactfulWinBuffer([523.25, 659.25, 783.99], 1.6, 'triangle', true, false); // C5, E5, G5
    this.buffers['win_4x'] = await this.createImpactfulWinBuffer([523.25, 659.25, 783.99, 1046.50], 1.8, 'triangle', true, false); // C5, E5, G5, C6
    this.buffers['win_5x'] = await this.createImpactfulWinBuffer([523.25, 659.25, 783.99, 1046.50, 1318.51], 2.0, 'triangle', true, false); // C5, E5, G5, C6, E6
    
    this.buffers['win_medium'] = await this.createImpactfulWinBuffer([440, 554.37, 659.25, 880, 1108.73], 2.0, 'square', true, true); // A major arpeggio
    this.buffers['win_big'] = await this.createImpactfulWinBuffer([523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98], 1.0, 'square', true, true); // C major extended
    this.buffers['win_mega'] = await this.createImpactfulWinBuffer([440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760, 2217.46], 1.0, 'square', true, true); // Epic
    
    this.buffers['bgm'] = await this.createBgmBuffer();
  }

  createNoiseBuffer(duration: number, volume: number) {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * volume * (1 - i / length);
    }
    return buffer;
  }

  createTickingBuffer(tickDuration: number, totalDuration: number, volume: number) {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * totalDuration;
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const tickLength = sampleRate * tickDuration;
    for (let i = 0; i < length; i++) {
      if (i < tickLength) {
        data[i] = (Math.random() * 2 - 1) * volume * (1 - i / tickLength);
      } else {
        data[i] = 0;
      }
    }
    return buffer;
  }

  async createToneBuffer(frequencies: number[], duration: number, type: OscillatorType, slide = false) {
    const sampleRate = this.ctx!.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    
    frequencies.forEach((freq, i) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = type;
      
      if (slide && i === 0 && frequencies.length > 1) {
        osc.frequency.setValueAtTime(frequencies[0], 0);
        osc.frequency.exponentialRampToValueAtTime(frequencies[1], duration);
      } else {
        osc.frequency.value = freq;
      }

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.2 / frequencies.length, 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, duration);
      
      osc.start(0);
      osc.stop(duration);
    });

    return offlineCtx.startRendering();
  }

  async createImpactfulWinBuffer(frequencies: number[], duration: number, type: OscillatorType, addBass: boolean = false, addNoise: boolean = false) {
    const sampleRate = this.ctx!.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    
    const step = duration / Math.max(frequencies.length, 1);
    
    // Main arpeggio (removed detune to prevent "wah" beating sound)
    frequencies.forEach((freq, i) => {
      const startTime = i * step;
      
      const osc1 = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      
      osc1.type = type;
      osc1.frequency.value = freq;
      
      osc1.connect(gain);
      gain.connect(offlineCtx.destination);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      // Let the note ring out longer for a majestic feel
      gain.gain.exponentialRampToValueAtTime(0.001, Math.min(startTime + step * 4, duration));
      
      osc1.start(startTime);
      osc1.stop(Math.min(startTime + step * 4, duration));
    });

    // Add a heavy bass drop for impact
    if (addBass && frequencies.length > 0) {
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'square';
      bassOsc.frequency.value = frequencies[0] / 4; // Drop 2 octaves
      
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, 0);
      filter.frequency.exponentialRampToValueAtTime(100, duration);
      
      bassOsc.connect(bassGain);
      bassGain.connect(filter);
      filter.connect(offlineCtx.destination);
      
      bassGain.gain.setValueAtTime(0, 0);
      bassGain.gain.linearRampToValueAtTime(0.2, 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, duration);
      
      bassOsc.start(0);
      bassOsc.stop(duration);
    }

    // Add a noise burst (like a cymbal crash or explosion) for big wins
    if (addNoise) {
      const noiseBuffer = this.createNoiseBuffer(duration, 1);
      const noiseSource = offlineCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      const noiseFilter = offlineCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 4000;
      
      const noiseGain = offlineCtx.createGain();
      noiseGain.gain.setValueAtTime(0, 0);
      noiseGain.gain.linearRampToValueAtTime(0.4, 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, duration * 0.8);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(offlineCtx.destination);
      
      noiseSource.start(0);
    }

    return offlineCtx.startRendering();
  }

  async createBgmBuffer() {
    const duration = 5.0; // 5 seconds loop
    const sampleRate = this.ctx!.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    
    // 1. Marimba/Steel Drum Chords (Relaxed)
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];

    for (let i = 0; i < 4; i++) {
      const startTime = i * 1.25;
      const chord = chords[i % 4];
      chord.forEach(freq => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    }

    // 3. Prominent Melody (Steel Drum / Kalimba style)
    const melody = [
      { time: 0.0, freq: 523.25 }, // C5
      { time: 0.5, freq: 659.25 }, // E5
      { time: 1.0, freq: 783.99 }, // G5
      { time: 1.25, freq: 523.25 }, // C5
      { time: 2.0, freq: 880.00 }, // A5
      { time: 2.5, freq: 783.99 }, // G5
      { time: 3.0, freq: 659.25 }, // E5
      { time: 3.75, freq: 587.33 }, // D5
      { time: 4.25, freq: 523.25 }, // C5
    ];

    melody.forEach(note => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      gain.gain.setValueAtTime(0, note.time);
      gain.gain.linearRampToValueAtTime(0.25, note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, note.time + 0.6);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(note.time);
      osc.stop(note.time + 0.6);
    });

    return offlineCtx.startRendering();
  }

  play(name: string, loop = false) {
    if (!this.soundEnabled || !this.ctx || !this.buffers[name]) return null;
    
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[name];
    
    const gain = this.ctx.createGain();
    
    const bgmVolume = 0.25; // Lower BGM so sound effects stand out
    const winVolume = 1.0; // Maximize win volume (perceptually much louder than BGM)
    
    if (name === 'bgm') {
      gain.gain.value = bgmVolume;
      this.bgmGainNode = gain;
    } else if (name.startsWith('win_')) {
      gain.gain.value = winVolume;
      if (name === 'win_big' || name === 'win_mega') {
        // Duck the BGM so the win sound stands out
        if (this.bgmGainNode) {
          this.bgmGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
          this.bgmGainNode.gain.setValueAtTime(0.02, this.ctx.currentTime); // Drop BGM volume
          this.bgmGainNode.gain.linearRampToValueAtTime(bgmVolume, this.ctx.currentTime + 1.5); // Fade back in after win sound
        }
      }
    } else {
      gain.gain.value = 0.6; // Default for spin, coin, etc.
    }
    
    source.connect(gain);
    gain.connect(this.ctx.destination);
    
    source.loop = loop;
    source.start(0);
    return source;
  }

  setBgm(enabled: boolean) {
    this.soundEnabled = enabled;
    if (enabled) {
      if (!this.bgmSource && this.isLoaded) {
        this.bgmSource = this.play('bgm', true);
      }
    } else {
      if (this.bgmSource) {
        this.bgmSource.stop();
        this.bgmSource = null;
      }
    }
  }

  startSpinSound() {
    if (!this.soundEnabled || !this.isLoaded || !this.ctx) return;
    if (this.spinSource) return;
    this.spinSource = this.play('spin_loop', true);
  }

  stopSpinSound() {
    if (this.spinSource) {
      this.spinSource.stop();
      this.spinSource = null;
    }
  }
}

export const soundManager = new SoundManager();

export const playSound = (type: 'spin' | 'spin_loop' | 'win_1x' | 'win_2x' | 'win_3x' | 'win_4x' | 'win_5x' | 'win_medium' | 'win_big' | 'win_mega' | 'coin', soundEnabled: boolean) => {
  soundManager.soundEnabled = soundEnabled;
  soundManager.play(type);
};

export const startSpinSound = (soundEnabled: boolean) => {
  soundManager.soundEnabled = soundEnabled;
  soundManager.startSpinSound();
};

export const stopSpinSound = () => {
  soundManager.stopSpinSound();
};
