'use strict';
// ===== 像素绘图原语（全部整数像素，无抗锯齿） =====
function px(x, X, Y, c) { x.fillStyle = c; x.fillRect(X | 0, Y | 0, 1, 1); }
function prect(x, X, Y, w, h, c) { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); }
function pell(x, cx, cy, rx, ry, c) {
  x.fillStyle = c;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry; if (Math.abs(dy) > 1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy), a = Math.round(cx - hw), b = Math.round(cx + hw);
    if (b > a) x.fillRect(a, y, b - a, 1);
  }
}
function pdisc(x, cx, cy, r, c) { pell(x, cx, cy, r, r, c); }
function ppoly(x, pts, c) {
  x.fillStyle = c; let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [a1, b1] = pts[i], [a2, b2] = pts[(i + 1) % pts.length]; if ((b1 <= yc && b2 > yc) || (b2 <= yc && b1 > yc)) xs.push(a1 + (yc - b1) / (b2 - b1) * (a2 - a1)); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i]), b = Math.round(xs[i + 1]); if (b > a) x.fillRect(a, y, b - a, 1); }
  }
}
function pline(x, x1, y1, x2, y2, c, w = 1) {
  x.fillStyle = c; const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let i = 0; i <= n; i++) { const X = Math.round(x1 + (x2 - x1) * i / n), Y = Math.round(y1 + (y2 - y1) * i / n); x.fillRect(X - (w >> 1), Y - (w >> 1), w, w); }
}
function outline(c, col = '#140c18', shadeIt = true) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h), a = d.data;
  const A = i => a[i * 4 + 3] > 0;
  const o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
    const i = y * w + X; if (A(i)) continue;
    if ((X > 0 && A(i - 1)) || (X < w - 1 && A(i + 1)) || (y > 0 && A(i - w)) || (y < h - 1 && A(i + w))) o[i] = 1;
  }
  if (shadeIt) {
    for (let y = 0; y < h - 1; y++) for (let X = 0; X < w - 1; X++) {
      const i = y * w + X; if (!A(i)) continue;
      const j = i + w + 1;
      if (!A(j) || o[j]) { a[i * 4] *= 0.72; a[i * 4 + 1] *= 0.72; a[i * 4 + 2] *= 0.78; }
    }
    x.putImageData(d, 0, 0);
  }
  x.fillStyle = col;
  for (let i = 0; i < w * h; i++) if (o[i]) x.fillRect(i % w, (i / w) | 0, 1, 1);
  return c;
}
function scaleCanvas(src, k) { const [c, x] = mkCanvas(src.width * k, src.height * k); x.drawImage(src, 0, 0, c.width, c.height); return c; }
function flipCanvas(src) { const [c, x] = mkCanvas(src.width, src.height); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1, 7), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

const Gfx = { cache: new Map() };
function cached(key, fn) { let c = Gfx.cache.get(key); if (!c) { c = fn(); Gfx.cache.set(key, c); } return c; }

// ===== 地形色 =====
const WC = { grass: '#5aa83c', grassD: '#438a2e', grassL: '#7cc454', tree: '#2e7a30', treeD: '#1d5622', treeL: '#4fa046', trunk: '#6a4424', mtn: '#9a7a58', mtnD: '#6e5238', mtnL: '#bca07a', snow: '#f4f8ff', water: '#2f62c8', waterL: '#78aef0', waterD: '#244ea6', sand: '#e8d498', sandD: '#cdb478', desert: '#dca460', desertD: '#b07a3e', desertL: '#eec080', snowG: '#e8f0f8', snowD: '#bccde0', ghost: '#3c3454', ghostD: '#2a2440', ghostL: '#5a5280', road: '#c8a874', roadD: '#a8885a' };
function base(x, r, c1, c2, c3, n = 9) {
  prect(x, 0, 0, 16, 16, c1);
  for (let i = 0; i < n; i++) px(x, r() * 16, r() * 16, c2);
  for (let i = 0; i < n / 2; i++) px(x, r() * 16, r() * 16, c3);
}
function grassBase(x, r) { base(x, r, WC.grass, WC.grassD, WC.grassL); for (let i = 0; i < 2; i++) { const X = 2 + r() * 11 | 0, Y = 2 + r() * 11 | 0; px(x, X, Y, WC.grassD); px(x, X + 2, Y, WC.grassD); px(x, X + 1, Y + 1, WC.grassD); } }
function tree(x, cx, cy, rad, c = WC.tree, d = WC.treeD, l = WC.treeL, trunk = WC.trunk) {
  prect(x, cx - 1, cy + rad - 2, 2, 4, trunk);
  pdisc(x, cx, cy, rad, d); pdisc(x, cx - 0.5, cy - 0.7, rad - 1, c);
  px(x, cx - 2, cy - 2, l); px(x, cx - 1, cy - 3, l); px(x, cx + 1, cy - 1, l);
}
function pine(x, cx, cy, c = '#2a6a40', d = '#1a4a2c', snowy) {
  prect(x, cx - 1, cy + 5, 2, 3, WC.trunk);
  ppoly(x, [[cx - 6, cy + 6], [cx, cy - 7], [cx + 6, cy + 6]], d);
  ppoly(x, [[cx - 5, cy + 5], [cx, cy - 6], [cx + 3, cy + 5]], c);
  if (snowy) { px(x, cx, cy - 6, '#fff'); px(x, cx - 2, cy - 1, '#fff'); px(x, cx + 2, cy + 2, '#fff'); px(x, cx - 3, cy + 4, '#fff'); }
}
function deadTree(x, cx, cy, c = '#4a3a3a') {
  pline(x, cx, cy + 7, cx, cy - 3, c, 2); pline(x, cx, cy, cx - 4, cy - 5, c); pline(x, cx, cy - 1, cx + 4, cy - 6, c); pline(x, cx - 2, cy - 3, cx - 5, cy - 3, c);
}
function mountain(x, r, body = WC.mtn, dark = WC.mtnD, cap = WC.snow) {
  const o = r() * 2 - 1;
  ppoly(x, [[0, 16], [8 + o, 1], [16, 16]], dark);
  ppoly(x, [[0, 16], [8 + o, 1], [9 + o, 16]], body);
  ppoly(x, [[5 + o, 6], [8 + o, 1], [11 + o, 6], [9 + o, 5], [8 + o, 7], [7 + o, 5]], cap);
  pline(x, 3, 13, 6, 9, dark); pline(x, 11, 10, 13, 14, shadeHex(dark, -0.2));
}

// 世界地图地块
const WTILE = {
  '.': (x, r) => grassBase(x, r),
  ':': (x, r) => { grassBase(x, r); for (let i = 0; i < 4; i++) { const X = 2 + r() * 12 | 0, Y = 2 + r() * 12 | 0, c = pick(['#f06080', '#f0e060', '#ffffff', '#c080f0']); px(x, X, Y, c); px(x, X + 1, Y, c); px(x, X, Y + 1, c); px(x, X + 1, Y + 1, '#e0a020'); } },
  'T': (x, r) => { grassBase(x, r); tree(x, 5, 6, 4); tree(x, 11, 9, 5); },
  'h': (x, r) => { grassBase(x, r); pell(x, 8, 12, 8, 7, WC.grassD); pell(x, 7, 12, 7, 6, '#6cb848'); px(x, 5, 8, WC.grassL); px(x, 6, 7, WC.grassL); },
  '^': (x, r) => { grassBase(x, r); mountain(x, r); },
  '~': (x, r, f) => { prect(x, 0, 0, 16, 16, WC.water); for (let i = 0; i < 3; i++) { const Y = 3 + i * 5, X = ((i * 5 + f * 3) % 12); pline(x, X, Y, X + 3, Y, WC.waterL); px(x, X + 1, Y - 1, WC.waterL); } px(x, (f * 7 + 3) % 16, 14, WC.waterD); },
  's': (x, r) => base(x, r, WC.sand, WC.sandD, '#f4e4b0'),
  'd': (x, r) => { base(x, r, WC.desert, WC.desertD, WC.desertL, 7); const X = r() * 10 | 0, Y = r() * 12 | 0; pline(x, X, Y, X + 3, Y + 2, WC.desertD); pline(x, X + 3, Y + 2, X + 5, Y + 1, WC.desertD); },
  '*': (x, r) => base(x, r, WC.snowG, WC.snowD, '#ffffff', 6),
  'P': (x, r) => { base(x, r, WC.snowG, WC.snowD, '#fff', 6); pine(x, 8, 7, '#2a6a50', '#1a4a38', true); },
  'g': (x, r) => { base(x, r, WC.ghost, WC.ghostD, WC.ghostL, 10); for (let i = 0; i < 2; i++) { const X = 2 + r() * 11 | 0, Y = 3 + r() * 10 | 0; px(x, X, Y, '#7a6a9a'); px(x, X + 1, Y - 1, '#7a6a9a'); } },
  'G': (x, r) => { base(x, r, WC.ghost, WC.ghostD, WC.ghostL, 10); deadTree(x, 8, 7, '#1e1828'); },
  'D': (x, r) => { base(x, r, WC.desert, WC.desertD, WC.desertL, 7); deadTree(x, 8, 7, '#5a3a24'); },
  'Q': (x, r) => { base(x, r, WC.ghost, WC.ghostD, WC.ghostL, 10); mountain(x, r, '#5a4e6e', '#3e3452', '#8a7aaa'); },
  'R': (x, r) => { base(x, r, WC.desert, WC.desertD, WC.desertL, 7); mountain(x, r, '#a8784a', '#7a5432', '#c89a68'); },
  'S': (x, r) => { base(x, r, WC.snowG, WC.snowD, '#fff', 6); mountain(x, r, '#8aa0bc', '#5e7490', '#ffffff'); },
  '=': (x, r) => { base(x, r, WC.road, WC.roadD, '#dcc08c', 8); },
  // 关卡障碍
  '2': (x, r) => { grassBase(x, r); for (const [cx, cy, rd] of [[5, 6, 4], [11, 7, 4], [8, 12, 4]]) { pdisc(x, cx, cy, rd, '#6a6a72'); pdisc(x, cx - 1, cy - 1, rd - 1, '#9a9aa2'); px(x, cx - 2, cy - 2, '#c8c8d0'); } },
  '3': (x, r) => { base(x, r, WC.desert, WC.desertD, WC.desertL, 7); for (const X of [2, 13]) prect(x, X, 3, 2, 12, '#6a4424'); pline(x, 1, 5, 15, 13, '#8a5a30', 2); pline(x, 1, 13, 15, 5, '#8a5a30', 2); prect(x, 6, 1, 4, 3, '#c03a2a'); },
  '4': (x, r, f) => { base(x, r, WC.desert, WC.desertD, WC.desertL, 7); for (let i = 0; i < 3; i++) { const cy = 3 + i * 5, o = (f * 4 + i * 3) % 8; pline(x, o, cy, o + 6, cy + 1, '#f4d8a0'); pline(x, o + 6, cy + 1, o + 8, cy - 1, '#f4d8a0'); px(x, (o + 10) % 16, cy + 2, '#fff0c8'); } },
  '5': (x, r) => { prect(x, 0, 0, 16, 16, '#2c4a2a'); for (let i = 0; i < 6; i++) { const X = r() * 14 | 0, Y = r() * 14 | 0; pline(x, X, Y, X + 4, Y + 3, '#5a2a5a', 2); px(x, X + 2, Y, '#c04080'); px(x, X + 4, Y + 1, '#e0d0e0'); } },
  '6': (x, r) => { prect(x, 0, 0, 16, 16, '#9ad0f4'); ppoly(x, [[0, 16], [3, 2], [8, 0], [13, 3], [16, 16]], '#c8ecff'); pline(x, 4, 4, 6, 12, '#ffffff'); pline(x, 10, 3, 9, 9, '#7ab8e0'); px(x, 12, 6, '#fff'); },
  '7': (x, r) => { base(x, r, WC.road, WC.roadD, '#dcc08c', 8); for (let X = 0; X < 16; X += 4) prect(x, X, 7, 2, 2, X % 8 ? '#e8e8e8' : '#c83030'); prect(x, 0, 6, 16, 1, '#5a3a20'); prect(x, 0, 9, 16, 1, '#5a3a20'); prect(x, 12, 1, 1, 6, '#5a3a20'); ppoly(x, [[13, 1], [16, 2], [13, 4]], '#d03030'); },
};
// 地点图标
const LOCICON = {
  city: x => { ppoly(x, [[1, 7], [4, 3], [12, 3], [15, 7]], '#b83a2a'); prect(x, 1, 7, 14, 8, '#9a9aa4'); for (let X = 1; X < 15; X += 3) prect(x, X, 6, 2, 2, '#9a9aa4'); prect(x, 6, 10, 4, 5, '#2a2028'); prect(x, 1, 14, 14, 1, '#6a6a74'); },
  bigcity: x => { ppoly(x, [[0, 6], [3, 1], [13, 1], [16, 6]], '#e0a830'); prect(x, 0, 6, 16, 9, '#a8a0a8'); for (let X = 0; X < 16; X += 3) prect(x, X, 5, 2, 2, '#a8a0a8'); prect(x, 6, 9, 4, 6, '#3a1a1a'); prect(x, 2, 8, 2, 2, '#c03030'); prect(x, 12, 8, 2, 2, '#c03030'); },
  village: x => { for (const [X, Y] of [[1, 6], [8, 8]]) { prect(x, X + 1, Y + 3, 6, 4, '#c8a070'); ppoly(x, [[X, Y + 4], [X + 4, Y], [X + 8, Y + 4]], '#d8b850'); prect(x, X + 3, Y + 5, 2, 2, '#3a2a1a'); } },
  cave: x => { pell(x, 8, 11, 8, 7, '#7a5a40'); pell(x, 8, 10, 7, 6, '#9a7a58'); pell(x, 8, 12, 3, 4, '#100808'); },
  ghostcave: x => { pell(x, 8, 11, 8, 7, '#3a3048'); pell(x, 8, 10, 7, 6, '#5a4a70'); pell(x, 8, 12, 3, 4, '#0a0610'); px(x, 7, 11, '#80ffb0'); px(x, 9, 11, '#80ffb0'); },
  watercave: x => { pell(x, 8, 11, 8, 7, '#4a6a88'); pell(x, 8, 10, 7, 6, '#6a9ab8'); pell(x, 8, 12, 3, 4, '#0a1424'); px(x, 3, 6, '#ffffff'); px(x, 12, 8, '#e0f8ff'); },
  peak: x => { ppoly(x, [[0, 16], [8, 0], [16, 16]], '#8a5a3a'); ppoly(x, [[0, 16], [8, 0], [8, 16]], '#a8724a'); pell(x, 8, 13, 3, 3, '#140808'); prect(x, 7, 1, 2, 2, '#e04020'); },
  manor: x => { ppoly(x, [[1, 7], [4, 2], [12, 2], [15, 7]], '#3a2a4a'); prect(x, 2, 7, 12, 8, '#7a6a6a'); prect(x, 7, 10, 3, 5, '#1a1018'); px(x, 4, 9, '#f0d060'); px(x, 12, 9, '#f0d060'); },
  icecave: x => { pell(x, 8, 11, 8, 7, '#7aa8d0'); pell(x, 8, 10, 7, 6, '#c8e8ff'); pell(x, 8, 12, 3, 4, '#0a1830'); },
  prison: x => { ppoly(x, [[1, 6], [4, 2], [12, 2], [15, 6]], '#3a3a3a'); prect(x, 2, 6, 12, 9, '#6a6a70'); for (let X = 4; X < 13; X += 2) prect(x, X, 8, 1, 6, '#1a1a1a'); },
  port: x => { prect(x, 3, 6, 10, 9, '#c84a3a'); ppoly(x, [[1, 7], [8, 1], [15, 7]], '#2a6a6a'); ppoly(x, [[3, 11], [8, 7], [13, 11]], '#2a6a6a'); prect(x, 7, 11, 2, 4, '#3a1a1a'); },
  yurts: x => { for (const [X, Y, c] of [[4, 9, '#e8dcc0'], [11, 7, '#d8c8a0']]) { pell(x, X, Y + 2, 4, 3, c); prect(x, X - 4, Y + 2, 8, 4, c); pell(x, X, Y, 3, 2, shadeHex(c, 0.1)); prect(x, X - 1, Y + 3, 2, 3, '#5a3a20'); pline(x, X - 3, Y + 3, X + 3, Y + 3, '#a0522d'); } px(x, 11, 3, '#c03030'); pline(x, 11, 4, 11, 7, '#5a3a20'); },
  fort: x => { prect(x, 1, 6, 14, 9, '#b8a080'); for (let X = 1; X < 15; X += 3) prect(x, X, 4, 2, 2, '#b8a080'); prect(x, 6, 9, 4, 6, '#3a2418'); ppoly(x, [[5, 4], [8, 0], [11, 4]], '#8a3a2a'); prect(x, 6, 4, 4, 2, '#a89070'); },
  whirl: (x, f) => { pdisc(x, 8, 8, 7, '#1a3a8a'); pdisc(x, 8, 8, 5, '#2a5ac0'); pdisc(x, 8, 8, 3, '#4a8ae0'); pdisc(x, 8, 8, 1, '#0a1a4a'); const a = f * 1.5; px(x, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, '#ffffff'); px(x, 8 - Math.cos(a) * 4, 8 - Math.sin(a) * 4, '#ffffff'); },
  void: (x, f) => { pdisc(x, 8, 8, 7, '#2a0a3a'); pdisc(x, 8, 8, 5, '#5a1a7a'); pdisc(x, 8, 8, 3, '#0a0010'); const a = f * 1.5; px(x, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, '#e080ff'); px(x, 8 - Math.cos(a) * 5, 8 - Math.sin(a) * 5, '#ffffff'); },
};

// ===== 城镇地块 =====
const TTHEME = {
  city: { g: '#c8b088', g2: '#b89c74', g3: '#d8c098', wall: '#8a8a94', wallD: '#5e5e68', tree: 'tree' },
  village: { g: '#86bc5a', g2: '#6ea648', g3: '#9ccc70', wall: '#8a5a30', wallD: '#5a3a1a', tree: 'tree', fence: true },
  ghost: { g: '#5a5270', g2: '#4a4260', g3: '#6a6284', wall: '#4a3a3a', wallD: '#2a1e1e', tree: 'dead', fence: true },
  desert: { g: '#d8b070', g2: '#c09858', g3: '#e8c890', wall: '#a87848', wallD: '#7a5430', tree: 'dead', fence: true },
  snow: { g: '#e4ecf6', g2: '#c8d6e8', g3: '#ffffff', wall: '#8a8a94', wallD: '#5e5e68', tree: 'pine' },
  coast: { g: '#dccc94', g2: '#c8b47c', g3: '#ece0b0', wall: '#a89a88', wallD: '#7a6e60', tree: 'tree' },
  steppe: { g: '#a8b860', g2: '#94a44c', g3: '#bcca78', wall: '#9a7a50', wallD: '#6a5030', tree: 'dead', fence: true },
  water: { g: '#7cb860', g2: '#62a04a', g3: '#94cc78', wall: '#8a5a30', wallD: '#5a3a1a', tree: 'tree', fence: true },
};
const TTILE = {
  ',': (x, r, f, th) => base(x, r, th.g, th.g2, th.g3, 7),
  'E': (x, r, f, th) => base(x, r, th.g, th.g2, th.g3, 7),
  'B': (x, r, f, th) => base(x, r, th.g, th.g2, th.g3, 7),
  'D': (x, r, f, th) => base(x, r, th.g, th.g2, th.g3, 7),
  '_': (x, r, f, th) => { prect(x, 0, 0, 16, 16, '#b0a898'); for (let Y = 0; Y < 16; Y += 4) prect(x, 0, Y, 16, 1, '#8a8478'); for (let Y = 0; Y < 16; Y += 4) prect(x, (Y % 8 ? 4 : 0) + 7, Y, 1, 4, '#8a8478'); px(x, r() * 16, r() * 16, '#c8c0b0'); },
  '#': (x, r, f, th) => {
    if (th.fence) { base(x, r, th.g, th.g2, th.g3, 7); prect(x, 0, 6, 16, 2, th.wall); prect(x, 0, 11, 16, 2, th.wall); for (const X of [2, 8, 13]) { prect(x, X, 3, 2, 12, th.wall); px(x, X, 3, th.wallD); } return; }
    prect(x, 0, 0, 16, 16, th.wall); for (let Y = 0; Y < 16; Y += 4) { prect(x, 0, Y + 3, 16, 1, th.wallD); for (let X = (Y % 8 ? 0 : 4); X < 16; X += 8) prect(x, X, Y, 1, 3, th.wallD); }
  },
  't': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); if (th.tree === 'pine') pine(x, 8, 7, '#2a6a50', '#1a4a38', true); else if (th.tree === 'dead') deadTree(x, 8, 7, '#3a2a2a'); else tree(x, 8, 7, 6); },
  ':': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); for (let i = 0; i < 5; i++) { const X = 1 + r() * 13 | 0, Y = 1 + r() * 13 | 0, c = pick(['#f06080', '#f0e060', '#ffffff', '#e080c0', '#f09040']); px(x, X, Y, c); px(x, X + 1, Y, c); px(x, X, Y + 1, c); px(x, X + 1, Y + 1, '#40a030'); } },
  '~': (x, r, f) => WTILE['~'](x, r, f),
  'o': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); pdisc(x, 8, 9, 6, '#7a7a84'); pdisc(x, 8, 9, 4, '#1a2a4a'); prect(x, 2, 2, 1, 7, '#6a4424'); prect(x, 13, 2, 1, 7, '#6a4424'); ppoly(x, [[1, 3], [8, -1], [15, 3]], '#9a3a2a'); },
  'l': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); prect(x, 7, 5, 2, 10, '#4a2a1a'); pell(x, 8, 4, 4, 3, '#e03a2a'); prect(x, 6, 1, 4, 1, '#f0c040'); prect(x, 6, 7, 4, 1, '#f0c040'); px(x, 7, 3, '#ffd080'); },
  'x': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); prect(x, 0, 7, 16, 2, '#8a5a30'); for (const X of [1, 7, 13]) prect(x, X, 4, 2, 10, '#8a5a30'); },
  'b': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); pell(x, 8, 10, 6, 4, '#7a5a3a'); pell(x, 8, 9, 5, 3, '#9a7a50'); px(x, 6, 8, '#c8a878'); },
  // 石板路
  '-': (x, r, f, th) => { if (th.fence) { base(x, r, shadeHex(th.g, -0.12), shadeHex(th.g, -0.22), shadeHex(th.g, 0.05), 10); return; } prect(x, 0, 0, 16, 16, '#9a9088'); for (let Y = 0; Y < 16; Y += 5) { prect(x, 0, Y, 16, 1, '#7a7068'); for (let X = (Y % 10 ? 3 : 8); X < 16; X += 10) prect(x, X, Y, 1, 5, '#7a7068'); } px(x, r() * 16, r() * 16, '#b4aaa0'); px(x, r() * 16, r() * 16, '#b4aaa0'); },
  // 木桥
  '=': (x, r, f) => { WTILE['~'](x, r, f); prect(x, 0, 1, 16, 14, '#8a5a30'); for (let Y = 1; Y < 15; Y += 3) prect(x, 0, Y, 16, 1, '#6a4020'); prect(x, 0, 1, 16, 1, '#4a2a14'); prect(x, 0, 14, 16, 1, '#4a2a14'); for (const X of [1, 14]) prect(x, X, 0, 1, 16, '#a87040'); },
  // 假山石
  'r': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); pell(x, 8, 13, 7, 2, 'rgba(0,0,0,0.25)'); ppoly(x, [[2, 13], [4, 5], [8, 2], [12, 5], [14, 13]], '#6e6a72'); ppoly(x, [[4, 12], [5, 6], [8, 3], [9, 12]], '#9a96a0'); px(x, 7, 5, '#c8c4cc'); px(x, 10, 9, '#4a4650'); },
  // 货箱与酒坛
  'k': (x, r, f, th) => { base(x, r, th.g, th.g2, th.g3, 7); prect(x, 1, 6, 8, 8, '#a87040'); prect(x, 1, 6, 8, 1, '#c89060'); pline(x, 1, 6, 8, 13, '#7a4a20'); pline(x, 8, 6, 1, 13, '#7a4a20'); pell(x, 12, 10, 3, 4, '#7a4a2a'); prect(x, 10, 5, 4, 2, '#5a3018'); prect(x, 11, 9, 3, 2, '#e03a2a'); },
};

// ===== 迷宫地块 =====
const DTHEME = {
  dream: { f: '#e8c8e0', f2: '#f2d8ec', w: '#b07ac0', wd: '#7a4c92', top: '#4a2a62', acc: '#ffe080', pile: 'gold', col: ['#e8e0f0', '#ffffff', '#b8a8d0'], pool: ['#b88ad0', '#d8b0f0', '#f4e0ff'], deco: ['#ff9ac0', '#ffd0e0', '#ffe080', '#ffffff'] },
  ghost: { f: '#3e3850', f2: '#48425c', w: '#6a5a7e', wd: '#483c5a', top: '#140f1c', acc: '#80ffb0', pile: 'tomb', stal: true, pool: ['#1a3a2a', '#2a5a3a', '#80ffb0'], deco: ['#d8d0c0', '#a8a090', '#80ffb0'] },
  water: { f: '#5a8aa4', f2: '#6898b2', w: '#3a6a8c', wd: '#244a68', top: '#0c1e30', acc: '#e0f8ff', pile: 'crystal', stal: true, cry: ['#7ab8d8', '#d0f0ff', '#ffffff'], pool: ['#1a4a6a', '#2a6a9a', '#a0e0ff'], deco: ['#8ab8c8', '#c8e8f0', '#e0f8ff'] },
  rock: { f: '#a68462', f2: '#b4926e', w: '#7e5c40', wd: '#5a3e2a', top: '#24160c', acc: '#e05020', pile: 'rock', stal: true, pool: ['#8a2a10', '#e05a10', '#ffd040'], deco: ['#7a5838', '#e05020', '#5a3e2a'] },
  mansion: { f: '#8a5a3a', f2: '#966646', w: '#d8c8a8', wd: '#9a3a2a', top: '#2a1a14', acc: '#f0d060', planks: true, pile: 'crate', col: ['#9a3a2a', '#c05a40', '#6a2018'], crate: ['#5a2a1a', '#7a3a24', '#2a1008'], deco: ['#a02a2a', '#d0a040'] },
  ice: { f: '#d4e6f4', f2: '#c4d8ea', w: '#8ab0d4', wd: '#5a86b0', top: '#16243a', acc: '#ffffff', pile: 'crystal', stal: true, pool: ['#5a86b0', '#8ab8e0', '#ffffff'], deco: ['#ffffff', '#e8f4ff'] },
  prison: { f: '#56565e', f2: '#62626a', w: '#8a8a92', wd: '#5a5a64', top: '#141418', acc: '#c03030', pile: 'crate', col: ['#6a6a72', '#8a8a92', '#4a4a52'], crate: ['#5a4a3a', '#7a6a50', '#2a2018'], deco: ['#c8b060', '#a89040', '#8a1a1a'] },
  palace: { f: '#2a7aa2', f2: '#3688b0', w: '#e4b454', wd: '#a87828', top: '#06203a', acc: '#ff8a9a', tiles: true, pile: 'coral', col: ['#e4b454', '#f8d878', '#a87828'], deco: ['#ffe0e0', '#f8f0d0', '#ff8a9a'] },
  void: { f: '#261c38', f2: '#2e2244', w: '#5e3e80', wd: '#3c2658', top: '#040208', acc: '#e080ff', pile: 'crystal', cry: ['#5e3e80', '#a060e0', '#ffffff'], col: ['#3c2658', '#5e3e80', '#1a0c2a'], pool: ['#0a0010', '#3a1060', '#e080ff'], deco: ['#e080ff', '#ffffff', '#8040c0'] },
};
const DTILE = {
  ',': (x, r, f, th) => {
    prect(x, 0, 0, 16, 16, th.f);
    if (th.planks) { for (let Y = 0; Y < 16; Y += 4) { prect(x, 0, Y, 16, 1, th.f2); px(x, (Y * 3 + 5) % 16, Y + 2, '#6a4024'); } return; }
    if (th.tiles) { prect(x, 0, 0, 8, 8, th.f2); prect(x, 8, 8, 8, 8, th.f2); px(x, 4, 4, th.acc); return; }
    for (let i = 0; i < 6; i++) px(x, r() * 16, r() * 16, th.f2);
    for (let i = 0; i < 3; i++) px(x, r() * 16, r() * 16, shadeHex(th.f, -0.15));
  },
  'face': (x, r, f, th) => { prect(x, 0, 0, 16, 16, th.w); for (let Y = 0; Y < 16; Y += 5) { prect(x, 0, Y + 4, 16, 1, th.wd); for (let X = (Y % 10 ? 2 : 7); X < 16; X += 9) prect(x, X, Y, 1, 4, th.wd); } prect(x, 0, 0, 16, 2, shadeHex(th.w, 0.2)); prect(x, 0, 14, 16, 2, shadeHex(th.wd, -0.3)); },
  'top': (x, r, f, th) => { prect(x, 0, 0, 16, 16, th.top); for (let i = 0; i < 4; i++) px(x, r() * 16, r() * 16, shadeHex(th.top, 0.15)); },
  '<': (x, r, f, th) => { DTILE[','](x, r, f, th); for (let i = 0; i < 4; i++) prect(x, 2 + i, 3 + i * 3, 12 - i * 2, 3, shadeHex(th.w, 0.1 - i * 0.12)); },
  '>': (x, r, f, th) => { DTILE[','](x, r, f, th); prect(x, 2, 2, 12, 12, '#0a0608'); for (let i = 0; i < 4; i++) prect(x, 3, 3 + i * 3, 10 - i * 2, 2, shadeHex(th.wd, -0.1 - i * 0.15)); },
  // 迷宫地形：q 堆积物、p 柱/石笋、w 水池、f 可走的装饰地面（随主题变化）
  'q': (x, r, f, th) => { DTILE[','](x, r, f, th); (PROP_PILE[th.pile] || PROP_PILE.rock)(x, r, th); },
  'p': (x, r, f, th) => {
    DTILE[','](x, r, f, th); pell(x, 8, 14, 6, 2, 'rgba(0,0,0,0.3)');
    if (th.stal) { ppoly(x, [[3, 15], [8, 1], [13, 15]], th.wd); ppoly(x, [[3, 15], [8, 1], [8, 15]], th.w); px(x, 7, 5, shadeHex(th.w, 0.3)); pline(x, 6, 9, 7, 12, shadeHex(th.w, 0.25)); return; }
    const c = th.col || [th.w, shadeHex(th.w, 0.3), th.wd];
    prect(x, 5, 3, 6, 11, c[0]); prect(x, 5, 3, 2, 11, c[1]); prect(x, 9, 3, 2, 11, c[2]); prect(x, 4, 1, 8, 2, th.acc); prect(x, 4, 13, 8, 2, th.acc);
  },
  'w': (x, r, f, th) => { const c = th.pool || ['#244a68', '#3a6a8c', '#8ab8e0']; prect(x, 0, 0, 16, 16, th.f); pell(x, 8, 8, 8, 7, c[0]); pell(x, 8, 8, 7, 6, c[1]); pell(x, 7, 7, 4, 2, c[2]); px(x, 11, 10, c[2]); },
  'f': (x, r, f, th) => { DTILE[','](x, r, f, th); const cs = th.deco || [th.acc]; for (let i = 0; i < 6; i++) { const X = r() * 14 | 0, Y = r() * 14 | 0, c = cs[Math.floor(r() * cs.length)]; px(x, X, Y, c); px(x, X + 1, Y, c); if (r() < 0.5) px(x, X, Y + 1, c); } },
  '!': (x, r, f, th) => { DTILE[','](x, r, f, th); pdisc(x, 8, 8, 7, '#c89a20'); pdisc(x, 8, 8, 5, '#ffe080'); pdisc(x, 8, 8, 3, '#ffffff'); const a = f * 1.6; for (let i = 0; i < 3; i++) px(x, 8 + Math.cos(a + i * 2.1) * 6, 8 + Math.sin(a + i * 2.1) * 6, '#ffffff'); },
};

// 迷宫堆积物的几种画法
const PROP_PILE = {
  gold: (x, r) => { pell(x, 8, 12, 7, 3, '#c89a20'); pell(x, 8, 10, 6, 4, '#e8b830'); pell(x, 8, 9, 4, 3, '#ffd860'); for (let i = 0; i < 5; i++) pdisc(x, 3 + r() * 10, 7 + r() * 6, 1.2, '#fff0a0'); prect(x, 5, 5, 6, 2, '#f0f0f8'); px(x, 6, 5, '#ffffff'); },
  rock: (x, r, th) => { pell(x, 8, 13, 7, 2, 'rgba(0,0,0,0.3)'); ppoly(x, [[2, 13], [4, 6], [8, 3], [12, 6], [14, 13]], th.wd); ppoly(x, [[4, 12], [5, 7], [8, 4], [9, 12]], th.w); px(x, 7, 6, shadeHex(th.w, 0.3)); },
  tomb: (x, r) => { pell(x, 8, 14, 6, 2, 'rgba(0,0,0,0.35)'); prect(x, 4, 5, 8, 9, '#5a5868'); pell(x, 8, 5, 4, 3, '#5a5868'); prect(x, 5, 5, 2, 9, '#7a7888'); prect(x, 7, 6, 2, 6, '#2a2838'); prect(x, 6, 8, 4, 1, '#2a2838'); px(x, 3, 13, '#80ffb0'); },
  crystal: (x, r, th) => { const c = th.cry || ['#6aa0d0', '#c8e8ff', '#ffffff']; ppoly(x, [[2, 14], [4, 6], [6, 14]], c[0]); ppoly(x, [[5, 14], [8, 2], [11, 14]], c[0]); ppoly(x, [[6, 14], [8, 3], [8, 14]], c[1]); ppoly(x, [[10, 14], [12, 7], [14, 14]], c[1]); px(x, 8, 5, c[2]); px(x, 12, 9, c[2]); },
  crate: (x, r, th) => { const c = th.crate || ['#8a5a30', '#a87040', '#5a3a18']; prect(x, 1, 5, 9, 9, c[0]); prect(x, 1, 5, 9, 1, c[1]); pline(x, 1, 5, 9, 13, c[2]); pline(x, 9, 5, 1, 13, c[2]); prect(x, 9, 8, 6, 6, c[1]); prect(x, 9, 8, 6, 1, shadeHex(c[1], 0.2)); prect(x, 11, 10, 2, 2, c[2]); },
  coral: (x, r) => { for (const [X, c] of [[4, '#f06a7a'], [8, '#ff9aa8'], [12, '#f06a7a']]) { pline(x, X, 14, X, 6, c, 2); pline(x, X, 9, X - 2, 6, c); pline(x, X, 8, X + 2, 5, c); px(x, X, 5, '#ffe0e0'); } },
};
// 统一取地块（48×48 缓存）
Gfx.tile = function (kind, code, theme, v, f) {
  const key = kind + '|' + code + '|' + theme + '|' + v + '|' + f;
  return cached(key, () => {
    const [c, x] = mkCanvas(16, 16), r = mkRng(hashStr(key) + v * 977);
    if (kind === 'w') (WTILE[code] || WTILE['.'])(x, r, f);
    else if (kind === 't') (TTILE[code] || TTILE[','])(x, r, f, TTHEME[theme] || TTHEME.city);
    else (DTILE[code] || DTILE[','])(x, r, f, DTHEME[theme] || DTHEME.rock);
    return scaleCanvas(c, 3);
  });
};
Gfx.loc = function (icon, f) {
  return cached('loc|' + icon + '|' + f, () => { const [c, x] = mkCanvas(16, 16); (LOCICON[icon] || LOCICON.city)(x, f); outline(c, '#1a1210', false); return scaleCanvas(c, 3); });
};
Gfx.chest = function (open) {
  return cached('chest' + open, () => {
    const [c, x] = mkCanvas(16, 16);
    if (open) { prect(x, 2, 7, 12, 7, '#8a4a20'); prect(x, 3, 8, 10, 3, '#1a0a04'); prect(x, 2, 3, 12, 4, '#a85a28'); prect(x, 2, 6, 12, 1, '#e0b040'); }
    else { prect(x, 2, 5, 12, 9, '#a85a28'); prect(x, 2, 5, 12, 3, '#c06a30'); prect(x, 2, 8, 12, 1, '#e0b040'); prect(x, 7, 7, 2, 3, '#f0d060'); prect(x, 2, 5, 1, 9, '#e0b040'); prect(x, 13, 5, 1, 9, '#e0b040'); }
    outline(c, '#1a0c06', false); return scaleCanvas(c, 3);
  });
};
Gfx.relic = function (f) {
  return cached('relic' + f, () => {
    const [c, x] = mkCanvas(16, 16);
    pell(x, 8, 13, 6, 2, 'rgba(0,0,0,0.3)');
    for (let i = 0; i < 5; i++) prect(x, 3 + i * 2, 5, 2, 8, i % 2 ? '#d8b878' : '#e8c888');
    prect(x, 3, 7, 10, 1, '#8a3a2a'); prect(x, 3, 11, 10, 1, '#8a3a2a');
    for (let i = 0; i < 5; i++) px(x, 4 + i * 2, 9, '#5a3a20');
    outline(c, '#1a0c06', false);
    const s = [[2, 2], [13, 3], [14, 10], [1, 11]][f % 4]; px(x, s[0], s[1], '#ffffff'); px(x, s[0] + 1, s[1], '#fff0a0'); px(x, s[0], s[1] + 1, '#fff0a0');
    return scaleCanvas(c, 3);
  });
};
// 毡帐（穹庐）：圆顶，门在正中，占 w×3 格
Gfx.yurt = function (w, col) {
  return cached('yurt|' + w + col, () => {
    const pw = w * 16, [c, x] = mkCanvas(pw, 48), cx = pw / 2;
    const cl = col || '#e8dcc0', cd = shadeHex(cl, -0.2), cdd = shadeHex(cl, -0.4);
    prect(x, 6, 26, pw - 12, 22, cd); prect(x, 7, 26, pw - 14, 20, cl);
    pell(x, cx, 26, cx - 6, 18, cd); pell(x, cx, 26, cx - 7, 17, cl);
    for (const Y of [20, 34]) prect(x, 6, Y, pw - 12, 2, '#a0522d');
    for (let X = 12; X < pw - 10; X += 10) pline(x, X, 36, X + 4, 46, cdd);
    pell(x, cx, 9, 6, 2, cdd); px(x, cx, 6, '#5a3a20'); pline(x, cx, 1, cx, 8, '#5a3a20'); prect(x, cx + 1, 1, 5, 3, '#c03030');
    prect(x, cx - 7, 34, 14, 14, '#7a2418'); prect(x, cx - 6, 35, 12, 13, '#a83a2a'); for (let Y = 37; Y < 48; Y += 3) prect(x, cx - 6, Y, 12, 1, '#7a2418');
    outline(c, '#1a0c06', false);
    return scaleCanvas(c, 3);
  });
};
// 中式屋顶建筑（宽 w 格，高 3 格）
Gfx.building = function (w, roof, wallC) {
  return cached('bld|' + w + roof + wallC, () => {
    const pw = w * 16, [c, x] = mkCanvas(pw, 48);
    const rd = shadeHex(roof, -0.35), rl = shadeHex(roof, 0.25);
    const wall = wallC || '#ece0c4';
    // 墙
    prect(x, 2, 30, pw - 4, 18, wall);
    prect(x, 2, 30, 2, 18, '#8a3424'); prect(x, pw - 4, 30, 2, 18, '#8a3424');
    const dx = Math.floor(w / 2) * 16;
    prect(x, dx - 1, 30, 2, 18, '#8a3424'); prect(x, dx + 15, 30, 2, 18, '#8a3424');
    prect(x, dx + 2, 33, 12, 15, '#7a2418'); prect(x, dx + 8, 33, 1, 15, '#4a120a');
    for (const [X, Y] of [[4, 37], [11, 37], [4, 42], [11, 42]]) px(x, dx + X, Y, '#f0c040');
    for (let X = 8; X < pw - 8; X += 16) { if (Math.abs(X - dx) < 16) continue; prect(x, X, 35, 9, 8, '#5a3424'); for (let k = 0; k < 3; k++) { prect(x, X + 1 + k * 3, 36, 1, 6, '#c8a878'); } prect(x, X + 1, 38, 7, 1, '#c8a878'); }
    // 屋顶（飞檐）
    ppoly(x, [[-1, 31], [5, 8], [pw - 5, 8], [pw + 1, 31]], rd);
    ppoly(x, [[1, 29], [6, 9], [pw - 6, 9], [pw - 1, 29]], roof);
    for (let X = 4; X < pw - 3; X += 3) pline(x, X, 11, X + (X < pw / 2 ? -2 : 2), 28, rd);
    prect(x, 0, 28, pw, 3, rd); prect(x, 1, 28, pw - 2, 1, rl);
    ppoly(x, [[0, 27], [-1, 22], [3, 27]], rd); ppoly(x, [[pw, 27], [pw + 1, 22], [pw - 3, 27]], rd);
    prect(x, 4, 5, pw - 8, 4, '#3a2a28'); prect(x, 4, 5, pw - 8, 1, '#6a5a58');
    ppoly(x, [[1, 7], [4, 2], [6, 7]], '#3a2a28'); ppoly(x, [[pw - 1, 7], [pw - 4, 2], [pw - 6, 7]], '#3a2a28');
    return scaleCanvas(c, 3);
  });
};

// ===== 人物精灵（16×16 模板 + 调色板 + 特征） =====
const CT = {
  down: ['................', '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...khsssssshk...', '...kssessessk...', '...kssssssssk...', '....kssmmssk....', '...krrrttrrrk...', '..ksrrrttrrrsk..', '..ksrrrrrrrrsk..', '...kttttttttk...', '...krrrRRrrrk...', '...krrrRRrrrk...', '....kk....kk....', '................'],
  up: ['................', '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhhk...', '....khhhhhhk....', '...krrrrrrrrk...', '..ksrrrrrrrrsk..', '..ksrrrrrrrrsk..', '...kttttttttk...', '...krrrRRrrrk...', '...krrrRRrrrk...', '....kk....kk....', '................'],
  left: ['................', '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...ksssshhhhk...', '...ksesshhhhk...', '...kssssshhhk...', '....ksmsshk.....', '....krrrrrrk....', '...ksrrrrrrk....', '....krrrrrrk....', '....kttttttk....', '....krrrRrrk....', '....krrrRrrk....', '.....kk..kk.....', '................'],
};
const SPRITES = {
  man: { h: '#2a2a2a', r: '#6a8aa8', R: '#4a6a88', t: '#3a3a3a', f: ['topknot'] },
  man2: { h: '#3a2a1a', r: '#8a7a5a', R: '#6a5a3e', t: '#4a3a2a', f: ['cap'] },
  woman: { h: '#1a1a2a', r: '#d87a6a', R: '#a85a4a', t: '#f0e0b0', f: ['topknot', 'skirt'] },
  woman2: { h: '#2a1a2a', r: '#7aa86a', R: '#5a884a', t: '#f0e0b0', f: ['topknot', 'skirt'] },
  oldman: { h: '#d0d0d0', r: '#7a6a58', R: '#5a4a3a', t: '#3a2a1a', b: '#e8e8e8', f: ['beard'] },
  oldwoman: { h: '#c8c8c8', r: '#6a5a7a', R: '#4a3a5a', t: '#c0b080', f: ['topknot', 'skirt'] },
  child: { h: '#1a1a1a', r: '#e8a040', R: '#c07820', t: '#c03030', f: ['tufts'], small: true },
  guard: { h: '#3a3a3a', r: '#a83a2a', R: '#7a2418', t: '#c8c8d0', x: '#7a7a88', f: ['helmet'] },
  merchant: { h: '#1a1a1a', r: '#a07a3a', R: '#7a5a24', t: '#5a3a1a', x: '#3a2a1a', f: ['cap', 'belly'] },
  monk: { h: '#e8b888', r: '#d89a3a', R: '#a8721a', t: '#a83a2a', f: [] },
  scholar: { h: '#1a1a1a', r: '#e8e4d8', R: '#b8b4a8', t: '#3a5a8a', x: '#1a1a1a', f: ['cap'] },
  beggar: { h: '#3a3a2a', s: '#c09070', r: '#7a7058', R: '#5a5240', t: '#5a4a3a', f: ['messy'] },
  ghost: { h: '#e8f0f8', s: '#d0e8f0', r: '#c8d8f0', R: '#a0b8d8', t: '#e0e8f8', f: ['ghost'] },
  official: { h: '#1a1a1a', r: '#2a4a8a', R: '#1a3a6a', t: '#f0c040', x: '#1a1a1a', b: '#1a1a1a', f: ['official', 'beard'] },
  fisher: { h: '#2a2a2a', s: '#d0a070', r: '#4a6a7a', R: '#2a4a5a', t: '#c8b878', x: '#c8a858', f: ['strawhat'] },
  girl: { h: '#1a1a1a', r: '#f0a0a0', R: '#c87070', t: '#ffffff', f: ['tufts', 'skirt'], small: true },
  innkeeper: { h: '#2a2a2a', r: '#e8e0d0', R: '#b8b0a0', t: '#7a3a2a', x: '#ffffff', f: ['cap', 'belly'] },
  soldier: { h: '#2a2a2a', r: '#5a5a6a', R: '#3a3a4a', t: '#a83a2a', x: '#8a8a98', f: ['helmet'] },
};
function charGrid(dir, frame, d) {
  const src = dir === 'right' ? CT.left : CT[dir];
  const g = src.map(r => r.split(''));
  const F = d.f || [];
  const set = (y, x, c) => { if (y >= 0 && y < 16 && x >= 0 && x < 16) g[y][x] = c; };
  const side = dir === 'left' || dir === 'right', down = dir === 'down', up = dir === 'up';
  if (F.includes('ghost')) { for (let x = 0; x < 16; x++) { g[14][x] = '.'; } g[13] = '....krrrrrrk....'.split(''); }
  else if (frame === 1) {
    g[14] = side ? '......kkkk......'.split('') : '.....kk..kk.....'.split('');
  }
  if (F.includes('skirt')) { if (side) { g[13] = '...krrrRrrrk....'.split(''); } else { g[13] = '..krrrrRRrrrrk..'.split(''); } }
  if (F.includes('belly') && !up) { if (side) { set(10, 3, 'k'); set(10, 4, 'r'); set(11, 3, 'k'); set(11, 4, 't'); } else { set(10, 2, 'k'); set(11, 2, 'k'); set(11, 3, 't'); set(10, 13, 'k'); set(11, 13, 'k'); set(11, 12, 't'); } }
  if (F.includes('topknot')) { set(0, 7, 'k'); set(0, 8, 'k'); set(1, 7, 'h'); set(1, 8, 'h'); }
  if (F.includes('hat')) { for (let x = 5; x <= 10; x++) { set(1, x, 'x'); set(2, x, 'x'); } for (let x = 6; x <= 9; x++) set(0, x, 'x'); if (!up) set(3, 4, 'x'), set(3, 11, 'x'); }
  if (F.includes('cap')) { for (let x = 4; x <= 11; x++) { set(1, x, 'x'); set(2, x, 'x'); } for (let x = 5; x <= 10; x++) set(0, x, 'k'); }
  if (F.includes('helmet')) { for (let x = 4; x <= 11; x++) { set(1, x, 'x'); set(2, x, 'x'); set(3, x, 'x'); } set(0, 7, 'r'); set(0, 8, 'r'); if (down) { set(4, 3, 'x'); set(4, 12, 'x'); } }
  if (F.includes('strawhat')) { for (let x = 2; x <= 13; x++) set(3, x, 'x'); for (let x = 4; x <= 11; x++) set(2, x, 'x'); for (let x = 6; x <= 9; x++) set(1, x, 'x'); }
  if (F.includes('official')) { for (let x = 4; x <= 11; x++) { set(1, x, 'x'); set(2, x, 'x'); } for (let x = 5; x <= 10; x++) set(0, x, 'x'); if (!side) { for (const x of [1, 2, 3, 12, 13, 14]) set(2, x, 'x'); } else { set(2, 12, 'x'); set(2, 13, 'x'); set(2, 14, 'x'); } }
  if (F.includes('crown')) { for (let x = 5; x <= 10; x++) set(1, x, 'y'); for (const x of [5, 7, 8, 10]) set(0, x, 'y'); }
  if (F.includes('buns')) { if (!side) { for (const x of [3, 4, 11, 12]) { set(1, x, 'k'); set(2, x, 'x'); } set(2, 3, 'k'); set(2, 12, 'k'); } else { set(1, 10, 'k'); set(2, 10, 'x'); set(2, 11, 'x'); set(1, 11, 'k'); } }
  if (F.includes('messy')) { for (const x of [4, 6, 9, 11]) set(1, x, 'h'); set(0, 6, 'k'); set(0, 9, 'k'); }
  if (F.includes('tufts')) { if (!side) { set(2, 2, 'h'); set(2, 3, 'h'); set(2, 12, 'h'); set(2, 13, 'h'); set(1, 2, 'k'); set(1, 13, 'k'); } else { set(2, 12, 'h'); set(2, 13, 'h'); } }
  if (F.includes('antenna')) { set(0, 5, 'h'); set(0, 10, 'h'); set(1, 4, 'h'); set(1, 11, 'h'); }
  if (F.includes('flower') && !up) { set(2, side ? 9 : 10, 'y'); set(3, side ? 9 : 10, 'y'); }
  if (F.includes('moon') && down) { set(4, 7, 'y'); set(4, 8, 'y'); }
  if (F.includes('beard') && !up) { if (side) { set(7, 4, 'b'); set(7, 5, 'b'); set(8, 4, 'b'); } else { for (let x = 6; x <= 9; x++) set(7, x, 'b'); set(8, 7, 'b'); set(8, 8, 'b'); } }
  if (F.includes('longbeard') && !up) { if (side) { for (let y = 6; y <= 10; y++) set(y, 4, 'b'); set(7, 5, 'b'); set(8, 5, 'b'); } else { for (let x = 5; x <= 10; x++) set(7, x, 'b'); for (let x = 6; x <= 9; x++) { set(8, x, 'b'); set(9, x, 'b'); } set(10, 7, 'b'); set(10, 8, 'b'); } }
  if (F.includes('jie')) { const X = side ? (dir === 'left' ? 13 : 2) : (up ? 2 : 13); for (let y = 2; y <= 14; y++) set(y, X, 'j'); for (const y of [2, 4, 6]) { set(y, X - 1, 'q'); set(y, X + 1, 'q'); } set(1, X, 'q'); }
  if (F.includes('furhat')) { for (let x = 4; x <= 11; x++) { set(1, x, 'x'); set(2, x, 'x'); } for (let x = 5; x <= 10; x++) set(0, x, 'x'); if (!up) { set(3, 3, 'x'); set(4, 3, 'x'); set(3, 12, 'x'); set(4, 12, 'x'); } }
  if (F.includes('crutch')) { const cx = side ? (dir === 'left' ? 2 : 13) : 13; for (let y = 6; y <= 14; y++) set(y, down ? 14 : side ? 2 : 1, 'g'); set(6, down ? 13 : side ? 3 : 2, 'g'); void cx; }
  if (F.includes('gourd') && !side) { const X = up ? 6 : 3; set(9, X, 'y'); set(10, X, 'y'); set(10, X - 1, 'y'); set(8, X, 'k'); }
  if (F.includes('sword') && up) { for (let i = 0; i < 6; i++) set(8 + i, 4 + i, 'g'); set(7, 3, 'y'); }
  if (dir === 'right') return g.map(r => r.reverse());
  return g;
}
Gfx.char = function (key) {
  return cached('char|' + key, () => {
    const d = SPRITES[key] || SPRITES.man;
    const pal = { k: '#181018', h: d.h, s: d.s || '#f2c494', e: '#181018', m: d.s ? shadeHex(d.s, -0.25) : '#d89a7a', r: d.r, R: d.R, t: d.t, b: d.b || '#222', x: d.x || '#1a1a1a', y: d.y || '#f0c040', g: '#8a8a96', j: d.j || '#8a5a30', q: d.q || '#e8e0d0' };
    const out = {};
    for (const dir of ['down', 'up', 'left', 'right']) {
      out[dir] = [0, 1].map(fr => {
        const g = charGrid(dir, fr, d);
        const [c, x] = mkCanvas(16, 16);
        const oy = d.small ? 2 : 0;
        for (let y = 0; y < 16; y++) for (let X = 0; X < 16; X++) { const k = g[y][X]; if (k !== '.') px(x, X, y + oy - (fr && !d.small ? 0 : 0), pal[k] || '#f0f'); }
        if (d.small) { const [c2, x2] = mkCanvas(16, 16); x2.drawImage(c, 2, 3, 12, 13); return scaleCanvas(c2, 3); }
        return scaleCanvas(c, 3);
      });
    }
    return out;
  });
};

function mixHex(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const r = Math.round((A >> 16) + ((B >> 16) - (A >> 16)) * t), g = Math.round(((A >> 8) & 255) + (((B >> 8) & 255) - ((A >> 8) & 255)) * t), bl = Math.round((A & 255) + ((B & 255) - (A & 255)) * t);
  return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ===== 粒子特效 =====
const FX = {
  parts: [], pops: [], flashC: null, flashT: 0, flashMax: 1,
  clear() { this.parts = []; this.pops = []; this.flashT = 0; },
  flash(c, ms) { this.flashC = c; this.flashT = ms; this.flashMax = ms; },
  pop(x, y, text, color = '#ffffff') { this.pops.push({ x, y, text: String(text), color, t: 0 }); },
  add(p) { p.t = 0; this.parts.push(p); },
  update(dt) {
    for (const p of this.parts) { p.t += dt; if (p.vx != null) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += (p.g || 0) * dt / 16; } }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const p of this.pops) p.t += dt;
    this.pops = this.pops.filter(p => p.t < 1000);
    if (this.flashT > 0) this.flashT -= dt;
  },
  draw() {
    for (const p of this.parts) {
      const a = 1 - p.t / p.life; ctx.globalAlpha = clamp(a * (p.alpha || 1), 0, 1);
      ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
      if (p.type === 'dot') { const s = p.s * (p.shrink ? a : 1); ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s), Math.ceil(s)); }
      else if (p.type === 'line') { const k = Math.min(1, p.t / (p.life * 0.4)); ctx.lineWidth = p.w || 4; ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x1 + (p.x2 - p.x1) * k, p.y1 + (p.y2 - p.y1) * k); ctx.stroke(); }
      else if (p.type === 'ring') { ctx.lineWidth = p.w || 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (p.t / p.life), 0, Math.PI * 2); ctx.stroke(); }
      else if (p.type === 'bolt') { ctx.lineWidth = p.w || 5; ctx.beginPath(); p.pts.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
      else if (p.type === 'ray') { ctx.fillRect(p.x - p.w / 2, 0, p.w, p.y); }
      else if (p.type === 'arrow') { ctx.beginPath(); ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x - 8, p.y); ctx.lineTo(p.x - 3, p.y); ctx.lineTo(p.x - 3, p.y + 10); ctx.lineTo(p.x + 3, p.y + 10); ctx.lineTo(p.x + 3, p.y); ctx.lineTo(p.x + 8, p.y); ctx.closePath(); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const p of this.pops) {
      const yy = p.y - Math.min(1, p.t / 200) * 26 + (p.t > 200 && p.t < 400 ? Math.sin((p.t - 200) / 200 * Math.PI) * -8 : 0);
      ctx.globalAlpha = p.t > 750 ? 1 - (p.t - 750) / 250 : 1;
      ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(p.text, p.x, yy); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, yy);
      ctx.globalAlpha = 1;
    }
    if (this.flashT > 0) { ctx.globalAlpha = clamp(this.flashT / this.flashMax, 0, 1) * 0.6; ctx.fillStyle = this.flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  },
  burst(x, y, n, cols, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + (Math.random() - .5) * (o.spread || 1) : Math.random() * Math.PI * 2, sp = (o.sp || 3) * (0.4 + Math.random());
      this.add({ type: 'dot', x: x + (Math.random() - .5) * (o.w || 30), y: y + (Math.random() - .5) * (o.h || 30), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0, s: o.s || 6, c: pick(cols), life: (o.life || 600) * (0.6 + Math.random() * 0.6), shrink: true });
    }
  }
};
// 元素特效：targets 是 {x,y} 数组，返回持续毫秒
