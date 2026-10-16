#!/usr/bin/env node
// 引擎独立性检查：node tools/engine-check.js
// 1. 用 tests/fixtures/minimal-story.js（假题材）跑一遍：对话、史料卡、小结、菜单都要正常
// 2. 扫 js/engine/：里面不许出现任何剧本里的人名、地名、城镇名（那些只该写在 js/story/ 里）
const fs = require('fs'), path = require('path');
const { boot, H, ROOT } = require('./lib/sandbox');
const fails = [];
(async () => {
  const g = boot(path.join(ROOT, 'tests', 'fixtures', 'minimal-story.js'));
  await g.pumpUntil(() => g.R('Scene === MapScene') && g.idle());
  await g.act(H.npc('船匠')); await g.act(H.npc('郑和')); await g.act('await recap(0)'); await g.menuTour();
  if (g.R('cardCount()') !== 1) fails.push('假题材里的史料卡没拿到');
  if (g.errors.length) fails.push('假题材运行出错：\n' + g.errors.join('\n'));
  console.log('假题材试跑：', fails.length ? '不通过' : '通过');

  // 探索场景：进入 → onEnter → 走到下楼梯 → 第 2 层的 onFloor
  const n0 = fails.length, e0 = g.errors.length;
  await g.act(H.leave()); await g.act(H.enter('B'));
  if (g.R('MapScene.map.id') !== 'dun:chuanwu:0') fails.push('没进到探索场景第 1 层（现在在 ' + g.R('MapScene.map.id') + '）');
  if (!g.R('G.flags.dunEnter')) fails.push('探索场景的 onEnter 没触发');
  const reach = g.R(`(() => { const m = MapScene.map, seen = new Set([MapScene.py * m.w + MapScene.px]), q = [[MapScene.px, MapScene.py]];
    for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of DIR4) { const X = x + dx, Y = y + dy, k = Y * m.w + X; if (!seen.has(k) && MapScene.passTile(X, Y)) { seen.add(k); q.push([X, Y]); } } }
    return seen.has(m.down.y * m.w + m.down.x); })()`);
  if (!reach) fails.push('探索场景第 1 层从入口走不到下楼梯');
  await g.act('MapScene.px = MapScene.map.down.x; MapScene.py = MapScene.map.down.y; await MapScene.arrive()');
  if (g.R('MapScene.map.id') !== 'dun:chuanwu:1') fails.push('下楼梯没到第 2 层（现在在 ' + g.R('MapScene.map.id') + '）');
  if (!g.R('G.flags.dunFloor1')) fails.push('第 2 层的 onFloor 事件没触发');
  if (g.errors.length > e0) fails.push('探索场景运行出错：\n' + g.errors.slice(e0).join('\n'));
  console.log('探索场景（进入、onEnter、下楼、onFloor）：', fails.length > n0 ? '不通过' : '通过');

  const engine = fs.readdirSync(path.join(ROOT, 'js', 'engine')).map(f => [f, fs.readFileSync(path.join(ROOT, 'js', 'engine', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1')]); // 注释不算
  for (const sf of fs.readdirSync(path.join(ROOT, 'js', 'story'))) {
    const s = boot(path.join(ROOT, 'js', 'story', sf));
    const names = s.R(`[...new Set([GAME.title, ...Object.values(CHARS).map(c => c.name), ...Object.values(LOCS).map(l => l.name), ...Object.values(TOWNS).flatMap(t => [t.name, ...(t.npcs || []).map(n => n.name), ...(t.b || []).map(b => b.label)])].filter(n => n && n.length >= 2))]`);
    const generic = new Set(['民宅', '小孩', '老婆婆', '驿站', '路人']);
    for (const n of names) if (!generic.has(n)) for (const [f, src] of engine) if (src.includes(n)) fails.push(`js/engine/${f} 里写死了剧本 ${sf} 的名字「${n}」`);
  }
  console.log('引擎代码里没有写死题材名词：', fails.some(f => f.includes('写死')) ? '否' : '是');
  console.log(fails.length ? '\n不通过：\n- ' + fails.join('\n- ') : '\n全部通过');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('失败：', e.message); process.exit(2); });
