'use strict';
// ===== 世界地图（粗格，每格 4×4 地块） =====
// 剧本提供 WORLD_DEF：{ name, coarse: 粗格字符串数组, zones: [{z,x0,y0,x1,y1}], zoneInfo: {z: {ground, mtn}}, start: 起点 LOCS 键, seed }
// 粗格字符：^ 山  ~ 水  T 林  h 丘  . g d s * 各种地面  2-7 关卡（flag gateN 打开）  其余字母 = LOCS 里的地点
function zoneAtCoarse(cx, cy) { for (const z of WORLD_DEF.zones) if (cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1) return z.z; return WORLD_DEF.zones[0].z; }
const zoneInfoAt = (cx, cy) => WORLD_DEF.zoneInfo[zoneAtCoarse(cx, cy)];
const SOLID_W = new Set(['^', '~', 'Q', 'R', 'S', '2', '3', '4', '5', '6', '7']);
const GATES = '234567';

let WORLD = null;
function genWorld() {
  const CO = WORLD_DEF.coarse, r = mkRng(WORLD_DEF.seed || 8888), WW = CO[0].length * 4, WH = CO.length * 4;
  const t = Array.from({ length: WH }, () => Array(WW).fill('^'));
  const locs = [];
  for (let cy = 0; cy < CO.length; cy++) for (let cx = 0; cx < CO[0].length; cx++) {
    const ch = CO[cy][cx], zi = zoneInfoAt(cx, cy);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const X = cx * 4 + x, Y = cy * 4 + y, q = r();
      let v;
      if (ch === '^') v = zi.mtn;
      else if (ch === '~') v = '~';
      else if (GATES.includes(ch)) v = ch;
      else if (ch === 'T') v = q < 0.8 ? (zi.ground === '*' ? 'P' : 'T') : zi.ground;
      else if (ch === 'h') v = q < 0.7 ? 'h' : zi.ground;
      else {
        const g = 'gds*'.includes(ch) ? ch : zi.ground;
        v = g;
        if (g === '.') v = q < 0.08 ? 'T' : q < 0.12 ? ':' : q < 0.15 ? 'h' : '.';
        else if (g === 'g') v = q < 0.1 ? 'G' : 'g';
        else if (g === 'd') v = q < 0.06 ? 'D' : 'd';
        else if (g === '*') v = q < 0.1 ? 'P' : '*';
      }
      t[Y][X] = v;
    }
    if (LOCS[ch] && !LOCS[ch].x) { LOCS[ch].x = cx * 4 + 1; LOCS[ch].y = cy * 4 + 2; }
  }
  // 山体边缘侵蚀（只侵蚀一层，不会打通关卡）
  const snap = t.map(row => row.slice());
  const pass = (x, y) => snap[y] && snap[y][x] && !SOLID_W.has(snap[y][x]);
  for (let y = 1; y < WH - 1; y++) for (let x = 1; x < WW - 1; x++) {
    if (!'^QRS'.includes(snap[y][x])) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (pass(x + dx, y + dy) && r() < 0.35) { const n = snap[y + dy][x + dx]; t[y][x] = '.gd*s'.includes(n) ? n : zoneInfoAt(x >> 2, y >> 2).ground; break; }
  }
  for (const k in LOCS) { const L = LOCS[k]; t[L.y][L.x] = zoneInfoAt(L.x >> 2, L.y >> 2).ground; locs.push(L); }
  const chests = worldFeatures(t, locs, mkRng(9999));
  // 地标占的格子走不通，只留最下面一排正中的入口；关卡整块配一幅画
  const blocked = new Set(), GA = typeof GATE_ART !== 'undefined' ? GATE_ART : {};
  for (const L of locs) {
    const A = L.art && LANDMARKS[L.art]; if (!A) continue;
    const ox = L.x - Math.floor(A.w / 2), oy = L.y - A.h + 1;
    for (let y = oy; y <= L.y; y++) for (let x = ox; x < ox + A.w; x++) if (x !== L.x || y !== L.y) blocked.add(y * WW + x);
  }
  const gateBoxes = Object.keys(GA).map(c => { let x0 = 1e9, y0 = 1e9; t.forEach((row, y) => row.forEach((v, x) => { if (v === c) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); } })); return { c, art: GA[c], x: x0, y: y0 }; }).filter(g => g.x < 1e9);
  return { kind: 'w', id: 'world', name: WORLD_DEF.name, w: WW, h: WH, tiles: t, locs, music: WORLD_DEF.music || 'field', npcs: [], chests, buildings: [], blocked, gateBoxes };
}

// ===== 地形工具（世界、城镇、迷宫共用） =====
const CHEST_MARK = '¤'; // 放宝箱时临时占位，算连通时当作障碍
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function reachSet(t, pass, start) {
  const h = t.length, w = t[0].length, seen = new Set([start[1] * w + start[0]]), q = [start];
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of DIR4) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h || seen.has(Y * w + X) || !pass(X, Y)) continue; seen.add(Y * w + X); q.push([X, Y]); } }
  return seen;
}
// 逐个放置障碍：只要有原本走得到的格子被隔断，就撤回。cand 元素为 [x, y, 地块?]
function placeProps(t, cand, n, pass, start, keys, tile) {
  const w = t[0].length;
  let seen = reachSet(t, pass, start), total = seen.size;
  const need = keys.filter(([x, y]) => seen.has(y * w + x));
  const placed = [];
  for (const c of cand) {
    if (placed.length >= n) break;
    const [x, y] = c; if (!seen.has(y * w + x) || (x === start[0] && y === start[1])) continue;
    const old = t[y][x]; t[y][x] = c[2] || tile;
    const s2 = reachSet(t, pass, start);
    if (s2.size === total - 1 && need.every(([a, b]) => s2.has(b * w + a))) { placed.push([x, y, old]); seen = s2; total--; }
    else t[y][x] = old;
  }
  return placed;
}
// 宝箱同样不许堵路；彼此至少隔开 gap 格，放不下时放宽到 2 格。返回位置后复原地块
function placeChests(t, cand, n, pass, start, keys, gap) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let got = null;
    for (const g of [gap, 2]) {
      const c = cand.filter(([x, y]) => out.every(o => Math.abs(o[0] - x) + Math.abs(o[1] - y) >= g));
      got = placeProps(t, c, 1, pass, start, keys, CHEST_MARK)[0];
      if (got) break;
    }
    if (!got) break;
    out.push(got);
  }
  for (const [x, y, old] of out) t[y][x] = old;
  return out;
}
// 角落分：周围八格里障碍越多，越像藏东西的地方
function nookScore(pass, x, y) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !pass(x + dx, y + dy)) n++; return n; }
// 以种子为中心随机游走，长成一小团
function grow(cand, x, y, size, tile, r) { for (let k = 0; k < size; k++) { cand.push([x, y, tile]); const [dx, dy] = DIR4[Math.floor(r() * 4)]; x += dx; y += dy; } }

const WORLD_DECOR = {
  '.': { solid: ['~', '~', '^'], deco: ['T', 'T', 'h', ':'] },
  g: { solid: ['Q', '~'], deco: ['G', 'G', 'G'] },
  d: { solid: ['R', 'R', '~'], deco: ['D', 'D'] },
  '*': { solid: ['S', '~'], deco: ['P', 'P'] },
};
const W_GROUND = '.gd*s:';
function worldFeatures(t, locs, r) {
  const pass = (x, y) => t[y] && t[y][x] != null && t[y][x] !== CHEST_MARK && (!SOLID_W.has(t[y][x]) || GATES.includes(t[y][x]));
  const keys = locs.map(L => [L.x, L.y]);
  const marks = keys.slice(); t.forEach((row, y) => row.forEach((c, x) => { if (GATES.includes(c)) marks.push([x, y]); }));
  const near = (x, y, d) => marks.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= d);
  const start = [LOCS[WORLD_DEF.start].x, LOCS[WORLD_DEF.start].y];
  const zoneCells = z => { const out = []; for (let y = z.y0 * 4; y < (z.y1 + 1) * 4; y++) for (let x = z.x0 * 4; x < (z.x1 + 1) * 4; x++) if (t[y] && W_GROUND.includes(t[y][x])) out.push([x, y]); return out; };
  // 地形：可走的树林丘陵 + 不可走的湖泊山石
  for (const z of WORLD_DEF.zones) {
    const dec = WORLD_DECOR[WORLD_DEF.zoneInfo[z.z].ground] || WORLD_DECOR['.'];
    const cells = shuffle(zoneCells(z).filter(([x, y]) => !near(x, y, 2)), r);
    const nd = Math.round(cells.length / 40), nc = Math.round(cells.length / 26);
    cells.slice(0, nd).forEach(([x, y]) => { const tl = dec.deco[Math.floor(r() * dec.deco.length)]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t[y + dy] && W_GROUND.includes(t[y + dy][x + dx]) && !near(x + dx, y + dy, 1) && r() < 0.55) t[y + dy][x + dx] = tl; });
    const cand = [];
    cells.slice(nd, nd + nc).forEach(([x, y]) => grow(cand, x, y, 2 + Math.floor(r() * 5), dec.solid[Math.floor(r() * dec.solid.length)], r));
    placeProps(t, cand.filter(([x, y]) => !near(x, y, 2) && t[y] && t[y][x] != null && !SOLID_W.has(t[y][x])), 999, pass, start, keys);
  }
  // 文物与任务物品：只放剧本指定的，藏在角落
  const chests = [];
  for (const z of WORLD_DEF.zones) {
    const cand = zoneCells(z).filter(([x, y]) => pass(x, y) && !near(x, y, 3))
      .map(([x, y]) => [x, y, nookScore(pass, x, y) + r() * 3]).sort((a, b) => b[2] - a[2]).map(([x, y]) => [x, y]);
    const specs = pickupsFor('world:' + z.z);
    placeChests(t, cand, specs.length, pass, start, keys, 7).forEach(([x, y], i) => chests.push(specs[i](x, y)));
  }
  return chests;
}

// 某张地图上要放的东西：剧本 RELICS 里的文物 + 该处的任务物品。返回 (x, y) => 宝箱对象 的列表
function pickupsFor(where) {
  const out = RELICS.map((R, i) => [R, i]).filter(([R]) => R.at === where).map(([R, i]) => (x, y) => ({ x, y, card: R.card, say: R.say, key: 'c:r:' + i }));
  return out.concat(questChestsFor(where).map(q => (x, y) => questChest(q, x, y)));
}

// ===== 城镇 =====
const TOWN_CACHE = {};
function genTown(id) {
  if (TOWN_CACHE[id]) return TOWN_CACHE[id];
  const def = TOWNS[id], big = def.size !== 'small';
  const w = big ? 28 : 22, h = big ? 22 : 16;
  const r = mkRng(hashStr('town' + id));
  const t = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? '#' : ','));
  const ex = w >> 1; t[h - 1][ex] = 'E'; t[h - 1][ex - 1] = 'E';
  // yOffset：整排建筑往下挪几格，给高出屋顶的建筑（比如烽火台）留出天空
  const oy = def.yOffset || 0, xs = big ? [2, 8, 14, 20] : [2, 8, 14], ys = (big ? [2, 8, 14] : [2, 8]).map(y => y + oy);
  const slots = []; for (const y of ys) for (const x of xs) slots.push([x, y]);
  const buildings = [];
  def.b.forEach((b, i) => {
    const [sx, sy] = b.slot != null ? slots[b.slot] : slots[i];
    for (let y = sy; y < sy + 3; y++) for (let x = sx; x < sx + 5; x++) t[y][x] = 'B';
    t[sy + 2][sx + 2] = 'D';
    buildings.push(Object.assign({ x: sx, y: sy, w: 5, h: 3, door: { x: sx + 2, y: sy + 2 } }, b));
  });
  const used = new Set(def.b.map((b, i) => b.slot != null ? b.slot : i));
  slots.forEach(([sx, sy], i) => {
    if (used.has(i)) return;
    const kind = def.decor ? def.decor[i % def.decor.length] : pick(['pond', 'garden', 'trees', 'plaza']);
    for (let y = sy; y < sy + 3; y++) for (let x = sx; x < sx + 5; x++) {
      const edge = x === sx || x === sx + 4 || y === sy || y === sy + 2;
      if (kind === 'pond') t[y][x] = edge ? (r() < 0.5 ? ':' : ',') : '~';
      else if (kind === 'garden') t[y][x] = r() < 0.7 ? ':' : 't';
      else if (kind === 'trees') t[y][x] = r() < 0.6 ? 't' : ',';
      else if (kind === 'plaza') t[y][x] = x === sx + 2 && y === sy + 1 ? 'o' : '_';
      else if (kind === 'field') t[y][x] = 'b';
    }
  });
  for (const [sx, sy] of slots) { t[sy + 1][sx + 5] = r() < 0.5 ? 't' : ':'; if (big) t[sy + 3][sx + 5] = 'l'; }
  for (let x = 1; x < w - 1; x++) if (t[h - 2][x] !== ',' && Math.abs(x - ex) < 2) t[h - 2][x] = ',';
  const chests = townFeatures(t, r, id, def, buildings, w, h, ex);
  const m = { kind: 't', id: 'town:' + id, tid: id, name: def.name, w, h, tiles: t, theme: def.theme || 'city', music: def.music || 'town', buildings, chests, npcs: [] };
  TOWN_CACHE[id] = m;
  return m;
}
// 城镇地形：石板路、河道与桥、散落的障碍物，以及藏在角落的宝箱
const T_PASS = ',_:E-=';
function townFeatures(t, r, id, def, buildings, w, h, ex) {
  const big = w > 22, f = def.features || {};
  const keys = buildings.map(b => [b.door.x, b.door.y + 1]).concat([[ex, h - 2]], (def.npcs || []).map(n => [n.x, n.y]));
  for (let y = h - 2; y >= 1; y--) { const c = t[y][ex - 1]; if (c === 'B' || c === 'D') break; if (',:tl'.includes(c)) t[y][ex - 1] = '-'; }
  for (const y of f.road || (big ? [6, 18] : [6, 12])) for (let x = 1; x < w - 1; x++) if (t[y][x] === ',') t[y][x] = '-';
  if (f.canal) { const y = f.canal.y; for (let x = 1; x < w - 1; x++) t[y][x] = f.canal.bridges.includes(x) || x === ex - 1 ? '=' : '~'; }
  const pass = (x, y) => t[y] && t[y][x] != null && T_PASS.includes(t[y][x]);
  const near = (x, y) => keys.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= 1);
  const tiles = f.tiles || ['r', 'k', 't', 't'], start = [ex, h - 2];
  const cand = [];
  for (let y = 1; y < h - 2; y++) for (let x = 1; x < w - 1; x++) if (t[y][x] === ',' && !near(x, y)) cand.push([x, y, tiles[Math.floor(r() * tiles.length)]]);
  placeProps(t, shuffle(cand, r), f.props ?? (big ? 18 : 11), pass, start, keys);
  const cc = [];
  for (let y = 1; y < h - 2; y++) for (let x = 1; x < w - 1; x++) if (t[y][x] === ',' && !near(x, y)) cc.push([x, y, nookScore(pass, x, y) + r() * 2]);
  cc.sort((a, b) => b[2] - a[2]);
  const specs = pickupsFor('town:' + id);
  return placeChests(t, cc.map(([x, y]) => [x, y]), specs.length, pass, start, keys, 7).map(([x, y], i) => specs[i](x, y));
}
function townEntry(id) { const m = genTown(id); return { x: m.w >> 1, y: m.h - 2 }; }

// ===== 迷宫 =====
const DUN_CACHE = {};
function genCave(w, h, r) {
  let g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 || r() < 0.44) ? 1 : 0));
  for (let it = 0; it < 5; it++) {
    const n = g.map(row => row.slice());
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += g[y + dy][x + dx];
      n[y][x] = c >= 5 || (it < 2 && c === 0) ? 1 : 0;
    }
    g = n;
  }
  return g;
}
function genRooms(w, h, r) {
  const g = Array.from({ length: h }, () => Array(w).fill(1));
  const rooms = [];
  for (let tries = 0; tries < 200 && rooms.length < 11; tries++) {
    const rw = 4 + Math.floor(r() * 6), rh = 3 + Math.floor(r() * 5);
    const x = 1 + Math.floor(r() * (w - rw - 2)), y = 1 + Math.floor(r() * (h - rh - 2));
    if (rooms.some(o => x < o.x + o.w + 1 && x + rw + 1 > o.x && y < o.y + o.h + 1 && y + rh + 1 > o.y)) continue;
    rooms.push({ x, y, w: rw, h: rh });
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) g[yy][xx] = 0;
  }
  rooms.sort((a, b) => a.x - b.x);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let x = a.x + (a.w >> 1), y = a.y + (a.h >> 1); const tx = b.x + (b.w >> 1), ty = b.y + (b.h >> 1);
    while (x !== tx) { g[y][x] = 0; x += Math.sign(tx - x); }
    while (y !== ty) { g[y][x] = 0; y += Math.sign(ty - y); }
  }
  for (let i = 0; i + 2 < rooms.length; i += 3) { const a = rooms[i], b = rooms[i + 2]; let x = a.x + 1, y = a.y + 1; const tx = b.x + 1, ty = b.y + 1; while (y !== ty) { g[y][x] = 0; y += Math.sign(ty - y); } while (x !== tx) { g[y][x] = 0; x += Math.sign(tx - x); } }
  return g;
}
function bfs(g, sx, sy) {
  const h = g.length, w = g[0].length, d = Array.from({ length: h }, () => Array(w).fill(-1));
  const q = [[sx, sy]]; d[sy][sx] = 0;
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (g[Y] && g[Y][X] === 0 && d[Y][X] < 0) { d[Y][X] = d[y][x] + 1; q.push([X, Y]); } } }
  return { d, q };
}
function genDungeon(did, floor) {
  const key = did + ':' + floor;
  if (DUN_CACHE[key]) return DUN_CACHE[key];
  const def = DUNGEONS[did];
  const [bw, bh] = def.size; const w = bw + floor * 2, h = bh + floor * 2;
  let g, up, down, tries = 0, region;
  for (; ;) {
    const r = mkRng(hashStr(key) + tries * 101);
    g = def.gen === 'rooms' ? genRooms(w, h, r) : genCave(w, h, r);
    const floors = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (!g[y][x]) floors.push([x, y]);
    if (!floors.length) { tries++; continue; }
    let best = null;
    const seen = new Set();
    for (const [x, y] of floors) { if (seen.has(y * w + x)) continue; const { q } = bfs(g, x, y); q.forEach(([a, b]) => seen.add(b * w + a)); if (!best || q.length > best.length) best = q; }
    region = best;
    if (region.length > w * h * (def.gen === 'rooms' ? 0.2 : 0.33) || tries > 30) break;
    tries++;
  }
  const inReg = new Set(region.map(([x, y]) => y * w + x));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!inReg.has(y * w + x)) g[y][x] = 1;
  const r = mkRng(hashStr(key + 'p'));
  const s = region[Math.floor(r() * region.length)];
  let res = bfs(g, s[0], s[1]); up = res.q[res.q.length - 1];
  res = bfs(g, up[0], up[1]); down = res.q[res.q.length - 1];
  const dUp = res.d, dDown = bfs(g, down[0], down[1]).d;
  const t = g.map(row => row.map(v => v ? '#' : ','));
  const isLast = floor === def.floors - 1;
  t[up[1]][up[0]] = '<';
  t[down[1]][down[0]] = isLast ? '!' : '>';
  // 宝箱：剧情宝箱、任务宝箱、额外的随机宝箱；优先死胡同，且不许堵路
  const specs = pickupsFor('dun:' + key);
  const score = (x, y) => { let n = 0; for (const [dx, dy] of DIR4) if (t[y + dy][x + dx] !== '#') n++; return (n === 1 ? 100 : 0) + r() * 50 + dUp[y][x]; };
  const cand = region.filter(([x, y]) => dUp[y][x] > 6 && dDown[y][x] > 3 && t[y][x] === ',').map(([x, y]) => [x, y, score(x, y)]).sort((a, b) => b[2] - a[2])
    .concat(region.filter(([x, y]) => dUp[y][x] > 2 && dUp[y][x] <= 6 && t[y][x] === ',')).map(([x, y]) => [x, y]);
  const dpass = (x, y) => t[y] && t[y][x] != null && t[y][x] !== '#' && t[y][x] !== CHEST_MARK;
  const chests = placeChests(t, cand, specs.length, dpass, up, [down], 5).map(([x, y], i) => specs[i](x, y));
  dunProps(t, r, dunPropsOf(def), up, down, chests);
  const m = { kind: 'd', id: 'dun:' + key, did, floor, name: def.name + (def.floors > 1 ? ` · ${['一', '二', '三', '四', '五'][floor]}层` : ''), w, h, tiles: t, theme: def.theme, music: def.music || 'dungeon', bg: def.bg, dark: def.dark, up: { x: up[0], y: up[1] }, down: { x: down[0], y: down[1] }, chests, npcs: [], buildings: [] };
  DUN_CACHE[key] = m;
  return m;
}

// 迷宫地形：成团的障碍（石堆、石柱、水池）与可走的装饰地面
const D_SOLID = '#qpw';
function dunPropsOf(def) {
  if (def.props) return def.props;
  const rooms = def.gen === 'rooms', area = def.size[0] * def.size[1];
  return { solid: rooms ? ['q', 'p'] : ['q', 'p', 'w'], deco: 'f', clusters: Math.round(area / 30), maxSize: rooms ? 3 : 4, decoN: Math.round(area / 70) };
}
function dunProps(t, r, P, up, down, chests) {
  const h = t.length, w = t[0].length;
  for (const c of chests) t[c.y][c.x] = CHEST_MARK;
  const keys = [up, down].concat(chests.map(c => [c.x, c.y]));
  const near = (x, y) => keys.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= 2);
  const floor = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (t[y][x] === ',') floor.push([x, y]);
  for (let i = 0; i < (P.decoN || 0); i++) { const [x, y] = floor[Math.floor(r() * floor.length)]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t[y + dy][x + dx] === ',' && r() < 0.6) t[y + dy][x + dx] = P.deco; }
  const cand = [];
  shuffle(floor.slice(), r).slice(0, P.clusters).forEach(([x, y]) => grow(cand, x, y, 1 + Math.floor(r() * (P.maxSize || 4)), P.solid[Math.floor(r() * P.solid.length)], r));
  const pass = (x, y) => t[y] && t[y][x] != null && !D_SOLID.includes(t[y][x]) && t[y][x] !== CHEST_MARK;
  placeProps(t, cand.filter(([x, y]) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && (t[y][x] === ',' || t[y][x] === P.deco) && !near(x, y)), 999, pass, up, [down]);
  for (const c of chests) t[c.y][c.x] = ',';
}

// ===== 地图场景 =====
function loadMap(id) {
  if (id === 'world') return WORLD || (WORLD = genWorld());
  if (id.startsWith('town:')) return genTown(id.slice(5));
  const [, did, f] = id.split(':'); return genDungeon(did, +f);
}
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const MapScene = {
  map: null, px: 0, py: 0, dir: 'down', moving: false, mt: 0, fx: 0, fy: 0, trail: [], time: 0, banner: null, bumpT: 0, npcs: [],
  enter(id, x, y, dir) {
    this.map = loadMap(id);
    if (!this.passTile(x, y)) { outer: for (let rad = 1; rad < 8; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (this.passTile(x + dx, y + dy)) { x += dx; y += dy; break outer; } }
    this.px = x; this.py = y; this.dir = dir || this.dir; this.moving = false; this.mt = 0;
    this.trail = [0, 1, 2].map(() => ({ x, y, dir: this.dir }));
    G.pos = { map: id, x, y, dir: this.dir };
    this.refresh();
    if (this.map.kind === 't') { G.visited[this.map.tid] = true; }
    Snd.play(this.musicFor());
    if (this.map.name && this.map.kind !== 'w') this.banner = { text: this.map.name, t: 2200 };
  },
  musicFor() { const m = this.map; if (m.kind === 'w') return 'field'; if (m.kind === 't') return m.music; return m.music; },
  refresh() {
    const m = this.map; if (!m) return;
    if (m.kind === 't') {
      const def = TOWNS[m.tid];
      this.npcs = (def.npcs || []).filter(n => !n.cond || n.cond()).map(n => {
        let x = n.x, y = n.y;
        if (!this.free(x, y, true)) { outer: for (let rad = 1; rad < 5; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (this.free(n.x + dx, n.y + dy, true)) { x = n.x + dx; y = n.y + dy; break outer; } }
        return { def: n, x, y, hx: x, hy: y, dir: n.dir || 'down', mt: 0, fx: x, fy: y, t: Math.random() * 2000 };
      });
    } else if (m.kind === 'd') {
      const ev = DUNGEONS[m.did].npcs; this.npcs = ((ev && ev[m.floor]) || []).filter(n => !n.cond || n.cond()).map(n => ({ def: n, x: n.x === 'up' ? m.up.x + 1 : n.x, y: n.y === 'up' ? m.up.y : n.y, dir: 'down', mt: 0, t: 0, fixed: true }));
      for (const n of this.npcs) if (!this.free(n.x, n.y, true)) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) if (this.free(m.up.x + dx, m.up.y + dy, true)) { n.x = m.up.x + dx; n.y = m.up.y + dy; break; } }
    } else this.npcs = [];
  },
  tileAt(x, y) {
    const m = this.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
    return m.tiles[y][x];
  },
  passTile(x, y) {
    const t = this.tileAt(x, y); if (t == null) return false;
    const k = this.map.kind;
    if (k === 'w') { if (this.map.blocked && this.map.blocked.has(y * this.map.w + x)) return false; if (GATES.includes(t)) return !!G.flags['gate' + t]; return !SOLID_W.has(t); }
    if (k === 't') return T_PASS.includes(t);
    return !D_SOLID.includes(t);
  },
  objAt(x, y) {
    const m = this.map;
    for (const c of m.chests) if (c.x === x && c.y === y && chestShown(c)) return { type: 'chest', c };
    for (const n of this.npcs) if (n.x === x && n.y === y) return { type: 'npc', n };
    for (const b of m.buildings) if (b.door.x === x && b.door.y === y) return { type: 'door', b };
    return null;
  },
  free(x, y, ignoreNpc) {
    if (!this.passTile(x, y)) return false;
    const o = this.objAt(x, y);
    if (o && (o.type !== 'npc' || !ignoreNpc)) return false;
    if (this.map.kind === 't' && this.tileAt(x, y) === 'E') return !ignoreNpc;
    return true;
  },
  update(dt) {
    this.time += dt;
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.bumpT > 0) this.bumpT -= dt;
    this.updateNpcs(dt);
    if (this.moving) {
      this.mt += dt / 150;
      if (this.mt >= 1) { this.moving = false; this.mt = 0; G.pos.x = this.px; G.pos.y = this.py; G.pos.dir = this.dir; runScript(() => this.arrive()); }
      return;
    }
    if (Script.busy || UI.busy() || Fade.a > 0.01) return;
    if (Input.tap('a')) { const [dx, dy] = DIRV[this.dir]; const o = this.objAt(this.px + dx, this.py + dy); if (o) runScript(() => this.interact(o)); return; }
    if (Input.tap('b')) { runScript(() => fieldMenu()); return; }
    const d = Input.dir();
    if (d) this.tryMove(d);
  },
  tryMove(d) {
    this.dir = d; const [dx, dy] = DIRV[d]; const nx = this.px + dx, ny = this.py + dy;
    const m = this.map;
    if (m.kind === 't' && (ny >= m.h || nx < 0 || nx >= m.w || ny < 0)) { runScript(() => this.leaveTown()); return; }
    const o = this.objAt(nx, ny);
    if (o && o.type !== 'npc') { runScript(() => this.interact(o)); return; }
    if (!this.free(nx, ny)) {
      const t = this.tileAt(nx, ny);
      if (m.kind === 'w' && t && GATES.includes(t) && this.bumpT <= 0) { this.bumpT = 600; runScript(() => gateMessage(t)); }
      return;
    }
    this.trail.unshift({ x: this.px, y: this.py, dir: d }); this.trail.length = 3;
    this.fx = this.px; this.fy = this.py; this.px = nx; this.py = ny; this.moving = true; this.mt = 0;
  },
  async arrive() {
    const m = this.map, x = this.px, y = this.py, t = this.tileAt(x, y);
    if (m.kind === 'w') {
      for (const L of m.locs) if (L.x === x && L.y === y && (!L.cond || L.cond())) { await enterLoc(L); return; }
    } else if (m.kind === 't') {
      if (t === 'E') { await this.leaveTown(); return; }
    } else if (m.kind === 'd') {
      const def = DUNGEONS[m.did];
      if (t === '<') { Snd.sfx('stairs'); if (m.floor === 0) { if (def.noExit) { await narr('四周白茫茫一片，找不到出去的路……'); return; } await exitToWorld(def.loc); } else { const p = loadMap(`dun:${m.did}:${m.floor - 1}`); await warp(p.id, p.down.x, p.down.y); } return; }
      if (t === '>') { Snd.sfx('stairs'); const n = loadMap(`dun:${m.did}:${m.floor + 1}`); await warp(n.id, n.up.x, n.up.y); return; }
      if (t === '!') { Snd.sfx('gate'); if (def.portal) await STORY[def.portal](); else await exitToWorld(def.loc); return; }
    }
  },
  async interact(o) {
    if (o.type === 'npc') {
      const n = o.n, d = n.def;
      const [dx, dy] = [this.px - n.x, this.py - n.y];
      n.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if (await questTalk(d)) { /* 任务对话已处理 */ }
      else if (d.fn) await d.fn(n);
      else { const lines = typeof d.say === 'function' ? d.say() : d.say; await say(d.name || null, lines); }
      if (d.card && (!d.cardIf || d.cardIf())) await getCard(d.card);
      if (d.learn) await learn(d.learn); // 重生模式：说完给一条消息
      this.refresh();
    } else if (o.type === 'chest') {
      const c = o.c; if (G.flags[c.key]) return;
      Snd.sfx('chest'); G.flags[c.key] = 1;
      if (c.quest) await questFound(c);
      else { if (c.say) await narr(c.say); await getCard(c.card); }
    } else if (o.type === 'door') {
      Snd.sfx('door');
      await enterBuilding(o.b, this.map.tid);
      this.refresh();
    }
  },
  async leaveTown() { const L = Object.values(LOCS).find(l => l.id === this.map.tid); await exitToWorld(L); },
  updateNpcs(dt) {
    for (const n of this.npcs) {
      if (n.mt > 0) { n.mt += dt / 260; if (n.mt >= 1) n.mt = 0; continue; }
      if (n.fixed || n.def.still || this.map.kind !== 't') continue;
      n.t -= dt; if (n.t > 0) continue;
      n.t = 1200 + Math.random() * 2500;
      if (Script.busy || UI.busy()) continue;
      const d = pick(['up', 'down', 'left', 'right']); const [dx, dy] = DIRV[d]; const X = n.x + dx, Y = n.y + dy;
      n.dir = d;
      if (Math.abs(X - n.hx) > 2 || Math.abs(Y - n.hy) > 2) continue;
      if (!this.free(X, Y) || (X === this.px && Y === this.py) || this.tileAt(X, Y) === 'E') continue;
      if (this.trail.some(p => p.x === X && p.y === Y)) continue;
      n.fx = n.x; n.fy = n.y; n.x = X; n.y = Y; n.mt = 0.001;
    }
  },
  draw() {
    const m = this.map; if (!m) return;
    const [sx, sy] = Shake.off();
    const k = this.moving ? this.mt : 1;
    const lx = (this.moving ? this.fx + (this.px - this.fx) * k : this.px) * TS, ly = (this.moving ? this.fy + (this.py - this.fy) * k : this.py) * TS;
    let camX = Math.round(lx - W / 2 + TS / 2), camY = Math.round(ly - H / 2 + TS / 2);
    camX = clamp(camX, 0, m.w * TS - W); camY = clamp(camY, 0, m.h * TS - H);
    camX -= sx; camY -= sy;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    const f2 = Math.floor(this.time / 450) % 2, f4 = Math.floor(this.time / 200) % 4;
    for (let y = y0; y <= y0 + 12; y++) for (let x = x0; x <= x0 + 16; x++) {
      const t = this.tileAt(x, y); if (t == null) continue;
      const dx = x * TS - camX, dy = y * TS - camY, v = (x * 7 + y * 13) % 3;
      let img;
      if (m.kind === 'w') { let c = t; if (GATES.includes(t) && G.flags['gate' + t]) c = '='; if (GATES.includes(t) && m.gateBoxes.some(g => g.c === t)) c = zoneInfoAt(x >> 2, y >> 2).ground; img = Gfx.tile('w', c, '', v, c === '~' || c === '4' ? f2 : 0); }
      else if (m.kind === 't') img = Gfx.tile('t', t, m.theme, v, t === '~' ? f2 : 0);
      else { let c = t; if (t === '#') { const b = this.tileAt(x, y + 1); c = b && b !== '#' ? 'face' : 'top'; } img = Gfx.tile('d', c, m.theme, v, c === '!' ? f4 : 0); }
      ctx.drawImage(img, dx, dy);
    }
    const marks = [];
    if (m.kind === 'w') {
      for (const L of m.locs) {
        if (L.cond && !L.cond()) continue;
        const A = L.art && LANDMARKS[L.art];
        if (!A) { if (L.icon) ctx.drawImage(Gfx.loc(L.icon, f4), L.x * TS - camX, L.y * TS - camY); continue; }
        const ox = L.x - Math.floor(A.w / 2), oy = L.y - A.h + 1;
        marks.push({ y: oy - 0.01, fn: () => { const X = ox * TS - camX, Y = oy * TS - camY; ctx.drawImage(Gfx.landmark(L.art), X, Y - A.top * 3); if (A.fx) A.fx(ctx, X, Y, this.time); } });
      }
      for (const g of m.gateBoxes) { const A = LANDMARKS[g.art]; marks.push({ y: g.y - 0.01, fn: () => ctx.drawImage(Gfx.landmark(g.art, { open: !!G.flags['gate' + g.c] }), g.x * TS - camX, g.y * TS - camY - A.top * 3) }); }
    }
    // 建筑和人物一起按行排序：站在建筑北边（后面）的人会被高出的屋顶挡住
    const blds = m.buildings.map(b => ({ y: b.y - 0.01, fn: () => {
      const def = TOWNS[m.tid];
      const art = b.art || def.art || ((b.style || def.style) === 'yurt' ? 'yurt' : 'hall'), A = BUILDINGS[art] || BUILDINGS.hall;
      const bx = b.x * TS - camX, by = b.y * TS - camY;
      ctx.drawImage(Gfx.bld(art, { roof: b.roof || def.roof, wall: b.wall || def.wall, washing: b.washing }), bx, by - A.top * 3);
      if (A.fx) A.fx(ctx, bx, by, this.time);
      if (b.label) {
        ctx.font = `bold 15px ${FONT}`; const tw = ctx.measureText(b.label).width + 14;
        const cx = (b.x + b.w / 2) * TS - camX, cy = by + A.label * 3;
        ctx.fillStyle = '#5a1810'; ctx.fillRect(cx - tw / 2, cy, tw, 24); ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 2; ctx.strokeRect(cx - tw / 2 + 1, cy + 1, tw - 2, 22);
        ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.label, cx, cy + 13);
        if (Settings.pinyin) drawRuby(b.label, cx, cy - 1, { align: 'center', size: 15, color: '#ffe08a', rubyBg: 'rgba(40,14,8,0.85)', shadow: false });
      }
    } }));
    for (const c of m.chests) if (chestShown(c)) ctx.drawImage(c.quest ? (QUESTS[c.quest].icon ? Gfx.loc(QUESTS[c.quest].icon, f4) : Gfx.chest(false)) : Gfx.relic(f4), c.x * TS - camX, c.y * TS - camY);
    // 人物（按 y 排序）
    const sprites = [];
    for (const n of this.npcs) {
      const kk = n.mt > 0 ? n.mt : 1; const X = n.mt > 0 ? n.fx + (n.x - n.fx) * kk : n.x, Y = n.mt > 0 ? n.fy + (n.y - n.fy) * kk : n.y;
      sprites.push({ y: Y, img: Gfx.char(n.def.sp)[n.dir][n.mt > 0.25 && n.mt < 0.75 ? 1 : 0], x: X, ghost: n.def.ghost, mark: questMark(n.def) });
    }
    const lead = G.party[0];
    const fol = G.party.slice(1, 4);
    const walkF = this.moving && this.mt > 0.25 && this.mt < 0.75 ? 1 : 0;
    fol.forEach((id, i) => {
      const to = this.trail[i], from = this.trail[i + 1] || to;
      const X = this.moving ? from.x + (to.x - from.x) * k : to.x, Y = this.moving ? from.y + (to.y - from.y) * k : to.y;
      const dir = to.x > from.x ? 'right' : to.x < from.x ? 'left' : to.y < from.y ? 'up' : to.y > from.y ? 'down' : to.dir;
      sprites.push({ y: Y - 0.01 * (i + 1), x: X, img: Gfx.char(spriteKey(id))[dir][walkF] });
    });
    sprites.push({ y: ly / TS + 0.001, x: lx / TS, img: Gfx.char(spriteKey(lead))[this.dir][walkF] });
    const layer = sprites.concat(blds, marks).sort((a, b) => a.y - b.y);
    for (const s of layer) { if (s.fn) { s.fn(); continue; } if (s.ghost) ctx.globalAlpha = 0.7 + Math.sin(this.time / 300) * 0.15; ctx.drawImage(s.img, Math.round(s.x * TS - camX), Math.round(s.y * TS - camY) - 6); ctx.globalAlpha = 1; }
    // 任务标记：! 有新任务，? 可以交差
    for (const s of sprites) if (s.mark) {
      const X = Math.round(s.x * TS - camX) + 24, Y = Math.round(s.y * TS - camY) - 20 + Math.sin(this.time / 220) * 3;
      ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(X, Y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = s.mark === '!' ? '#ffd040' : '#80e0ff'; ctx.beginPath(); ctx.arc(X, Y, 10, 0, Math.PI * 2); ctx.fill();
      txt(s.mark, X, Y - 10, { align: 'center', size: 18, b: true, color: '#1a1210', shadow: false });
    }
    if (m.dark) {
      const g = ctx.createRadialGradient(lx - camX + 24, ly - camY + 24, 90, lx - camX + 24, ly - camY + 24, 380);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.82)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (this.banner) {
      ctx.globalAlpha = clamp(this.banner.t / 400, 0, 1);
      ctx.font = `bold 22px ${FONT}`; const tw = ctx.measureText(this.banner.text).width + 56;
      drawWin(W / 2 - tw / 2, 18, tw, 54); txt(this.banner.text, W / 2, 34, { align: 'center', size: 22, b: true, color: '#ffe08a' });
      ctx.globalAlpha = 1;
    }
  }
};
function spriteKey(id) { const c = CHARS[id]; return typeof c.sp === 'function' ? c.sp() : c.sp; }

async function warp(id, x, y, dir) {
  Input.releaseAll();
  await fadeOut(220);
  Scene = MapScene; MapScene.enter(id, x, y, dir);
  await fadeIn(220);
}
async function exitToWorld(L) { loadMap('world'); await warp('world', L.x, L.y, 'down'); } // 先生成世界地图，地点坐标才会被填上
async function enterLoc(L) {
  if (L.need && !L.need()) { await narr(L.needMsg || '现在还进不去。'); return; }
  if (L.kind === 'event') { await STORY[L.ev](L); return; }
  if (L.kind === 'town') { Snd.sfx('door'); const e = townEntry(L.id); await warp('town:' + L.id, e.x, e.y, 'up'); if (TOWNS[L.id].onEnter) await TOWNS[L.id].onEnter(); autosave(); }
  else { Snd.sfx('stairs'); const m = loadMap(`dun:${L.id}:0`); await warp(m.id, m.up.x, m.up.y, 'down'); if (DUNGEONS[L.id].onEnter) await DUNGEONS[L.id].onEnter(); }
}
// GATE_MSG[t] 可以返回一句话，也可以自己跑一段剧情（返回空）
async function gateMessage(t) { const g = GATE_MSG[t]; const r = g ? await g() : '此路不通。'; if (typeof r === 'string') await narr(r); }

// ===== 剧情工具 =====
async function chapter(n) {
  F().ch = n;
  if (isRebirth()) { autosave(); return; } // 重生模式不放章节卡
  const [a, b] = GAME.chapters[n].split(' ');
  await fadeOut(400);
  await card([b, '', a], { big: true });
  await fadeIn(400);
  autosave();
}
async function toTown(id, x, y, dir) { const e = townEntry(id); await warp('town:' + id, x ?? e.x, y ?? e.y, dir || 'up'); }
const doorPos = (town, slot) => { const b = genTown(town).buildings.find(b => b.slot === slot); return { x: b.door.x, y: b.door.y + 1 }; };
async function toWorldAt(key) { loadMap('world'); const L = LOCS[key]; await warp('world', L.x, L.y + 1, 'down'); }

// 对话头像：先查剧本的 SPEAK，再查同伴，再查当前城镇的 NPC
portraitOf = (name) => {
  let sp = SPEAK[name];
  if (!sp) { const c = Object.values(CHARS).find(c => c.name === name); if (c) sp = typeof c.sp === 'function' ? c.sp() : c.sp; }
  if (sp) return Gfx.char(sp).down[0];
  const m = MapScene.map; if (m && m.kind === 't') { const n = (TOWNS[m.tid].npcs || []).find(x => x.name === name); if (n) return Gfx.char(n.sp).down[0]; }
  return null;
};
