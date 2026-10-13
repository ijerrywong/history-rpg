#!/usr/bin/env node
// 无头试玩：node tools/playtest.js <剧本id>
// 读 tests/<剧本id>.test.js：按步骤把剧情从头走到尾，再检查地图路线。全部通过退出码 0。
const path = require('path');
const { boot, H, ROOT } = require('./lib/sandbox');
const id = process.argv[2] || 'zhangqian';
const spec = require(path.join(ROOT, 'tests', id + '.test.js'))(H);
const story = path.join(ROOT, 'js', 'story', id + '.js');
const fails = [];
(async () => {
  const g = boot(story);
  await g.pumpUntil(() => g.R('Scene === MapScene') && g.idle());
  for (const [name, list] of spec.steps) {
    for (const code of list) await g.act(code);
    console.log(`[${name}] 章=${g.R('G.flags.ch')} 卡=${g.R('cardCount()')} 地图=${g.R('MapScene.map.name')} 队伍=${g.R('G.party.map(charName).join("、")')}`);
  }
  if (spec.menuTour !== false) await g.menuTour();
  g.R('globalThis.lastG = G');
  if (spec.ending) {
    await g.act(spec.ending);
    const back = g.R('G !== lastG');
    console.log('结局后回到标题画面：', back ? '是' : '否'); if (!back) fails.push('结局没有回到标题画面');
  }
  const missing = g.R('Object.keys(CARDS).filter(id => !lastG.cards[id])');
  console.log(`史料卡：${g.R('Object.keys(CARDS).length') - missing.length} / ${g.R('Object.keys(CARDS).length')}`, missing.length ? '缺：' + missing.join('、') : '');
  if (spec.allCards !== false && missing.length) fails.push('有史料卡拿不到：' + missing.join('、'));
  const qs = g.R('JSON.stringify(lastG.quests)'); console.log('任务：', qs);
  for (const q of g.R('Object.keys(QUESTS)')) if (!g.R(`lastG.quests[${JSON.stringify(q)}] && lastG.quests[${JSON.stringify(q)}].st === 'done'`)) fails.push('任务没完成：' + q);

  // —— 路线检查：在某组 flags 下，从 A 能不能走到 B ——
  g.R(`globalThis.__reach = (spec) => {
    const W = loadMap('world'); MapScene.map = W;
    G.flags = Object.assign({ ch: 0 }, spec.flags || {}); G.quests = spec.quests || {};
    const pos = p => typeof p === 'string' ? [LOCS[p].x, LOCS[p].y] : [LOCS[p.loc].x + (p.dx || 0), LOCS[p.loc].y + (p.dy || 0)];
    const [sx, sy] = pos(spec.from), seen = new Set([sy * W.w + sx]), q = [[sx, sy]];
    for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of DIR4) { const X = x + dx, Y = y + dy, k = Y * W.w + X; if (!seen.has(k) && MapScene.passTile(X, Y)) { seen.add(k); q.push([X, Y]); } } }
    const has = (x, y) => seen.has(y * W.w + x);
    const near = (x, y) => [[0, 0], ...DIR4].some(([dx, dy]) => has(x + dx, y + dy));
    if (spec.to) { const [x, y] = pos(spec.to); return has(x, y); }
    if (spec.toGate) return W.tiles.some((row, y) => row.some((c, x) => c === spec.toGate && near(x, y)));
    if (spec.toChest) return [].concat(spec.toChest).every(t => W.chests.filter(c => t.card ? c.card === t.card : c.quest === t.quest).every(c => has(c.x, c.y)) && W.chests.some(c => t.card ? c.card === t.card : c.quest === t.quest));
    throw new Error('路线检查缺少 to / toGate / toChest');
  }`);
  for (const r of spec.routes || []) {
    const ok = g.R(`__reach(${JSON.stringify(r)})`) === (r.expect !== false);
    console.log(`路线 ${ok ? '✓' : '✗'} ${r.name}`); if (!ok) fails.push('路线不对：' + r.name);
  }
  if (g.errors.length) fails.push('运行时错误：\n' + g.errors.join('\n'));
  console.log(`虚拟时长 ${g.seconds()} 秒`);
  console.log(fails.length ? '\n不通过：\n- ' + fails.join('\n- ') : '\n全部通过');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('失败：', e.message); process.exit(2); });
