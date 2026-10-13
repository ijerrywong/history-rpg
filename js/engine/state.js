'use strict';
// ===== 存档状态 =====
// 剧本需提供：GAME（id、标题、开局位置）、CHARS（同伴）、ITEMS（道具）
let G = null;
const F = () => G.flags;
function newGame() {
  G = { v: 1, inv: {}, flags: { ch: 0 }, party: GAME.party.slice(), pos: null, time: 0, visited: {}, quests: {}, cards: {} };
}
function charName(id) { return CHARS[id].name; }
function joinParty(id) { if (!G.party.includes(id)) G.party.push(id); Snd.sfx('join'); return narr(`${charName(id)}加入了队伍！`); }
function leaveParty(id) { G.party = G.party.filter(x => x !== id); }
function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; }
function removeItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) - n; if (G.inv[id] <= 0) delete G.inv[id]; }
function hasItem(id) { return (G.inv[id] || 0) > 0; }
async function giveItem(id) { addItem(id); Snd.sfx('chest'); await narr(`得到了「${ITEMS[id].name}」！`); }
