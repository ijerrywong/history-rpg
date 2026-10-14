// 无头运行游戏：假 canvas + 虚拟时间 + 自动玩家（有窗口就按确认，菜单选第一个能选的）
// 脚本加载顺序从 index.html 读，换剧本时用 storyOverride 替换 js/story/*.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function scriptOrder(storyOverride) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script charset="utf-8" src="([^"]+)"><\/script>/g)].map(m => path.join(ROOT, m[1]));
  if (!storyOverride) return srcs;
  return srcs.map(s => /[\\/]js[\\/]story[\\/]/.test(s) ? path.resolve(storyOverride) : s);
}

function boot(storyOverride) {
  const errors = [];
  const fakeCtx = cv => new Proxy({
    measureText: s => ({ width: String(s).length * 12 }),
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), canvas: cv,
  }, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
  const fakeCanvas = () => { const c = { width: 0, height: 0, style: {}, addEventListener() {} }; c.getContext = () => c._x || (c._x = fakeCtx(c)); return c; };
  let vt = 0; const timers = [];
  const sb = {
    console: { log: (...a) => console.log(...a), error: (...a) => errors.push(a.map(x => x && x.stack || String(x)).join(' ')), warn() {} },
    document: { getElementById: () => fakeCanvas(), createElement: () => fakeCanvas(), querySelectorAll: () => [], body: { classList: { add() {} } }, title: '' },
    localStorage: (() => { const m = {}; return { getItem: k => k in m ? m[k] : null, setItem: (k, v) => m[k] = String(v), removeItem: k => delete m[k] }; })(),
    matchMedia: () => ({ matches: false }), addEventListener() {}, innerWidth: 1024, innerHeight: 768,
    performance: { now: () => vt }, requestAnimationFrame: f => { sb._raf = f; },
    setTimeout: (f, ms) => { timers.push({ t: vt + (ms || 0), f }); return timers.length; }, clearTimeout() {},
    Math, JSON, Promise, Object, Array, Set, Map, Uint8ClampedArray, String, Number, Proxy,
  };
  sb.window = sb; vm.createContext(sb);
  for (const f of scriptOrder(storyOverride)) vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: path.relative(ROOT, f) });
  const R = code => vm.runInContext(code, sb);
  const tick = () => new Promise(r => setImmediate(r));
  async function frame() {
    R(`(() => { const t = UI.top(); if (t) { if (t instanceof Menu) { const p = globalThis.__picks || {}, want = t.o.pick != null ? p[t.o.pick] : undefined; const i = want != null && !t.items[want].disabled ? want : t.items.findIndex(x => !x.disabled); if (want != null && t.items[want].disabled) console.error('决策选项是灰的，选不了：' + t.o.pick + ' #' + want); if (i >= 0) t.i = i; } Input.hit[globalThis.autoB ? 'b' : 'a'] = true; } })()`);
    vt += 50;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= vt) timers.splice(i, 1)[0].f();
    sb._raf(vt); await tick();
  }
  async function pumpUntil(cond, max = 20000) { for (let i = 0; i < max; i++) { if (cond()) return; await frame(); } throw new Error('超时（剧情卡住或在等输入）：' + cond); }
  const idle = () => R('!Script.busy && !UI.busy() && Fade.a === 0 && !Fade.res');
  async function act(code) { R(`runScript(async () => { ${code} })`); await frame(); await pumpUntil(idle); }
  // 打开菜单逛一圈再一路按取消退出（防止自动玩家在菜单里打转）
  async function menuTour() { R('runScript(() => fieldMenu())'); for (let i = 0; i < 60; i++) await frame(); R('globalThis.autoB = 1'); await pumpUntil(idle); R('globalThis.autoB = 0'); }
  return { R, act, frame, pumpUntil, idle, menuTour, errors, seconds: () => Math.round(vt / 1000) };
}

// 剧情步骤里常用的互动写法（返回要在游戏里执行的代码）
const H = {
  npc: n => `await MapScene.interact({ type: 'npc', n: MapScene.npcs.find(x => x.def.name === ${JSON.stringify(n)}) || (() => { throw new Error('找不到 NPC：${n}'); })() })`,
  door: l => `await MapScene.interact({ type: 'door', b: MapScene.map.buildings.find(b => b.label === ${JSON.stringify(l)}) || (() => { throw new Error('找不到建筑：${l}'); })() })`,
  pickAll: () => `for (const c of MapScene.map.chests.filter(chestShown)) await MapScene.interact({ type: 'chest', c })`,
  pickWorld: z => `{ const W = loadMap('world'); for (const c of W.chests.filter(c => chestShown(c) && zoneAtCoarse(c.x >> 2, c.y >> 2) === ${JSON.stringify(z)})) await MapScene.interact({ type: 'chest', c }); }`,
  enter: k => `await enterLoc(LOCS[${JSON.stringify(k)}])`,
  leave: () => 'await MapScene.leaveTown()',
  toWorld: k => `await exitToWorld(LOCS[${JSON.stringify(k)}])`,
  gate: c => `await gateMessage(${JSON.stringify(c)})`,
};
module.exports = { boot, H, ROOT };
