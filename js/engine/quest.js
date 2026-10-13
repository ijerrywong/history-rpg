'use strict';
// ===== 支线任务 =====
// 剧本在 QUESTS 里写任务。type: find 寻物（宝箱只在接下任务后出现）/ deliver 送信（交给另一座城镇的人）
// find 的位置：'world:区域' 为野外，'town:城镇' 为城镇里，'dun:场景:层' 为探索场景某层
// reward: { cards: [史料卡 id], items: [道具 id] }

// 开局时调用：把任务挂到 NPC 身上
function initQuests() {
  for (const [id, q] of Object.entries(QUESTS)) {
    const n = TOWNS[q.town].npcs.find(x => x.name === q.npc);
    if (n) n.quest = id; else console.error('任务找不到 NPC', id);
    if (q.to) { const t = TOWNS[q.to.town].npcs.find(x => x.name === q.to.npc); if (t) (t.deliver = t.deliver || []).push(id); else console.error('任务找不到收件人', id); }
  }
}

const qOn = id => G.quests[id] && G.quests[id].st === 'on';
function questReady(id) {
  const q = QUESTS[id];
  if (q.type === 'find') return hasItem(q.item);
  return false; // 送信在收件人那里交差
}
// 地图生成时调用：这张地图上要放哪些任务宝箱
function questChestsFor(where) { return Object.keys(QUESTS).filter(id => QUESTS[id].find === where); }
function questChest(id, x, y) { return { x, y, item: QUESTS[id].item, quest: id, key: 'c:q:' + id }; }
function chestShown(c) { return c.quest ? !G.flags[c.key] && qOn(c.quest) : !G.flags[c.key]; }
async function questFound(c) {
  const q = QUESTS[c.quest]; addItem(q.item);
  await narr(`找到了「${ITEMS[q.item].name}」！\n（拿回去交给${TOWNS[q.town].name}的${q.npc}吧。）`);
}
function questMark(d) {
  if (!G) return null;
  for (const id of d.deliver || []) if (qOn(id) && hasItem(QUESTS[id].item)) return '?';
  const id = d.quest; if (!id) return null;
  const st = G.quests[id];
  if (!st) return (F().ch || 0) >= (QUESTS[id].ch || 0) ? '!' : null;
  return st.st === 'on' && questReady(id) ? '?' : null;
}
async function finishQuest(id) {
  const q = QUESTS[id], rw = q.reward || {};
  G.quests[id].st = 'done';
  Snd.sfx('join');
  await narr(`任务「${q.name}」完成！`);
  for (const it of rw.items || []) await giveItem(it);
  for (const c of rw.cards || []) await getCard(c);
}
// 和 NPC 对话时先走这里；返回 true 表示任务对话已处理
async function questTalk(d) {
  for (const id of d.deliver || []) {
    const q = QUESTS[id];
    if (qOn(id) && hasItem(q.item)) { removeItem(q.item); await say(d.name, q.to.say); await finishQuest(id); return true; }
  }
  const id = d.quest; if (!id) return false;
  const q = QUESTS[id], st = G.quests[id];
  if (!st) {
    if ((F().ch || 0) < (q.ch || 0)) return false;
    await say(d.name, q.ask);
    const c = await ask(d.name, `（要接下「${q.name}」吗？）`, ['接下', '再说吧']);
    if (c !== 0) { await say(d.name, '……那就算了。改主意了再来找我吧。'); return true; }
    G.quests[id] = { st: 'on' };
    if (q.type === 'deliver') addItem(q.item);
    Snd.sfx('confirm');
    await narr(`接下了任务「${q.name}」。\n（${q.desc}）`);
    return true;
  }
  if (st.st === 'on') {
    if (questReady(id)) { removeItem(q.item); await say(d.name, q.done); await finishQuest(id); }
    else await say(d.name, q.wait);
    return true;
  }
  if (q.after) { await say(d.name, q.after); return true; }
  return false;
}
function questStatus(id) {
  const st = G.quests[id];
  if (st.st === 'done') return '已完成';
  if (questReady(id)) return '可交差';
  return '进行中';
}
async function questMenu() {
  const ids = Object.keys(G.quests).filter(id => QUESTS[id]).sort((a, b) => (G.quests[a].st === 'done') - (G.quests[b].st === 'done'));
  if (!ids.length) { await narr('还没有接下任何任务。\n（头上有「！」的人，也许正需要帮忙。）'); return; }
  const done = ids.filter(id => G.quests[id].st === 'done').length;
  await menu(ids.map(id => {
    const st = questStatus(id);
    return { label: QUESTS[id].name, right: st, desc: QUESTS[id].desc, color: st === '已完成' ? '#77778a' : null, rcolor: st === '可交差' ? '#80e0ff' : st === '已完成' ? '#77778a' : null };
  }), { x: 120, y: 60, w: 528, visible: 9, title: `任务（完成 ${done} / ${Object.keys(QUESTS).length}）`, desc: true });
}
