// js/audio.js - Procedural Web Audio API sound generator & synth music

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('stickman_muted') === 'true';
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('stickman_muted', this.muted);
    if (this.muted) {
      this.stopBGM();
    } else {
      this.init();
      this.startBGM();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Hook snap / latch sound
  playHook() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Hook release / air whip
  playRelease() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Trampoline bounce / spring sound
  playBounce() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Speed boost ring pass
  playBoost() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.18, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.16);
    });
  }

  // Crash / hazard death sound
  playCrash() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    // Noise buffer for hit crunch
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.26);

    // Sub-bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    subGain.gain.setValueAtTime(0.3, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(t);
    sub.stop(t + 0.22);
  }

  // Victory fanfare
  playWin() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.14 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];

    let offset = 0;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + offset);

      gain.gain.setValueAtTime(0.28, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + offset);
      osc.stop(t + offset + note.d);

      offset += note.d * 0.8;
    });
  }

  // Upbeat synth rhythm background loop
  startBGM() {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // 124 BPM -> 16th note ~ 121ms
    const interval = 125;
    const bassline = [
      130.81, 0, 130.81, 164.81, 174.61, 0, 174.61, 196.00,
      130.81, 130.81, 164.81, 0, 196.00, 220.00, 196.00, 164.81
    ];

    const leadline = [
      0, 261.63, 0, 329.63, 0, 392.00, 0, 329.63,
      0, 261.63, 329.63, 0, 392.00, 0, 523.25, 0
    ];

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.muted) return;
      const t = this.ctx.currentTime;
      const step = this.bgmStep % bassline.length;

      // Bass note
      const bFreq = bassline[step];
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bFreq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        bGain.gain.setValueAtTime(0.07, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        bOsc.connect(filter);
        filter.connect(bGain);
        bGain.connect(this.ctx.destination);

        bOsc.start(t);
        bOsc.stop(t + 0.15);
      }

      // Melody note
      const lFreq = leadline[step];
      if (lFreq > 0) {
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'sine';
        lOsc.frequency.setValueAtTime(lFreq, t);

        lGain.gain.setValueAtTime(0.04, t);
        lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        lOsc.connect(lGain);
        lGain.connect(this.ctx.destination);

        lOsc.start(t);
        lOsc.stop(t + 0.17);
      }

      // Kick drum every 4 steps
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        kickGain.gain.setValueAtTime(0.12, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);

        kickOsc.start(t);
        kickOsc.stop(t + 0.11);
      }

      // Hi-hat on offbeats
      if (step % 2 === 1) {
        const hatBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
        const data = hatBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const hat = this.ctx.createBufferSource();
        hat.buffer = hatBuf;

        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7000, t);

        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.02, t);
        hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.ctx.destination);

        hat.start(t);
        hat.stop(t + 0.04);
      }

      this.bgmStep++;
    }, interval);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const audio = new SoundManager();
