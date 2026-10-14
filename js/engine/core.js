'use strict';
// ===== 画布与基础工具 =====
const W = 768, H = 576, TS = 48;
const cv = document.getElementById('cv');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC","WenQuanYi Micro Hei",sans-serif';
const SERIF = '"Ma Shan Zheng","STKaiti","KaiTi","Kaiti SC","Songti SC","STSong","Noto Serif CJK SC",serif';

function mkRng(seed) { let a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wait = ms => sleep(Input.down.a || Input.down.b ? ms * 0.35 : ms);
function shuffle(a, r = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } return null; }

const Settings = { music: 6, sfx: 7, textSpeed: 22, pinyin: true };
try { Object.assign(Settings, JSON.parse(store('hrpg_settings') || '{}')); } catch (e) { }
function saveSettings() { store('hrpg_settings', JSON.stringify(Settings)); }

// ===== 输入 =====
const Input = {
  down: {}, hit: {}, rep: {}, hold: {},
  keymap: { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right', KeyZ: 'a', KeyJ: 'a', Enter: 'a', Space: 'a', NumpadEnter: 'a', KeyX: 'b', KeyK: 'b', Escape: 'b', Backspace: 'b', KeyM: 'b' },
  press(b) { if (!this.down[b]) { this.down[b] = true; this.hit[b] = true; this.hold[b] = 0; } },
  release(b) { this.down[b] = false; },
  update(dt) {
    for (const b of ['up', 'down', 'left', 'right']) {
      if (!this.down[b]) continue;
      const h0 = this.hold[b], h = (this.hold[b] = h0 + dt);
      if (h > 320 && Math.floor((h - 320) / 75) > Math.floor((h0 - 320) / 75)) this.rep[b] = true;
    }
  },
  tap(b) { if (this.hit[b] || this.rep[b]) { this.hit[b] = false; this.rep[b] = false; return true; } return false; },
  endFrame() { this.hit = {}; this.rep = {}; },
  dir() { for (const d of ['up', 'down', 'left', 'right']) if (this.down[d]) return d; return null; },
  releaseAll() { this.down = {}; }
};
addEventListener('keydown', e => {
  const b = Input.keymap[e.code];
  if (typeof Snd !== 'undefined') Snd.unlock();
  if (!b) return;
  e.preventDefault();
  if (!e.repeat) Input.press(b);
});
addEventListener('keyup', e => { const b = Input.keymap[e.code]; if (b) Input.release(b); });
addEventListener('blur', () => Input.releaseAll());

// ===== 绘制工具 =====
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawWin(x, y, w, h, hl) {
  ctx.save();
  rr(x, y, w, h, 8); ctx.fillStyle = 'rgba(12,16,46,0.94)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = hl ? '#ffe08a' : '#efe6d0'; rr(x + 3, y + 3, w - 6, h - 6, 6); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(206,164,72,0.75)'; rr(x + 8, y + 8, w - 16, h - 16, 4); ctx.stroke();
  ctx.restore();
}
function txt(s, x, y, o = {}) {
  ctx.font = `${o.b ? 'bold ' : ''}${o.size || 20}px ${o.font || FONT}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(s, x + 2, y + 2); }
  ctx.fillStyle = o.color || '#f4ecd8'; ctx.fillText(s, x, y);
  if (o.ruby !== false && Settings.pinyin) drawRuby(String(s), x, y, o);
}

// ===== 拼音注音 =====
// 剧本提供 PINYIN：{ 词: '拼 音' }。每一行里，同一个词只在第一次出现时注音
let RUBY = null;
function rubyDict() {
  if (RUBY) return RUBY;
  const d = typeof PINYIN !== 'undefined' ? PINYIN : {};
  RUBY = Object.keys(d).sort((a, b) => b.length - a.length);
  for (const w of RUBY) if (d[w].trim().split(/\s+/).length !== [...w].length) console.error('拼音音节数和字数对不上', w, d[w]);
  return RUBY;
}
const rubyCache = new Map();
function rubyOf(s) { // 返回 [[起点, 字数, 拼音], ...]
  let r = rubyCache.get(s); if (r) return r;
  r = []; const taken = [];
  for (const w of rubyDict()) {
    const i = s.indexOf(w); if (i < 0) continue;
    let free = true; for (let k = i; k < i + w.length; k++) if (taken[k]) free = false;
    if (!free) continue;
    for (let k = i; k < i + w.length; k++) taken[k] = true;
    r.push([i, w.length, PINYIN[w]]);
  }
  if (rubyCache.size > 3000) rubyCache.clear();
  rubyCache.set(s, r); return r;
}
// 在 txt 画好的一行字上方标拼音（用当前字体量位置）
function drawRuby(s, x, y, o) {
  const marks = rubyOf(s); if (!marks.length) return;
  const size = o.size || 20, ps = Math.max(10, Math.round(size * 0.55));
  const tw = ctx.measureText(s).width, x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
  // 首尾相连的两个注音词（如「大宛列传」），拼音都只许占自己那几个字的宽度
  const sorted = marks.slice().sort((a, b) => a[0] - b[0]);
  const tight = sorted.map((m, k) => (k > 0 && sorted[k - 1][0] + sorted[k - 1][1] === m[0]) || (k < sorted.length - 1 && m[0] + m[1] === sorted[k + 1][0]));
  const pos = sorted.map(([i, n, py], k) => [x0 + ctx.measureText(s.slice(0, i)).width, ctx.measureText(s.slice(i, i + n)).width, py, tight[k]]);
  const font = ctx.font, base = ctx.textBaseline, al = ctx.textAlign;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  for (const [ox, ww, py, isTight] of pos) {
    let f = ps; ctx.font = `${f}px ${FONT}`;
    const cx = ox + ww / 2, lim = isTight ? ww - 2 : ww * 1.35;
    while (f > 7 && ctx.measureText(py).width > lim) ctx.font = `${--f}px ${FONT}`;
    const by = y + (o.rubyGap ?? 0);
    if (o.rubyBg) { const pw = ctx.measureText(py).width; ctx.fillStyle = o.rubyBg; ctx.fillRect(cx - pw / 2 - 4, by - f - 3, pw + 8, f + 4); }
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(py, cx + 1, by + 1); }
    ctx.fillStyle = o.rubyColor || o.color || '#f4ecd8'; ctx.fillText(py, cx, by);
  }
  ctx.font = font; ctx.textBaseline = base; ctx.textAlign = al;
}
const NO_HEAD = '，。！？、；：”’）》」』…—~～,.!?;:)';
function wrap(s, maxW, size) {
  ctx.font = `${size}px ${FONT}`;
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (let i = 0; i < para.length;) {
      const w = rubyDict().find(w => para.startsWith(w, i)), ch = w || para[i];
      i += ch.length;
      const t = line + ch;
      if (ctx.measureText(t).width > maxW && line && !NO_HEAD.includes(ch[0])) { out.push(line); line = ch; }
      else line = t;
    }
    out.push(line);
  }
  return out;
}
function bar(x, y, w, h, v, max, col) {
  ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * clamp(v / max, 0, 1)), h - 2);
}

// ===== UI 栈 =====
const UI = {
  stack: [],
  push(w) { this.stack.push(w); return w.done; },
  remove(w) { const i = this.stack.indexOf(w); if (i >= 0) this.stack.splice(i, 1); },
  top() { for (let i = this.stack.length - 1; i >= 0; i--) if (!this.stack[i].passive) return this.stack[i]; return null; },
  busy() { return !!this.top(); },
  update(dt) { for (const w of this.stack.slice()) if (w.tick) w.tick(dt); const t = this.top(); if (t && t.update) t.update(dt); },
  draw() { for (const w of this.stack) w.draw(); }
};
class Widget { constructor() { this.done = new Promise(r => this._r = r); } close(v) { UI.remove(this); this._r(v); } draw() { } }
class Panel extends Widget { constructor(fn) { super(); this.passive = true; this.fn = fn; } draw() { this.fn(); } }

let portraitOf = null; // story.js 设置
class MsgBox extends Widget {
  constructor(sp, text, o = {}) {
    super(); this.sp = sp; this.o = o;
    this.port = sp && portraitOf ? portraitOf(sp) : null;
    const tw = W - 100 - (this.port ? 112 : 0);
    const lines = wrap(text, tw, 22);
    this.pages = []; for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    this.pi = 0; this.ci = 0; this.t = 0; this.passive = !!o.passive;
    if (this.passive) this.ci = 9999;
    this.y = o.top ? 44 : H - 174;
  }
  pageLen() { return this.pages[this.pi].reduce((s, l) => s + l.length, 0); }
  update(dt) {
    this.t += dt;
    const len = this.pageLen();
    if (this.ci < len) {
      const b = Math.floor(this.ci);
      this.ci += dt / Settings.textSpeed;
      if (Math.floor(this.ci) !== b && b % 3 === 0) Snd.sfx('blip');
      if (Input.tap('a') || Input.tap('b')) this.ci = len;
      return;
    }
    if (Input.tap('a') || Input.tap('b')) {
      if (this.pi < this.pages.length - 1) { this.pi++; this.ci = 0; Snd.sfx('cursor'); }
      else this.close();
    }
  }
  draw() {
    const x = 16, y = this.y, w = W - 32, h = 156;
    drawWin(x, y, w, h);
    if (this.sp) {
      ctx.font = `bold 20px ${FONT}`;
      const nw = ctx.measureText(this.sp).width + 40;
      if (Settings.pinyin && rubyOf(this.sp).length) { drawWin(x + 14, y - 50, nw, 58, true); txt(this.sp, x + 34, y - 25, { color: '#ffd870', b: true }); }
      else { drawWin(x + 14, y - 36, nw, 44, true); txt(this.sp, x + 34, y - 23, { color: '#ffd870', b: true }); }
    }
    let tx = x + 32;
    if (this.port) { ctx.drawImage(this.port, x + 22, y + 28, 96, 96); tx += 112; }
    let rem = Math.floor(this.ci);
    this.pages[this.pi].forEach((ln, i) => { const s = ln.slice(0, Math.max(0, rem)); rem -= ln.length; txt(s, tx, y + 28 + i * 38, { size: 22 }); });
    if (!this.passive && this.ci >= this.pageLen() && Math.floor(this.t / 300) % 2) txt('▼', x + w - 42, y + h - 38, { color: '#ffd870', size: 18 });
  }
}
async function say(sp, text, o) {
  if (Array.isArray(text)) { for (const t of text) await say(sp, t, o); return; }
  await UI.push(new MsgBox(sp, text, o));
}
const narr = (t, o) => say(null, t, o);

class Menu extends Widget {
  constructor(items, o = {}) {
    super();
    this.items = items.map(it => typeof it === 'string' ? { label: it } : it);
    this.o = o; this.i = clamp(o.start || 0, 0, Math.max(0, this.items.length - 1));
    this.cols = o.cols || 1; this.lh = o.lh || 38;
    this.rowsTotal = Math.max(1, Math.ceil(this.items.length / this.cols));
    this.vis = Math.min(o.visible || this.rowsTotal, this.rowsTotal);
    this.x = o.x ?? 32; this.y = o.y ?? 32; this.w = o.w ?? 220;
    this.th = o.title ? 36 : 0;
    this.h = o.h ?? this.vis * this.lh + 30 + this.th;
    this.scroll = 0; this.t = 0;
    this.fix();
    if (o.onMove) o.onMove(this.i, this);
  }
  fix() { const r = Math.floor(this.i / this.cols); if (r < this.scroll) this.scroll = r; if (r >= this.scroll + this.vis) this.scroll = r - this.vis + 1; }
  mv(dr, dc) {
    const n = this.items.length; let r = Math.floor(this.i / this.cols), c = this.i % this.cols;
    if (dc) c = (c + dc + this.cols) % this.cols;
    if (dr) r = (r + dr + this.rowsTotal) % this.rowsTotal;
    let ni = r * this.cols + c;
    if (ni >= n) ni = dr ? (dr > 0 ? c : n - 1) : r * this.cols;
    this.i = ni;
  }
  update(dt) {
    this.t += dt;
    const n = this.items.length;
    if (!n) { if (Input.tap('a') || Input.tap('b')) this.close(-1); return; }
    const old = this.i;
    if (Input.tap('up')) this.mv(-1, 0);
    else if (Input.tap('down')) this.mv(1, 0);
    else if (Input.tap('left')) { if (this.cols > 1) this.mv(0, -1); else if (this.o.lr) { this.o.lr(this.i, -1, this); } }
    else if (Input.tap('right')) { if (this.cols > 1) this.mv(0, 1); else if (this.o.lr) { this.o.lr(this.i, 1, this); } }
    if (old !== this.i) { this.fix(); Snd.sfx('cursor'); if (this.o.onMove) this.o.onMove(this.i, this); }
    if (Input.tap('a')) {
      const it = this.items[this.i];
      if (it.disabled) Snd.sfx('buzz'); else { Snd.sfx('confirm'); this.close(this.i); }
    } else if (Input.tap('b') && this.o.cancel !== false) { Snd.sfx('cancel'); this.close(-1); }
  }
  draw() {
    const o = this.o;
    drawWin(this.x, this.y, this.w, this.h);
    let y0 = this.y + 16;
    if (o.title) { txt(o.title, this.x + 22, y0, { color: '#ffd870', size: 20, b: true }); y0 += this.th; }
    const cw = (this.w - 24) / this.cols;
    const isTop = UI.top() === this;
    for (let r = this.scroll; r < this.scroll + this.vis; r++) for (let c = 0; c < this.cols; c++) {
      const idx = r * this.cols + c, it = this.items[idx]; if (!it) continue;
      const ix = this.x + 12 + c * cw, iy = y0 + (r - this.scroll) * this.lh;
      if (idx === this.i && (!isTop || Math.floor(this.t / 260) % 3 !== 2)) txt('▶', ix + 4, iy + 7, { color: isTop ? '#ffd870' : '#a89060', size: 18 });
      txt(it.label, ix + 30, iy + 6, { color: it.disabled ? '#77778a' : (it.color || '#f4ecd8'), size: o.size || 20 });
      if (it.right != null) txt(String(it.right), ix + cw - 12, iy + 6, { align: 'right', color: it.disabled ? '#77778a' : (it.rcolor || '#d8d0b8'), size: o.size || 20 });
    }
    if (this.scroll > 0) txt('▲', this.x + this.w - 30, this.y + 8, { size: 14, color: '#ffd870' });
    if (this.scroll + this.vis < this.rowsTotal) txt('▼', this.x + this.w - 30, this.y + this.h - 24, { size: 14, color: '#ffd870' });
    if (o.desc) { const it = this.items[this.i]; if (it && it.desc) { drawWin(16, H - 86, W - 32, 70); txt(it.desc, 40, H - 62, { size: 19, color: '#e8e0c8' }); } }
    if (o.extra) o.extra(this.i, this);
  }
}
function menu(items, o) { return UI.push(new Menu(items, o)); }
async function ask(sp, q, opts = ['是', '否'], o = {}) {
  const mb = new MsgBox(sp, q, { passive: true }); UI.push(mb);
  const r = await menu(opts, { x: W - 236, y: H - 186 - (opts.length * 38 + 34), w: 210, cancel: o.cancel ?? true });
  mb.close(); return r;
}

// 全屏文字卡（章节标题等）
class Card extends Widget {
  constructor(lines, o = {}) { super(); this.lines = lines; this.o = o; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 600 && (Input.tap('a') || Input.tap('b'))) this.close(); if (this.o.auto && this.t > this.o.auto) this.close(); }
  draw() {
    ctx.fillStyle = this.o.bg || '#05050a'; ctx.fillRect(0, 0, W, H);
    const n = this.lines.length; const lh = this.o.lh || 44;
    this.lines.forEach((l, i) => {
      const a = clamp((this.t - i * 350) / 600, 0, 1); if (!a) return;
      ctx.globalAlpha = a;
      const big = i === 0 && this.o.big;
      txt(l, W / 2, H / 2 - n * lh / 2 + i * lh + (big ? -10 : 0), { align: 'center', size: big ? 46 : (this.o.size || 24), font: big ? SERIF : FONT, color: big ? '#ffd870' : '#efe6d0' });
      ctx.globalAlpha = 1;
    });
    if (this.t > 1200 && Math.floor(this.t / 400) % 2) txt('▼', W / 2, H - 50, { align: 'center', size: 16, color: '#a89060' });
  }
}
const card = (lines, o) => UI.push(new Card(lines, o));

// ===== 淡入淡出 / 震屏 / 脚本 =====
const Fade = {
  a: 0, target: 0, speed: 1, res: null, color: '#000',
  to(t, ms) { return new Promise(r => { if (this.res) this.res(); if (this.a === t || ms <= 0) { this.a = t; this.res = null; r(); return; } this.target = t; this.speed = Math.abs(t - this.a) / ms; this.res = r; }); },
  update(dt) {
    if (!this.res) return;
    const d = this.speed * dt;
    if (Math.abs(this.target - this.a) <= d) { this.a = this.target; const r = this.res; this.res = null; r(); }
    else this.a += Math.sign(this.target - this.a) * d;
  },
  draw() { if (this.a > 0) { ctx.globalAlpha = this.a; ctx.fillStyle = this.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } }
};
const fadeOut = (ms = 300, c = '#000') => { Fade.color = c; return Fade.to(1, ms); };
const fadeIn = (ms = 300) => Fade.to(0, ms);
const Shake = { t: 0, mag: 0, start(mag, ms) { this.mag = mag; this.t = ms; }, update(dt) { if (this.t > 0) this.t -= dt; }, off() { return this.t > 0 ? [(Math.random() - .5) * this.mag * 2, (Math.random() - .5) * this.mag * 2] : [0, 0]; } };
const Script = { busy: 0 };
async function runScript(fn) { Script.busy++; try { return await fn(); } catch (e) { console.error(e); } finally { Script.busy--; } }
