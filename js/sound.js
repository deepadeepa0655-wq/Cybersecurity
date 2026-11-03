// Cyber Shield Web Audio API Synthesizer (Zero External Dependencies)
const Sound = (function() {
  let ctx = null;
  let sfxEnabled = true;
  let musicEnabled = true;
  let bgGain = null;
  let bgOscs = [];
  let isPlayingMusic = false;
  let lastHoverAt = 0;

  function initCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
    if (!sfxEnabled) return;
    try {
      initCtx();
      if (!ctx) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    } catch (e) {
      // AudioContext policy fallback
    }
  }

  return {
    init: initCtx,
    click: () => playTone(680, 0.05, 'triangle', 0.08),
    hover: () => {
      const now = Date.now();
      if (now - lastHoverAt < 90) return;
      lastHoverAt = now;
      playTone(740, 0.035, 'sine', 0.035);
    },
    select: () => {
      playTone(392, 0.09, 'triangle', 0.09, 0);
      playTone(587.33, 0.12, 'sine', 0.08, 0.07);
      playTone(783.99, 0.16, 'sine', 0.07, 0.15);
    },
    scan: () => {
      if (!sfxEnabled) return;
      initCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    },
    good: () => {
      playTone(523.25, 0.1, 'sine', 0.12, 0);
      playTone(659.25, 0.15, 'sine', 0.14, 0.08);
      playTone(783.99, 0.22, 'sine', 0.15, 0.16);
    },
    bad: () => {
      playTone(220, 0.15, 'sawtooth', 0.18, 0);
      playTone(164.81, 0.25, 'sawtooth', 0.2, 0.1);
    },
    alarm: () => {
      playTone(880, 0.12, 'square', 0.15, 0);
      playTone(660, 0.12, 'square', 0.15, 0.14);
      playTone(880, 0.12, 'square', 0.15, 0.28);
    },
    jump: () => {
      if (!sfxEnabled) return;
      initCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    },
    win: () => {
      playTone(440, 0.12, 'triangle', 0.15, 0);
      playTone(554.37, 0.12, 'triangle', 0.15, 0.1);
      playTone(659.25, 0.14, 'triangle', 0.16, 0.2);
      playTone(880, 0.45, 'triangle', 0.2, 0.32);
    },
    lose: () => {
      playTone(330, 0.18, 'sawtooth', 0.18, 0);
      playTone(277.18, 0.2, 'sawtooth', 0.18, 0.15);
      playTone(220, 0.35, 'sawtooth', 0.2, 0.32);
    },
    startMusic: function() {
      if (!musicEnabled || isPlayingMusic) return;
      try {
        initCtx();
        if (!ctx) return;
        this.stopMusic();
        bgGain = ctx.createGain();
        bgGain.gain.setValueAtTime(0.035, ctx.currentTime);
        bgGain.connect(ctx.destination);
        // Atmospheric cyberpunk synth drone chords (F# minor & C# ambient)
        const notes = [92.50, 138.59, 185.00, 277.18];
        bgOscs = notes.map(freq => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(bgGain);
          osc.start();
          return osc;
        });
        isPlayingMusic = true;
      } catch (e) {}
    },
    stopMusic: function() {
      bgOscs.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      bgOscs = [];
      isPlayingMusic = false;
    },
    toggleSfx: function() {
      sfxEnabled = !sfxEnabled;
      return sfxEnabled;
    },
    toggleMusic: function() {
      musicEnabled = !musicEnabled;
      if (musicEnabled) this.startMusic();
      else this.stopMusic();
      return musicEnabled;
    },
    isSfxOn: () => sfxEnabled,
    isMusicOn: () => musicEnabled
  };
})();

window.Sound = Sound;
