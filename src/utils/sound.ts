class SoundManager {
  ctx: AudioContext | null = null;
  buffers: Record<string, AudioBuffer> = {};
  spinSource: AudioBufferSourceNode | null = null;
  spinGain: GainNode | null = null;
  isLoaded = false;
  isInitializing = false;
  soundEnabled = false;

  async preload() {
    if (this.isLoaded || this.isInitializing) return;
    this.isInitializing = true;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      this.isInitializing = false;
      return;
    }
    
    try {
      this.ctx = new AudioContextClass();
      await this.generateSounds();
      this.isLoaded = true;
    } catch (e) {
      console.error("Failed to preload sounds", e);
    } finally {
      this.isInitializing = false;
    }
  }

  async init() {
    if (!this.isLoaded) {
      if (!this.isInitializing) {
        await this.preload();
      } else {
        while (this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        // Unlock audio on iOS by playing a silent buffer immediately
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        await this.ctx.resume();
      } catch (e) {
        console.error("AudioContext resume failed", e);
      }
    }
    
    if (this.soundEnabled) {
      this.setBgm(true);
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.error("AudioContext resume failed", e);
      }
    }
  }

  async generateSounds() {
    if (!this.ctx) return;
    
    this.buffers['spin'] = this.createFreewheelBuffer(0.04, 0.15); // Quick single tick
    this.buffers['spin_loop'] = this.createFreewheelBuffer(0.04, 0.15); // Rapid 25Hz bike freewheel loop
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

  createFreewheelBuffer(totalDuration: number, volume: number) {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * totalDuration; 
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    // A single tick of a bike freewheel spanning the totalDuration
    for (let i = 0; i < length; i++) {
      // The tick itself is very short and metallic (~3ms)
      if (i < sampleRate * 0.003) {
        // Exponential decay for a crisp click
        const env = Math.exp(-i / (sampleRate * 0.0008));
        // Mix of high-pitch resonance (metallic) and a little noise
        const metallic = Math.sin(i * 0.9) * Math.sin(i * 0.4);
        const noise = Math.random() * 2 - 1;
        data[i] = (metallic * 0.6 + noise * 0.4) * env * volume;
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

  play(name: string, loop = false) {
    if (!this.soundEnabled || !this.ctx || !this.buffers[name]) return null;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("AudioContext resume failed in play", e));
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[name];
    
    const gain = this.ctx.createGain();
    
    const winVolume = 1.0; // Maximize win volume
    
    if (name.startsWith('win_')) {
      gain.gain.value = winVolume;
    } else if (name === 'spin_loop' || name === 'spin') {
      gain.gain.value = 0.16; // Increased by 100% for better audibility
    } else {
      gain.gain.value = 0.6; // Default for coin, etc.
    }
    
    source.connect(gain);
    gain.connect(this.ctx.destination);
    
    source.loop = loop;
    source.start(0);
    return { source, gain };
  }

  setBgm(enabled: boolean) {
    this.soundEnabled = enabled;
    // Background music has been removed as per user request.
    // We only manage the soundEnabled flag here to control other sound effects.
  }

  startSpinSound() {
    if (!this.soundEnabled || !this.isLoaded || !this.ctx) return;
    if (this.spinSource) return;
    const result = this.play('spin_loop', true);
    if (result) {
      this.spinSource = result.source;
      this.spinGain = result.gain;
    }
  }

  stopSpinSound() {
    if (this.spinSource && this.spinGain && this.ctx) {
      const source = this.spinSource;
      const gain = this.spinGain;
      
      // Fade out over 100ms to avoid clicking
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      
      setTimeout(() => {
        try {
          source.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      }, 150);
      
      this.spinSource = null;
      this.spinGain = null;
    } else if (this.spinSource) {
      this.spinSource.stop();
      this.spinSource = null;
    }
  }
}

export const soundManager = new SoundManager();

// Preload sounds immediately so they are ready when the user interacts
soundManager.preload().catch(console.error);

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
