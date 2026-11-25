/* Atlas Quest — synthesized sounds (Web Audio). Muted until the traveller opts in. */
(function () {
  'use strict';
  var ctx = null, master = null, enabled = false, noiseBuf = null;
  try { enabled = localStorage.getItem('atlasquest.sound') === 'on'; } catch (e) { enabled = false; }

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended' && ctx.resume) ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0), i;
      for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }
  function tone(freq, start, dur, type, vol, glideTo) {
    var c = ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(start, dur, vol, fType, f1, f2) {
    var c = ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + start;
    s.buffer = noiseBuf; f.type = fType || 'lowpass'; f.frequency.setValueAtTime(f1 || 800, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  var SOUNDS = {
    click: function () { tone(660, 0, 0.06, 'triangle', 0.08); },
    correct: function () { tone(784, 0, 0.18, 'triangle', 0.18); tone(1175, 0.09, 0.32, 'sine', 0.16); },
    wrong: function () { tone(196, 0, 0.28, 'sawtooth', 0.06, 150); tone(147, 0.05, 0.3, 'sine', 0.12); },
    stamp: function () { noise(0, 0.12, 0.5, 'lowpass', 600, 120); tone(90, 0, 0.22, 'sine', 0.35, 50); },
    page: function () { noise(0, 0.35, 0.12, 'bandpass', 3000, 900); },
    tick: function () { tone(1800, 0, 0.025, 'square', 0.03); },
    fanfare: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.4, 'triangle', 0.14); }); tone(1319, 0.48, 0.7, 'sine', 0.1); },
    horn: function () { tone(220, 0, 0.9, 'sawtooth', 0.05, 210); tone(277, 0, 0.9, 'sawtooth', 0.04, 262); },
    splash: function () { noise(0, 0.6, 0.25, 'lowpass', 2400, 200); tone(120, 0.05, 0.5, 'sine', 0.15, 60); }
  };

  window.AQ = window.AQ || {};
  window.AQ.audio = {
    isOn: function () { return enabled; },
    set: function (on) {
      enabled = !!on;
      try { localStorage.setItem('atlasquest.sound', enabled ? 'on' : 'off'); } catch (e) { /* private mode */ }
      if (enabled) { ensure(); }
    },
    unlock: function () { if (enabled) ensure(); },
    play: function (name) {
      if (!enabled || !SOUNDS[name]) return;
      if (!ensure()) return;
      try { SOUNDS[name](); } catch (e) { /* never let sound break the game */ }
    }
  };
})();
