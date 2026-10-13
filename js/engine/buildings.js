'use strict';
// ===== 建筑造型库 =====
// 剧本在建筑上写 art: 'palace' 之类，选一种造型。每种造型照着实物的特征画：
// 宫殿有台基和重檐，市场是布棚摊位，兵营是木栅栏，烽火台是高高的夯土墩……
// 画布宽 80（5 格），高 48 + top（高出占地的部分），坐标原点在占地左上角，门永远在底边正中。
// label：招牌牌匾的位置（原始像素，相对占地顶边）。fx：每帧叠加的小动画（旗子、炊烟）。

// —— 共用小件 ——
// 汉式屋顶：梯形坡面、瓦垄、翘起的檐角、屋脊
function hanRoof(x, l, r, top, bot, col, o = {}) {
  const d = shadeHex(col, -0.35), li = shadeHex(col, 0.25), ins = o.ins ?? Math.round((bot - top) * 0.9);
  ppoly(x, [[l - 1, bot], [l + ins, top], [r - ins, top], [r + 1, bot]], d);
  ppoly(x, [[l + 1, bot - 1], [l + ins + 1, top + 1], [r - ins - 1, top + 1], [r - 1, bot - 1]], col);
  for (let X = l + 4; X < r - 3; X += 3) pline(x, X, top + 2, X + (X < (l + r) / 2 ? -1 : 1) * Math.round((bot - top) / 4), bot - 2, d);
  prect(x, l, bot - 2, r - l, 2, d); prect(x, l + 1, bot - 2, r - l - 2, 1, li);
  ppoly(x, [[l - 1, bot], [l - 3, bot - 5], [l + 3, bot]], d); ppoly(x, [[r + 1, bot], [r + 3, bot - 5], [r - 3, bot]], d);
  prect(x, l + ins - 2, top - 1, r - l - 2 * ins + 4, 2, o.ridge || '#2a1e1c');
  if (o.owl) for (const X of [l + ins - 3, r - ins + 1]) { prect(x, X, top - 4, 2, 4, o.owl); px(x, X + (X < (l + r) / 2 ? -1 : 2), top - 4, o.owl); } // 鸱尾
}
// 夯土墙：一层一层的夯土纹
function rammed(x, X, Y, w, h, col = '#c8a878') {
  prect(x, X, Y, w, h, col);
  for (let y = Y + 3; y < Y + h; y += 4) prect(x, X, y, w, 1, shadeHex(col, -0.18));
  prect(x, X, Y, w, 1, shadeHex(col, 0.15));
}
function door(x, cx, Y, w, h, col = '#7a2418') {
  prect(x, cx - w / 2, Y, w, h, shadeHex(col, -0.3)); prect(x, cx - w / 2 + 1, Y + 1, w - 2, h - 1, col);
  prect(x, cx, Y + 1, 1, h - 1, shadeHex(col, -0.4));
  for (const dy of [3, 7]) { px(x, cx - 2, Y + dy, '#f0c040'); px(x, cx + 2, Y + dy, '#f0c040'); }
}
function lattice(x, X, Y, w = 8, h = 7) { prect(x, X, Y, w, h, '#5a3424'); for (let k = 1; k < w; k += 2) prect(x, X + k, Y + 1, 1, h - 2, '#c8a878'); prect(x, X + 1, Y + (h >> 1), w - 2, 1, '#c8a878'); }
function horse(x, X, Y, col = '#8a5a30') { // 朝左的马，16×12
  const d = shadeHex(col, -0.3);
  pell(x, X + 9, Y + 6, 5, 3, col); prect(x, X + 2, Y + 1, 4, 3, col); ppoly(x, [[X + 4, Y + 2], [X + 6, Y + 6], [X + 8, Y + 4]], col);
  for (const L of [X + 5, X + 7, X + 11, X + 13]) prect(x, L, Y + 8, 1, 4, d);
  prect(x, X + 4, Y, 4, 2, '#2a1a10'); pline(x, X + 14, Y + 5, X + 16, Y + 9, '#2a1a10'); px(x, X + 3, Y + 2, '#1a1010');
}
function sheep(x, X, Y) { pell(x, X + 4, Y + 3, 4, 3, '#f4f0e8'); pell(x, X + 3, Y + 2, 3, 2, '#ffffff'); prect(x, X + 7, Y + 1, 2, 3, '#3a3030'); for (const L of [X + 2, X + 6]) prect(x, L, Y + 6, 1, 2, '#3a3030'); }
function flagPole(x, X, Y, h) { prect(x, X, Y, 1, h, '#5a3a20'); px(x, X, Y - 1, '#f0c040'); }
// 毡帐本体：cx 中心，rw 半宽，dome 圆顶高
function yurtBody(x, cx, rw, col, o = {}) {
  const cd = shadeHex(col, -0.2), cdd = shadeHex(col, -0.4), base = 48, wall = o.wall ?? 14, dome = o.dome ?? 16;
  prect(x, cx - rw, base - wall, rw * 2, wall, cd); prect(x, cx - rw + 1, base - wall, rw * 2 - 2, wall - 1, col);
  pell(x, cx, base - wall, rw, dome, cd); pell(x, cx, base - wall, rw - 1, dome - 1, col);
  prect(x, cx - rw, base - wall, rw * 2, 2, o.band || '#a0522d');
  if (o.pattern) for (let X = cx - rw + 3; X < cx + rw - 3; X += 6) { px(x, X, base - wall + 4, o.pattern[0]); px(x, X + 1, base - wall + 3, o.pattern[1]); px(x, X + 2, base - wall + 4, o.pattern[0]); px(x, X + 1, base - wall + 5, o.pattern[1]); }
  for (let X = cx - rw + 5; X < cx + rw - 4; X += 8) pline(x, X, base - wall + 7, X + 3, base - 2, cdd);
  pell(x, cx, base - wall - dome + 2, 5, 2, cdd); // 天窗
  prect(x, cx - 7, base - 13, 14, 13, '#7a2418'); prect(x, cx - 6, base - 12, 12, 12, o.curtain || '#a83a2a');
  for (let Y = base - 10; Y < base; Y += 3) prect(x, cx - 6, Y, 12, 1, '#7a2418');
  if (o.patches) for (const [X, Y] of o.patches) prect(x, cx + X, base - wall + Y, 5, 4, shadeHex(col, -0.28));
}

const BUILDINGS = {
  // 宫殿：高高的夯土台基、正中的长台阶、红柱、两层屋檐、屋脊两头的鸱尾
  palace: { top: 26, label: 11, draw(x, o) {
    rammed(x, 2, 30, 76, 18, '#c8a878');
    for (let i = 0; i < 9; i++) prect(x, 30 - i * 0.5, 30 + i * 2, 20 + i, 2, i % 2 ? '#a8a090' : '#c8c0b0');
    prect(x, 8, 15, 64, 15, '#ece0c4');
    for (const X of [8, 18, 28, 50, 60, 70]) { prect(x, X, 15, 2, 15, '#a82a1a'); px(x, X, 15, '#d84a2a'); }
    lattice(x, 11, 19, 6, 8); lattice(x, 20, 19, 7, 8); lattice(x, 52, 19, 7, 8); lattice(x, 62, 19, 6, 8);
    door(x, 40, 18, 16, 12);
    hanRoof(x, 2, 78, 4, 16, o.roof || '#3a3a46', { ins: 5 });
    prect(x, 18, -6, 44, 10, '#ece0c4');
    for (const X of [18, 28, 50, 60]) prect(x, X, -6, 2, 10, '#a82a1a');
    hanRoof(x, 10, 70, -24, -5, o.roof || '#3a3a46', { owl: '#e0b040', ridge: '#e0b040' });
  } },
  // 市场：三格布棚摊位（丝绸、陶罐、粮食），中间是市门
  market: { top: 14, label: 17, draw(x) {
    rammed(x, 0, 14, 80, 6, '#b8a080');
    const stall = (X, w, c1, c2, goods) => {
      for (const P of [X, X + w - 2]) prect(x, P, 18, 2, 30, '#6a4424');
      for (let k = 0; k < w; k += 4) { prect(x, X + k, 16, 4, 6, (k / 4) % 2 ? c1 : c2); prect(x, X + k, 22, 4, 2, shadeHex((k / 4) % 2 ? c1 : c2, -0.25)); }
      prect(x, X, 38, w, 3, '#8a5a30'); prect(x, X, 41, w, 7, '#6a4424');
      goods(X + 2, 30, w - 4);
    };
    stall(0, 28, '#e8e0d0', '#c83a2a', (X, Y, w) => { for (const [k, c] of [[0, '#c83a2a'], [5, '#3a6ac8'], [10, '#e8c040'], [15, '#3a9a5a'], [20, '#a050c0']]) if (k + 4 <= w) { prect(x, X + k, Y + 2, 4, 6, c); prect(x, X + k, Y + 2, 4, 1, shadeHex(c, 0.3)); } });
    stall(52, 28, '#e8e0d0', '#3a6aa8', (X, Y) => { for (const [k, h] of [[0, 7], [7, 5], [13, 8], [20, 6]]) { pell(x, X + k + 3, Y + 8 - h / 2, 3, h / 2, '#a8683a'); prect(x, X + k + 2, Y + 7 - h, 2, 1, '#6a3a1a'); } });
    for (const P of [30, 48]) prect(x, P, 10, 2, 38, '#8a3424');
    prect(x, 28, 10, 24, 3, '#a83a2a'); prect(x, 28, 13, 24, 1, '#6a1a10');
    flagPole(x, 39, -12, 22); prect(x, 40, -11, 9, 7, '#c83a2a'); prect(x, 43, -9, 3, 3, '#f0d060');
    for (let k = 0; k < 3; k++) { pell(x, 36 + k * 4, 44, 2, 2, '#d8c070'); }
  } },
  // 书肆：开着的铺面，架子上一捆捆竹简，门外桌上摊开一卷
  bookshop: { top: 6, label: 9, draw(x, o) {
    rammed(x, 6, 16, 68, 32, '#d8c49a');
    hanRoof(x, 2, 78, -4, 18, o.roof || '#3a5a4a');
    prect(x, 10, 20, 22, 20, '#3a2418'); prect(x, 48, 20, 22, 20, '#3a2418');
    for (const X0 of [10, 48]) for (let r = 0; r < 3; r++) { prect(x, X0, 26 + r * 7, 22, 1, '#8a5a30'); for (let k = 0; k < 5; k++) { prect(x, X0 + 1 + k * 4, 21 + r * 7, 3, 5, '#e0c070'); prect(x, X0 + 1 + k * 4, 23 + r * 7, 3, 1, '#8a3a2a'); } }
    door(x, 40, 30, 12, 18, '#6a3a20');
    prect(x, 36, 18, 8, 12, '#f0e8d0'); for (let k = 0; k < 4; k++) prect(x, 37, 20 + k * 2, 6, 1, '#3a2a1a'); prect(x, 35, 17, 10, 1, '#6a3a20');
    prect(x, 54, 42, 20, 2, '#8a5a30'); prect(x, 56, 44, 2, 4, '#6a4424'); prect(x, 70, 44, 2, 4, '#6a4424');
    for (let k = 0; k < 8; k++) prect(x, 56 + k * 2, 39, 1, 3, k % 2 ? '#e0c070' : '#d0b060');
  } },
  // 兵营：一圈尖头木栅栏、敞开的营门、两面军旗、兵器架和战鼓
  barracks: { top: 22, label: 15, draw(x) {
    for (let X = 0; X < 80; X += 4) { if (X >= 30 && X < 50) continue; prect(x, X, 14, 4, 34, X % 8 ? '#8a6038' : '#7a5230'); ppoly(x, [[X, 14], [X + 2, 10], [X + 4, 14]], '#9a7048'); prect(x, X, 26, 4, 1, '#5a3a20'); prect(x, X, 40, 4, 1, '#5a3a20'); }
    prect(x, 30, 22, 20, 26, '#3a2a1a'); prect(x, 28, 18, 24, 4, '#6a4424');
    prect(x, 30, 22, 4, 26, '#7a5230'); prect(x, 46, 22, 4, 26, '#7a5230');
    for (const X of [26, 53]) { flagPole(x, X, -20, 40); }
    for (let k = 0; k < 4; k++) pline(x, 6 + k * 4, 46, 9 + k * 4, 28, '#8a8a96');
    for (let k = 0; k < 4; k++) { prect(x, 8 + k * 4, 27, 3, 2, '#c8c8d0'); px(x, 10 + k * 4, 29, '#c03030'); }
    prect(x, 4, 38, 20, 2, '#5a3a20');
    pell(x, 66, 40, 7, 6, '#7a2418'); pell(x, 66, 38, 6, 2, '#e8d8b0'); prect(x, 61, 44, 2, 4, '#5a3a20'); prect(x, 70, 44, 2, 4, '#5a3a20');
  }, fx(c, X, Y, t) { for (const [px0, col] of [[26, '#c83a2a'], [53, '#c83a2a']]) waveFlag(c, X + (px0 + 1) * 3, Y + (-19) * 3, 30, 18, col, t, px0); } },
  // 民宅：前面一道院墙和院门，后面是夯土房子；院里一棵树
  house: { top: 10, label: 9, draw(x, o) {
    rammed(x, 10, 10, 60, 26, '#d8c49a');
    hanRoof(x, 6, 74, -8, 12, o.roof || '#5a5a64', { ins: 7 });
    lattice(x, 16, 18); lattice(x, 56, 18);
    door(x, 40, 22, 10, 14, '#6a4424');
    tree(x, 72, 22, 7);
    rammed(x, 0, 36, 80, 12, '#c8b488'); prect(x, 0, 35, 80, 2, '#6a6a74');
    prect(x, 34, 36, 12, 12, '#3a2418'); door(x, 40, 37, 10, 11, '#8a5a30');
    if (o.washing) { pline(x, 4, 26, 18, 28, '#5a4a3a'); prect(x, 6, 27, 4, 5, '#4a7ac8'); prect(x, 12, 28, 4, 4, '#e0d0b0'); }
  } },
  // 驿站：带「驿」字旗的屋子，旁边马棚里拴着马，门口有水槽
  station: { top: 18, label: 9, draw(x, o) {
    rammed(x, 12, 12, 52, 36, '#d0b88a');
    hanRoof(x, 8, 68, -6, 14, o.roof || '#5a4a3a', { ins: 6 });
    lattice(x, 16, 20); lattice(x, 52, 20);
    door(x, 40, 30, 12, 18, '#7a3a20');
    prect(x, 64, 22, 16, 26, '#5a3a20'); ppoly(x, [[62, 22], [80, 16], [80, 22]], '#7a5a3a'); prect(x, 64, 22, 1, 26, '#3a2a18');
    horse(x, 64, 34, '#9a6a3a');
    prect(x, 2, 42, 10, 4, '#6a4424'); prect(x, 3, 42, 8, 2, '#4a7ab8');
    flagPole(x, 4, -14, 52); prect(x, 5, -13, 8, 10, '#e8d8b0'); prect(x, 7, -11, 4, 1, '#3a2a1a'); prect(x, 8, -10, 1, 5, '#3a2a1a'); prect(x, 7, -7, 4, 1, '#3a2a1a');
  } },
  // 官府：高大的门楼（门上有屋顶）、两边院墙、红漆大门和门钉、门旁一面大鼓
  office: { top: 20, label: 5, draw(x, o) {
    rammed(x, 0, 22, 80, 26, '#c8b090'); prect(x, 0, 20, 80, 3, '#4a4a54'); for (let X = 0; X < 80; X += 3) px(x, X, 19, '#5a5a64');
    prect(x, 22, 8, 36, 40, '#e0d0b0'); for (const X of [22, 34, 44, 56]) prect(x, X, 8, 2, 40, '#a82a1a');
    hanRoof(x, 16, 64, -16, 10, o.roof || '#3a3a46', { ins: 6, owl: '#4a4a54' });
    prect(x, 31, 26, 18, 22, '#6a1a10'); prect(x, 32, 27, 8, 21, '#a82a1a'); prect(x, 41, 27, 7, 21, '#a82a1a');
    for (let r = 0; r < 4; r++) for (const X of [34, 37, 43, 46]) px(x, X, 30 + r * 4, '#f0c040');
    prect(x, 6, 34, 2, 14, '#5a3a20'); prect(x, 14, 34, 2, 14, '#5a3a20'); pell(x, 11, 34, 6, 5, '#7a2418'); pell(x, 11, 34, 5, 4, '#a83a2a'); pell(x, 9, 34, 2, 4, '#e8d8b0');
    pline(x, 16, 30, 19, 28, '#5a3a20'); px(x, 19, 27, '#e8d8b0');
    for (const X of [66, 72]) { prect(x, X, 26, 1, 22, '#5a3a20'); ppoly(x, [[X - 2, 26], [X, 22], [X + 2, 26]], '#c8c8d0'); }
  } },
  // 烽火台：高高的夯土墩、顶上的女墙、旁边堆好的柴草（积薪）、守兵的小屋冒着炊烟
  beacon: { top: 32, label: 30, draw(x) {
    ppoly(x, [[22, 48], [28, -22], [52, -22], [58, 48]], '#b89868');
    ppoly(x, [[24, 48], [29, -22], [46, -22], [48, 48]], '#ccac78');
    for (let y = -18; y < 48; y += 5) { const k = (y + 22) / 70; pline(x, Math.round(28 - 6 * k), y, Math.round(52 + 6 * k), y, '#a88858'); }
    prect(x, 26, -28, 28, 6, '#ccac78'); for (let X = 26; X < 54; X += 6) prect(x, X, -31, 3, 3, '#ccac78');
    pline(x, 18, 48, 27, -22, '#6a4424'); pline(x, 21, 48, 30, -22, '#6a4424'); for (let k = 0; k < 14; k++) { const y = 46 - k * 5, dx = (48 - y) * 9 / 70; pline(x, 18 + dx, y, 21 + dx, y, '#8a6038'); }
    prect(x, 35, 34, 10, 14, '#3a2418');
    for (const [X, Y] of [[2, 38], [8, 38], [14, 38], [5, 32], [11, 32], [8, 26]]) { pell(x, X + 3, Y + 4, 4, 4, '#8a6a30'); pline(x, X, Y + 6, X + 6, Y + 1, '#c8a050'); pline(x, X + 1, Y + 7, X + 7, Y + 2, '#a07a30'); }
    rammed(x, 60, 30, 18, 18, '#c8a878'); hanRoof(x, 58, 80, 22, 32, '#6a5a4a', { ins: 3 }); prect(x, 66, 38, 6, 10, '#3a2418'); prect(x, 74, 18, 2, 6, '#5a4a3a');
  }, fx(c, X, Y, t) { smoke(c, X + 75 * 3, Y + 18 * 3, t, 0.35); } },
  // 普通毡帐
  yurt: { top: 0, label: 17, draw(x, o) { yurtBody(x, 40, 34, o.wall || '#e8dcc0'); flagPole(x, 40, 0, 10); prect(x, 41, 0, 5, 3, '#c03030'); } },
  // 自己住的毡帐：门口拴着马，堆着干草
  yurt_home: { top: 0, label: 17, draw(x, o) {
    yurtBody(x, 34, 28, o.wall || '#e8dcc0', { patches: [[-18, 6], [12, 8]] });
    prect(x, 74, 30, 2, 18, '#5a3a20'); horse(x, 62, 36, '#6a4a30');
    pell(x, 6, 44, 6, 4, '#c8a050'); pell(x, 6, 42, 4, 3, '#e0c070');
  } },
  // 牧人的毡帐：旁边有木栅羊圈，圈里有羊，门口放着奶桶
  yurt_herd: { top: 0, label: 17, draw(x, o) {
    yurtBody(x, 28, 26, o.wall || '#e0d4b8', { dome: 14 });
    for (let X = 56; X < 80; X += 6) prect(x, X, 32, 2, 16, '#7a5230'); prect(x, 54, 35, 26, 1, '#9a7048'); prect(x, 54, 41, 26, 1, '#9a7048');
    sheep(x, 58, 38); sheep(x, 68, 40); sheep(x, 62, 43);
    prect(x, 46, 42, 5, 6, '#a8a8b0'); prect(x, 46, 42, 5, 1, '#f0f0f0');
  } },
  // 老人的毡帐：毡子打着补丁，门前木架上晾着肉干，天窗冒烟
  yurt_old: { top: 0, label: 17, draw(x, o) {
    yurtBody(x, 44, 30, o.wall || '#d8ccb0', { patches: [[-20, 5], [-4, 9], [14, 4], [8, 10]], curtain: '#8a5a3a' });
    for (const X of [2, 14]) prect(x, X, 26, 2, 22, '#6a4424'); prect(x, 1, 26, 16, 2, '#6a4424');
    for (let k = 0; k < 5; k++) { prect(x, 4 + k * 2.5, 28, 1, 6 + (k % 2) * 3, k % 2 ? '#8a3a1a' : '#a8502a'); px(x, 4 + k * 2.5, 28, '#3a2a1a'); }
  }, fx(c, X, Y, t) { smoke(c, X + 44 * 3, Y + 18 * 3, t, 0.3); } },
  // 首领大帐：比别的毡帐都大，金色毡面、花纹带，顶上一只金鹰，门前两杆马尾大纛
  yurt_royal: { top: 22, label: 17, draw(x, o) {
    yurtBody(x, 40, 37, o.wall || '#f0d8a0', { wall: 20, dome: 26, band: '#3a5aa8', pattern: ['#c83a2a', '#f0e0a0'], curtain: '#c8302a' });
    pell(x, 40, 3, 4, 2, '#e0b040'); ppoly(x, [[32, -1], [40, -6], [48, -1], [40, -3]], '#f0c040'); prect(x, 39, -9, 3, 3, '#3ab0a0'); px(x, 41, -8, '#1a1a1a');
    for (const X of [2, 77]) { prect(x, X, -20, 2, 68, '#3a2a18'); ppoly(x, [[X - 3, -14], [X + 1, -22], [X + 5, -14]], '#e0b040'); for (let k = 0; k < 5; k++) pline(x, X + 1, -12, X - 2 + k * 1.5, -2, k % 2 ? '#1a1a1a' : '#e8e0d0'); }
  }, fx(c, X, Y, t) { for (const [px0, dir] of [[3, 1], [78, -1]]) waveFlag(c, X + px0 * 3, Y - 10 * 3, 24 * dir, 12, '#c8302a', t, px0); } },
  // 旧的通用造型（瓦顶房子），没写 art 时用它
  hall: { top: 0, label: 17, draw(x, o) { x.drawImage(Gfx.building(5, o.roof || '#3a5a8a', o.wall), 0, 0, 80, 48); } },
};

// —— 每帧叠加的小动画 ——
function waveFlag(c, X, Y, w, h, col, t, seed) {
  const n = 6, dir = Math.sign(w) || 1, aw = Math.abs(w);
  c.fillStyle = col;
  for (let i = 0; i < n; i++) { const off = Math.round(Math.sin(t / 220 + i * 0.9 + seed) * 3 * (i / n)); c.fillRect(X + dir * (i * aw / n) - (dir < 0 ? aw / n : 0), Y + off, Math.ceil(aw / n) + 1, h - Math.round(i * 0.6)); }
}
function smoke(c, X, Y, t, a = 0.35) {
  for (let i = 0; i < 5; i++) {
    const k = ((t / 2400 + i / 5) % 1), r = 5 + k * 14;
    c.globalAlpha = a * (1 - k); c.fillStyle = '#d8d8e0';
    c.beginPath(); c.arc(X + Math.sin(t / 700 + i) * 6 + k * 18, Y - k * 90, r, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

// 画好的建筑图（放大 3 倍，含高出占地的部分）
Gfx.bld = function (art, o = {}) {
  const A = BUILDINGS[art] || BUILDINGS.hall;
  return cached('bld2|' + art + '|' + (o.roof || '') + '|' + (o.wall || '') + '|' + (o.washing ? 1 : 0), () => {
    const [c, x] = mkCanvas(80, 48 + A.top);
    x.translate(0, A.top); A.draw(x, o); x.setTransform(1, 0, 0, 1, 0, 0);
    if (art !== 'hall') outline(c, '#1a0c06', false);
    return scaleCanvas(c, 3);
  });
};

// ===== 世界地图地标 =====
// 地点在世界地图上画成占好几格的地标（w×h 格，入口是最下面一排的正中那格），其余格子走不通。
// 剧本在 LOCS 里写 art；关卡用 GATE_ART 给整块关卡格子配一幅画（o.open 表示已经打开）。
function yurtMini(x, cx, base, rw, col, o = {}) {
  const d = shadeHex(col, -0.22), h = Math.round(rw * 0.7), dome = Math.round(rw * 0.75);
  prect(x, cx - rw, base - h, rw * 2, h, d); prect(x, cx - rw + 1, base - h, rw * 2 - 2, h - 1, col);
  pell(x, cx, base - h, rw, dome, d); pell(x, cx, base - h, rw - 1, dome - 1, col);
  prect(x, cx - rw, base - h, rw * 2, 1, o.band || '#a0522d');
  prect(x, cx - 1, base - Math.max(3, h - 1), 3, Math.max(3, h - 1), '#a83a2a');
}
const LANDMARKS = {
  // 都城：夯土城墙、正中城门楼、两角角楼，墙后高高的宫殿露出两层屋顶
  capital: { w: 3, h: 2, top: 16, draw(x) {
    rammed(x, 12, 2, 24, 8, '#c8a878');
    prect(x, 15, -4, 18, 6, '#ece0c4'); for (const X of [15, 20, 27, 32]) prect(x, X, -4, 1, 6, '#a82a1a');
    hanRoof(x, 11, 37, -9, -3, '#3a3a46', { ins: 3 });
    prect(x, 18, -11, 12, 3, '#ece0c4');
    hanRoof(x, 15, 33, -16, -10, '#3a3a46', { ins: 2, owl: '#e0b040', ridge: '#e0b040' });
    rammed(x, 0, 16, 48, 16, '#c8a878'); for (let X = 0; X < 48; X += 4) prect(x, X, 14, 2, 2, '#c8a878');
    for (const X of [0, 40]) { prect(x, X + 1, 10, 6, 6, '#e0d0b0'); hanRoof(x, X, X + 8, 6, 11, '#3a3a46', { ins: 2 }); }
    prect(x, 16, 10, 16, 8, '#e0d0b0'); for (const X of [16, 21, 26, 31]) prect(x, X, 10, 1, 8, '#a82a1a');
    hanRoof(x, 13, 35, 4, 11, '#3a3a46', { ins: 3 });
    prect(x, 20, 23, 8, 9, '#2a1a10'); pell(x, 24, 23, 4, 2, '#2a1a10');
  } },
  // 边城：小小的方城，墙角一座烽火台
  frontier: { w: 3, h: 2, top: 18, draw(x) {
    hanRoof(x, 7, 21, 4, 11, '#6a5a4a', { ins: 2 }); hanRoof(x, 23, 35, 5, 11, '#6a5a4a', { ins: 2 });
    rammed(x, 2, 12, 36, 20, '#c8a878'); for (let X = 2; X < 38; X += 4) prect(x, X, 10, 2, 2, '#c8a878');
    prect(x, 19, 22, 10, 10, '#2a1a10'); prect(x, 19, 22, 2, 10, '#7a5230'); prect(x, 27, 22, 2, 10, '#7a5230');
    flagPole(x, 10, 0, 12); prect(x, 11, 1, 5, 3, '#c83a2a');
    ppoly(x, [[37, 32], [40, -12], [47, -12], [50, 32]], '#b89868'); ppoly(x, [[38, 32], [41, -12], [45, -12], [46, 32]], '#ccac78');
    for (let y = -8; y < 32; y += 5) pline(x, 39, y, 48, y, '#a88858');
    prect(x, 39, -16, 10, 4, '#ccac78'); for (const X of [39, 43, 47]) prect(x, X, -18, 2, 2, '#ccac78');
    for (const [X, Y] of [[0, 26], [4, 26], [2, 22]]) pell(x, X + 2, Y + 3, 2, 3, '#a07a30');
  }, fx(c, X, Y, t) { smoke(c, X + 15 * 3, Y + 6 * 3, t, 0.25); } },
  // 游牧营地：大小毡帐，金顶的首领大帐在中间，马尾大纛、马群、羊群
  camp: { w: 3, h: 2, top: 12, draw(x) {
    yurtMini(x, 9, 16, 6, '#d8ccb0'); yurtMini(x, 40, 14, 5, '#e0d4b8');
    prect(x, 33, -10, 1, 32, '#3a2a18'); ppoly(x, [[31, -8], [33, -12], [35, -8]], '#e0b040'); for (let k = 0; k < 4; k++) pline(x, 33, -7, 31 + k * 1.3, -1, k % 2 ? '#1a1a1a' : '#e8e0d0');
    yurtMini(x, 24, 26, 11, '#f0d8a0', { band: '#3a5aa8' }); pell(x, 24, 8, 2, 2, '#f0c040'); px(x, 24, 5, '#3ab0a0');
    yurtMini(x, 7, 31, 6, '#e8dcc0'); yurtMini(x, 41, 31, 6, '#e8dcc0');
    for (const [X, Y, col] of [[40, 18, '#6a4a30'], [45, 20, '#9a6a3a']]) { prect(x, X, Y, 4, 2, col); prect(x, X - 1, Y - 1, 2, 2, col); px(x, X, Y + 2, col); px(x, X + 3, Y + 2, col); }
    for (const [X, Y] of [[1, 20], [4, 22], [2, 24]]) { prect(x, X, Y, 3, 2, '#f4f0e8'); px(x, X + 3, Y, '#3a3030'); }
  } },
  // 绿洲城：土坯城墙和平顶房子，城外葡萄架、高高的白杨，还有一匹汗血马
  oasis: { w: 4, h: 2, top: 12, draw(x) {
    for (const X of [20, 62]) { prect(x, X, 6, 1, 24, '#6a4a2a'); pell(x, X, 2, 2, 10, '#3a8a3a'); pell(x, X - 1, 0, 1, 7, '#5aaa4a'); }
    for (const [X, Y, w, h] of [[24, 4, 10, 12], [35, 0, 12, 16], [48, 6, 10, 10]]) { prect(x, X, Y, w, h, '#d8b880'); prect(x, X, Y, w, 2, '#b8945a'); prect(x, X + 2, Y + 4, 2, 3, '#4a2a1a'); prect(x, X + w - 4, Y + 4, 2, 3, '#4a2a1a'); }
    rammed(x, 22, 16, 40, 16, '#d8b880'); for (let X = 22; X < 62; X += 4) prect(x, X, 14, 2, 2, '#d8b880');
    prect(x, 36, 22, 8, 10, '#2a1a10'); pell(x, 40, 22, 4, 2, '#2a1a10');
    for (const X of [1, 9, 17]) prect(x, X, 8, 1, 14, '#6a4424'); prect(x, 0, 8, 19, 1, '#6a4424');
    for (let k = 0; k < 9; k++) pell(x, 1 + k * 2, 10 + (k % 3), 2, 2, '#4a9a3a');
    for (const [X, Y] of [[3, 13], [8, 14], [13, 13], [16, 15]]) { pell(x, X, Y, 1.5, 2, '#7a3a9a'); px(x, X, Y - 1, '#a060c0'); }
    horse(x, 2, 20, '#c88a3a');
  } },
  // 汉朝的关：南北走向的夯土关墙，正中关城门楼（朝西的一面有垛口）
  hanpass: { w: 4, h: 4, top: 6, draw(x, o) {
    rammed(x, 24, 0, 16, 64, '#c8a878'); for (let y = 0; y < 64; y += 4) prect(x, 22, y, 2, 2, '#c8a878');
    prect(x, 16, 22, 32, 20, '#e0d0b0'); for (const X of [16, 24, 39, 47]) prect(x, X, 22, 1, 20, '#a82a1a');
    hanRoof(x, 12, 52, 12, 24, '#3a3a46', { ins: 4 });
    if (o.open) prect(x, 26, 30, 12, 12, '#2a1a10'); else { prect(x, 26, 30, 12, 12, '#a82a1a'); prect(x, 32, 30, 1, 12, '#6a1a10'); for (const Y of [33, 37]) { px(x, 29, Y, '#f0c040'); px(x, 35, Y, '#f0c040'); } }
    flagPole(x, 32, -6, 18); prect(x, 33, -5, 6, 4, '#c83a2a');
    ppoly(x, [[27, 8], [29, -4], [35, -4], [37, 8]], '#b89868');
  } },
  // 草原哨卡：一道木桩栅栏，旁边两顶小毡帐和马尾旗；打开后栅栏倒了一段
  xnpost: { w: 4, h: 4, top: 8, draw(x, o) {
    for (let y = 2; y < 64; y += 4) { if (o.open && y > 22 && y < 42) continue; prect(x, 30, y, 3, 4, y % 8 ? '#8a6038' : '#7a5230'); ppoly(x, [[29, y + 1], [31, y - 2], [34, y + 1]], '#9a7048'); }
    if (o.open) for (const y of [26, 33]) pline(x, 22, y, 34, y + 4, '#7a5230', 2);
    yurtMini(x, 48, 22, 7, '#d8ccb0'); yurtMini(x, 52, 50, 6, '#e0d4b8');
    prect(x, 40, -6, 1, 30, '#3a2a18'); for (let k = 0; k < 4; k++) pline(x, 40, -4, 38 + k * 1.3, 4, k % 2 ? '#1a1a1a' : '#e8e0d0');
    horse(x, 40, 34, '#6a4a30');
  } },
};
Gfx.landmark = function (art, o = {}) {
  return cached('lm|' + art + '|' + (o.open ? 1 : 0), () => {
    const A = LANDMARKS[art], [c, x] = mkCanvas(A.w * 16, A.h * 16 + A.top);
    x.translate(0, A.top); A.draw(x, o); x.setTransform(1, 0, 0, 1, 0, 0);
    outline(c, '#1a0c06', false);
    return scaleCanvas(c, 3);
  });
};
