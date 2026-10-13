'use strict';
// ===== 芯片音乐与音效（WebAudio 实时合成） =====
const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteMidi(n) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); if (!m) return 60; return NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (parseInt(m[3]) + 1); }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORD_T = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], sus: [0, 5, 7], dim: [0, 3, 6] };
function parseChord(s) { const m = /^([A-G])([#b]?)(.*)$/.exec(s); return { root: NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), tones: CHORD_T[m[3]] || CHORD_T[''] }; }

// 乐曲：宫商角徵羽五声音阶为主
const SONGS = {
  title: { bpm: 76, style: 'calm', lead: 'pulse25', loop: true,
    mel: 'E5:4 G5:4 A5:6 G5:2 E5:4 D5:4 C5:8 D5:4 E5:4 G5:4 A5:4 G5:12 -:4 A5:4 C6:4 D6:6 C6:2 A5:4 G5:4 E5:8 D5:4 E5:2 G5:2 E5:4 D5:4 C5:12 -:4',
    ch: 'C:16 Am:16 F:16 C:16 F:16 C:16 G:16 C:16' },
  town: { bpm: 112, style: 'walk', lead: 'square', loop: true,
    mel: 'G5:2 A5:2 C6:2 A5:2 G5:4 E5:4 D5:2 E5:2 G5:2 E5:2 D5:4 C5:4 E5:2 G5:2 A5:4 C6:2 A5:2 G5:4 A5:2 G5:2 E5:2 D5:2 E5:8 G5:2 A5:2 C6:2 D6:2 E6:4 D6:4 C6:2 A5:2 G5:2 A5:2 C6:8 A5:2 G5:2 E5:2 G5:2 D5:4 E5:4 C5:8 -:8',
    ch: 'C:16 G:16 Am:16 Em:16 C:16 F:16 G:16 C:16' },
  field: { bpm: 120, style: 'walk', lead: 'pulse25', loop: true,
    mel: 'C5:4 G5:4 E5:2 G5:2 A5:4 G5:4 E5:2 D5:2 C5:8 D5:4 A5:4 G5:2 A5:2 C6:4 A5:4 G5:2 E5:2 D5:8 E5:2 G5:2 A5:2 C6:2 D6:4 C6:4 A5:2 C6:2 A5:2 G5:2 E5:8 D5:2 E5:2 G5:2 A5:2 G5:4 E5:2 D5:2 C5:12 -:4',
    ch: 'C:16 Am:16 Dm:16 G:16 Am:16 F:16 G:16 C:16' },
  dungeon: { bpm: 88, style: 'eerie', lead: 'pulse25', loop: true,
    mel: 'A4:6 C5:2 E5:4 D5:4 C5:8 A4:8 E5:6 G5:2 E5:4 D5:4 E5:16 A5:6 G5:2 E5:4 D5:4 C5:4 D5:4 E5:8 D5:6 C5:2 A4:4 G4:4 A4:16',
    ch: 'Am:16 Am:16 Em:16 Em:16 F:16 C:16 Dm:16 Am:16' },
  sad: { bpm: 68, style: 'calm', lead: 'triangle', loop: true,
    mel: 'E5:6 D5:2 C5:4 A4:4 C5:6 D5:2 E5:8 G5:6 E5:2 D5:4 C5:4 D5:16 E5:6 G5:2 A5:4 G5:4 E5:4 D5:4 C5:8 D5:4 C5:4 A4:4 G4:4 A4:16',
    ch: 'Am:16 Am:16 C:16 G:16 Am:16 F:16 Dm:16 Am:16' },
  dream: { bpm: 84, style: 'calm', lead: 'pulse12', loop: true,
    mel: 'C6:4 G5:4 E5:4 G5:4 D6:4 A5:4 F#5:4 A5:4 E6:4 C6:4 G5:4 C6:4 B5:16 A5:4 C6:4 E6:4 D6:4 C6:4 A5:4 F#5:8 G5:4 A5:4 B5:4 D6:4 C6:16',
    ch: 'C:16 D:16 C:16 G:16 Am:16 D:16 G:16 C:16' },
  sea: { bpm: 100, style: 'walk', lead: 'pulse25', loop: true,
    mel: 'A4:2 C5:2 E5:2 A5:2 G5:4 E5:4 D5:2 E5:2 G5:2 A5:2 E5:8 C5:2 E5:2 G5:2 C6:2 A5:4 G5:4 E5:2 G5:2 A5:2 G5:2 D5:8 A4:2 C5:2 E5:2 A5:2 C6:4 D6:4 E6:4 D6:2 C6:2 A5:8 G5:2 A5:2 C6:2 A5:2 G5:2 E5:2 D5:4 E5:16',
    ch: 'Am:16 Em:16 C:16 G:16 Am:16 F:16 G:16 Am:16' },
  ending: { bpm: 92, style: 'walk', lead: 'pulse25', loop: true,
    mel: 'E5:4 G5:4 A5:6 G5:2 E5:4 D5:4 C5:8 D5:4 E5:4 G5:4 A5:4 G5:12 -:4 A5:4 C6:4 D6:6 C6:2 A5:4 G5:4 E5:8 D5:4 E5:2 G5:2 E5:4 D5:4 C5:12 -:4',
    ch: 'C:16 Am:16 F:16 C:16 F:16 C:16 G:16 C:16' },
};

function compileSong(s) {
  const ev = []; let t = 0;
  for (const tok of s.mel.trim().split(/\s+/)) { const [n, d] = tok.split(':'); const len = +d; if (n !== '-') ev.push({ t, len, f: mtof(noteMidi(n)), ch: 'lead' }); t += len; }
  const total = t;
  const chords = s.ch.trim().split(/\s+/).map(tok => { const [c, d] = tok.split(':'); return { c: parseChord(c), len: +d }; });
  let ct = 0, ci = 0;
  while (ct < total) { const { c, len } = chords[ci % chords.length]; ci++; accomp(ev, s.style, c, ct, Math.min(len, total - ct)); ct += len; }
  for (let b = 0; b < total; b += 16) drums(ev, s.style, b, Math.min(16, total - b), b + 16 >= total);
  ev.sort((a, b) => a.t - b.t);
  return { ev, total, step: 60 / s.bpm / 4, loop: s.loop !== false, s };
}
function accomp(ev, style, c, t0, len) {
  const r = c.root, T = c.tones;
  const bass = semi => mtof(36 + r + semi);
  const tone = (i, oct) => mtof(12 * (oct + 1) + r + T[i % T.length] + 12 * Math.floor(i / T.length));
  const push = (dt, l, f, ch) => { if (dt < len) ev.push({ t: t0 + dt, len: Math.min(l, len - dt), f, ch }); };
  if (style === 'calm') {
    for (let s = 0; s < len; s += 8) push(s, 8, bass(s % 16 ? 7 : 0), 'bass');
    for (let s = 0; s < len; s += 4) push(s, 4, tone([0, 1, 2, 1][(s / 4) % 4], 4), 'arp');
  } else if (style === 'walk') {
    const pat = [0, 7, 12, 7];
    for (let s = 0; s < len; s += 4) push(s, 3, bass(pat[(s / 4) % 4]), 'bass');
    for (let s = 0; s < len; s += 2) push(s, 2, tone([0, 1, 2, 1][(s / 2) % 4], 4), 'arp');
  } else if (style === 'drive') {
    for (let s = 0; s < len; s += 2) push(s, 2, bass((s / 2) % 2 ? 12 : 0), 'bass');
    for (let s = 0; s < len; s++) push(s, 1, tone([0, 1, 2, 3][s % 4], 4), 'arp');
  } else if (style === 'march') {
    const pat = [0, 0, 7, 0, 12, 0, 7, 10];
    for (let s = 0; s < len; s += 2) push(s, 2, bass(pat[(s / 2) % 8]), 'bass');
    for (const s of [4, 12]) for (let i = 0; i < 3; i++) push(s, 2, tone(i, 4), 'pad');
  } else if (style === 'eerie') {
    push(0, len, bass(0), 'bass');
    for (let s = 2; s < len; s += 6) push(s, 3, tone((s * 7) % 3 + 3, 4), 'arp');
  }
}
function drums(ev, style, b, len, last) {
  const P = {
    walk: { kick: [0, 8], snare: [], hat: [4, 12] },
    drive: { kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    march: { kick: [0, 3, 8, 11], snare: last ? [4, 10, 12, 13, 14, 15] : [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    eerie: { kick: [0], snare: [], hat: [10] },
    calm: { kick: [], snare: [], hat: [] }
  }[style] || { kick: [], snare: [], hat: [] };
  for (const k of ['kick', 'snare', 'hat']) for (const s of P[k]) if (s < len) ev.push({ t: b + s, len: 1, ch: k });
}

const Snd = {
  ac: null, mg: null, sg: null, cur: null, curName: null, waves: {}, noiseBuf: null, timer: null, pending: null,
  unlock() {
    if (!this.ac) {
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const ac = this.ac;
      this.mg = ac.createGain(); this.mg.connect(ac.destination);
      this.sg = ac.createGain(); this.sg.connect(ac.destination);
      this.applyVol();
      for (const [k, d] of [['square', 0.5], ['pulse25', 0.25], ['pulse12', 0.125]]) {
        const n = 40, re = new Float32Array(n), im = new Float32Array(n);
        for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * d);
        this.waves[k] = ac.createPeriodicWave(re, im);
      }
      const len = ac.sampleRate; this.noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const dd = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) dd[i] = Math.random() * 2 - 1;
      this.timer = setInterval(() => this.tick(), 40);
      if (this.pending) { const p = this.pending; this.pending = null; this.curName = null; this.play(p); }
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  applyVol() { if (!this.ac) return; this.mg.gain.value = Settings.music / 10 * 0.8; this.sg.gain.value = Settings.sfx / 10 * 0.9; },
  osc(f, t, dur, wave, vol, dest, o = {}) {
    const ac = this.ac, os = ac.createOscillator();
    if (this.waves[wave]) os.setPeriodicWave(this.waves[wave]); else os.type = wave;
    os.frequency.setValueAtTime(f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
    if (o.vib && dur > 0.25) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + 0.25); l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setTargetAtTime(vol * (o.sus ?? 0.55), t + 0.02, Math.max(0.02, dur * 0.35));
    g.gain.setTargetAtTime(0, t + dur * 0.9, 0.02);
    os.connect(g); g.connect(dest); os.start(t); os.stop(t + dur + 0.2);
  },
  noise(t, dur, freq, vol, type = 'lowpass', dest = this.sg, f2) {
    const ac = this.ac, src = ac.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(dest); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },
  play(name) {
    if (this.curName === name) return;
    this.curName = name;
    if (!this.ac) { this.pending = name; return; }
    const s = SONGS[name]; if (!s) { this.cur = null; return; }
    if (!s._c) s._c = compileSong(s);
    this.cur = { song: s._c, idx: 0, base: this.ac.currentTime + 0.08 };
  },
  stop() { this.cur = null; this.curName = null; this.pending = null; },
  tick() {
    const c = this.cur; if (!c || !this.ac) return;
    const now = this.ac.currentTime, S = c.song;
    for (let guard = 0; guard < 400; guard++) {
      const e = S.ev[c.idx];
      if (!e) { if (S.loop) { c.base += S.total * S.step; c.idx = 0; continue; } this.cur = null; return; }
      const t = c.base + e.t * S.step;
      if (t > now + 0.3) break;
      if (t >= now - 0.05) this.playEv(e, t, S);
      c.idx++;
    }
  },
  playEv(e, t, S) {
    const d = e.len * S.step, mg = this.mg, st = S.s;
    switch (e.ch) {
      case 'lead': this.osc(e.f, t, d * 0.95, st.lead || 'square', st.lead === 'triangle' ? 0.22 : 0.085, mg, { vib: true, sus: 0.7 }); break;
      case 'bass': this.osc(e.f, t, d * 0.9, 'triangle', 0.24, mg, { sus: 0.8 }); break;
      case 'arp': this.osc(e.f, t, Math.min(d, 0.18) * 0.9, 'pulse12', 0.035, mg, { sus: 0.3 }); break;
      case 'pad': this.osc(e.f, t, d * 0.8, 'pulse25', 0.03, mg, { sus: 0.4 }); break;
      case 'kick': this.osc(150, t, 0.13, 'sine', 0.45, mg, { f2: 45, sus: 0.2 }); break;
      case 'snare': this.noise(t, 0.12, 1800, 0.18, 'bandpass', mg); this.osc(190, t, 0.06, 'triangle', 0.1, mg); break;
      case 'hat': this.noise(t, 0.035, 7000, 0.06, 'highpass', mg); break;
    }
  },
  sfx(n) {
    if (!this.ac || Settings.sfx <= 0) return;
    const t = this.ac.currentTime + 0.005, d = this.sg;
    const N = (f, s, len, w = 'square', v = 0.12, o) => this.osc(f, t + s, len, w, v, d, o);
    const Z = (s, len, f, v, type, f2) => this.noise(t + s, len, f, v, type, d, f2);
    switch (n) {
      case 'cursor': N(1320, 0, 0.035, 'pulse25', 0.08); break;
      case 'blip': N(900, 0, 0.02, 'pulse12', 0.03); break;
      case 'confirm': N(988, 0, 0.05); N(1319, 0.05, 0.08); break;
      case 'cancel': N(660, 0, 0.05); N(440, 0.05, 0.08); break;
      case 'buzz': N(110, 0, 0.18, 'square', 0.12); break;
      case 'hit': Z(0, 0.12, 2400, 0.4, 'bandpass'); N(220, 0, 0.08, 'square', 0.12, { f2: 80 }); break;
      case 'crit': Z(0, 0.2, 3000, 0.5, 'bandpass'); N(880, 0, 0.05); N(440, 0.04, 0.15, 'square', 0.15, { f2: 60 }); break;
      case 'hurt': Z(0, 0.18, 900, 0.45, 'lowpass'); N(160, 0, 0.15, 'square', 0.14, { f2: 50 }); break;
      case 'miss': Z(0, 0.12, 5000, 0.15, 'highpass', 1500); break;
      case 'magic': [0, 4, 7, 12].forEach((s, i) => N(mtof(72 + s), i * 0.04, 0.08, 'pulse25', 0.08)); break;
      case 'fire': Z(0, 0.5, 600, 0.45, 'lowpass', 3000); Z(0.1, 0.4, 1200, 0.25, 'bandpass', 300); break;
      case 'ice': [0, 0.06, 0.12, 0.2].forEach((s, i) => N(2000 + i * 400, s, 0.12, 'triangle', 0.1)); Z(0, 0.3, 6000, 0.12, 'highpass'); break;
      case 'thunder': Z(0, 0.6, 3000, 0.6, 'lowpass', 100); N(80, 0, 0.4, 'sawtooth', 0.15, { f2: 30 }); break;
      case 'wind': Z(0, 0.6, 400, 0.35, 'bandpass', 2400); Z(0.2, 0.5, 2000, 0.2, 'bandpass', 500); break;
      case 'earth': Z(0, 0.7, 300, 0.6, 'lowpass', 60); N(60, 0, 0.5, 'triangle', 0.35, { f2: 30 }); break;
      case 'holy': [0, 4, 7, 11, 14].forEach((s, i) => N(mtof(76 + s), i * 0.05, 0.4, 'triangle', 0.1)); break;
      case 'sound': [0, 0.1, 0.2].forEach(s => N(660, s, 0.2, 'pulse25', 0.09, { f2: 990 })); break;
      case 'dark': N(220, 0, 0.5, 'sawtooth', 0.1, { f2: 55 }); Z(0, 0.5, 500, 0.2, 'lowpass', 100); break;
      case 'water': Z(0, 0.4, 1500, 0.3, 'bandpass', 400); N(400, 0, 0.2, 'sine', 0.15, { f2: 900 }); break;
      case 'poison': [0, 0.08, 0.16].forEach((s, i) => N(300 + i * 120, s, 0.08, 'sine', 0.15, { f2: 600 })); break;
      case 'heal': [0, 4, 7, 12, 16].forEach((s, i) => N(mtof(72 + s), i * 0.06, 0.15, 'triangle', 0.14)); break;
      case 'buff': N(440, 0, 0.3, 'pulse25', 0.1, { f2: 1320 }); break;
      case 'debuff': N(880, 0, 0.3, 'pulse25', 0.1, { f2: 220 }); break;
      case 'death': Z(0, 0.4, 2000, 0.35, 'lowpass', 200); N(600, 0, 0.3, 'square', 0.1, { f2: 60 }); break;
      case 'encounter': for (let i = 0; i < 8; i++) N(i % 2 ? 1200 : 800, i * 0.04, 0.04, 'square', 0.1); break;
      case 'escape': [0, 0.06, 0.12, 0.18].forEach((s, i) => N(900 - i * 150, s, 0.06, 'pulse25', 0.1)); break;
      case 'levelup': [[72, 0], [76, 0.1], [79, 0.2], [84, 0.3], [79, 0.45], [84, 0.55]].forEach(([m, s]) => N(mtof(m), s, 0.12, 'square', 0.12)); break;
      case 'join': [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36], [84, 0.5]].forEach(([m, s]) => N(mtof(m), s, s > 0.4 ? 0.5 : 0.12, 'square', 0.12)); break;
      case 'chest': N(1046, 0, 0.08); N(1568, 0.08, 0.2); break;
      case 'door': N(180, 0, 0.08, 'square', 0.15); N(120, 0.08, 0.1, 'square', 0.15); break;
      case 'stairs': [0, 0.08, 0.16, 0.24].forEach((s, i) => N(500 - i * 60, s, 0.05, 'square', 0.1)); break;
      case 'save': [[72, 0], [76, 0.08], [79, 0.16], [84, 0.24]].forEach(([m, s]) => N(mtof(m), s, 0.3, 'triangle', 0.15)); break;
      case 'coin': N(1976, 0, 0.05, 'square', 0.08); N(2637, 0.05, 0.15, 'square', 0.08); break;
      case 'gate': Z(0, 0.8, 200, 0.5, 'lowpass', 50); [[79, 0.5], [84, 0.6], [88, 0.7]].forEach(([m, s]) => N(mtof(m), s, 0.3, 'triangle', 0.14)); break;
      case 'bump': N(90, 0, 0.06, 'square', 0.08); break;
      case 'inn': [[72, 0], [76, 0.25], [79, 0.5], [77, 0.75], [76, 1.0], [72, 1.25]].forEach(([m, s]) => N(mtof(m), s, 0.3, 'triangle', 0.18)); break;
    }
  }
};
['pointerdown', 'touchstart'].forEach(ev => addEventListener(ev, () => Snd.unlock(), { passive: true }));
