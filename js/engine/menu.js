'use strict';
// ===== 存读档 =====
const saveKey = slot => `${GAME.id}_save_${slot}`;
const rbKey = slot => `${GAME.id}_rb_${slot}`; // 重生的进度不占正史存档
function fmtTime(ms) { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}时${String(m % 60).padStart(2, '0')}分`; }
function saveGame(slot) {
  const meta = { place: MapScene.map ? MapScene.map.name : '', time: G.time, ch: GAME.chapters[G.flags.ch || 0], cards: cardCount() };
  store(isRebirth() ? rbKey(slot) : saveKey(slot), JSON.stringify({ G, meta }));
}
function loadSlot(slot, key = saveKey) { try { const s = store(key(slot)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function autosave() { if (G && !G.over) saveGame(0); } // over：重生一局已结束，剧情里还没跑完的 autosave 不能把它存回去
function slotLabel(s) { const d = loadSlot(s); const nm = s === 0 ? '自动' : `档案${s}`; if (!d) return { label: `${nm}　——　空`, disabled: true }; const m = d.meta; return { label: `${nm}　${m.ch}`, right: `${m.place} 卡${m.cards} ${fmtTime(m.time)}` }; }
async function loadGameData(d) {
  G = d.G;
  G.flags = G.flags || {}; G.visited = G.visited || {}; G.inv = G.inv || {}; G.quests = G.quests || {}; G.cards = G.cards || {};
  Input.releaseAll();
  await fadeOut(300);
  Scene = MapScene; MapScene.enter(G.pos.map, G.pos.x, G.pos.y, G.pos.dir);
  await fadeIn(300);
}
async function loadMenu(fromTitle) {
  const items = [0, 1, 2, 3].map(slotLabel);
  const c = await menu(items, { x: 40, y: 120, w: W - 80, title: '读取进度' });
  if (c < 0) return false;
  const d = loadSlot(c); if (!d) return false;
  if (!fromTitle && await ask(null, '读取这个进度吗？当前未存档的进度会丢失。', ['读取', '算了']) !== 0) return false;
  Snd.sfx('save');
  await loadGameData(d);
  return true;
}
async function saveMenu() {
  if (isRebirth()) { await narr('（重生会在进城、歇息时自动存档。下次从标题画面的「重生」接着玩。）'); return; }
  const items = [1, 2, 3].map(s => { const l = slotLabel(s); return { label: l.label, right: l.right }; });
  const c = await menu(items, { x: 40, y: 140, w: W - 80, title: '保存进度（进城和章节开始时会自动存档）' });
  if (c < 0) return;
  if (loadSlot(c + 1) && await ask(null, '覆盖这个档案吗？', ['覆盖', '算了']) !== 0) return;
  saveGame(c + 1); Snd.sfx('save');
  await narr('进度已保存。');
}

// ===== 设置 =====
async function settingsMenu() {
  const SP = [['慢', 34], ['中', 22], ['快', 10]];
  const mk = () => [
    { label: '音乐音量', right: '■'.repeat(Settings.music) + '□'.repeat(10 - Settings.music) },
    { label: '音效音量', right: '■'.repeat(Settings.sfx) + '□'.repeat(10 - Settings.sfx) },
    { label: '文字速度', right: (SP.find(s => s[1] === Settings.textSpeed) || SP[1])[0] },
    { label: '拼音', right: Settings.pinyin ? '开（生字上方标拼音）' : '关' },
    { label: '完成' }];
  const lr = (i, d, mnu) => {
    if (i === 0) Settings.music = clamp(Settings.music + d, 0, 10);
    if (i === 1) Settings.sfx = clamp(Settings.sfx + d, 0, 10);
    if (i === 2) { const k = SP.findIndex(s => s[1] === Settings.textSpeed); Settings.textSpeed = SP[clamp((k < 0 ? 1 : k) + d, 0, 2)][1]; }
    if (i === 3) Settings.pinyin = !Settings.pinyin;
    Snd.applyVol(); Snd.sfx('cursor'); saveSettings();
    mnu.items = mk();
  };
  let start = 0;
  for (; ;) {
    const m = new Menu(mk(), { x: 140, y: 120, w: 488, title: '设置（←→ 调整）', lr, start });
    const c = await UI.push(m);
    if (c < 0 || c === 4) break;
    start = c;
    if (c === 3) lr(3, 1, m); // 拼音也可以直接按确认切换
  }
}

// ===== 野外菜单 =====
function drawPartyPanel() {
  const x = 200, y = 16, w = W - 216;
  const ids = G.party;
  drawWin(x, y, w, ids.length * 70 + 26);
  ids.forEach((id, i) => {
    const yy = y + 16 + i * 70;
    ctx.drawImage(Gfx.char(CHARS[id].sp).down[0], x + 18, yy + 4);
    txt(charName(id), x + 80, yy + 6, { size: 20, b: true });
    txt(CHARS[id].title || '', x + 80, yy + 36, { size: 16, color: '#c8c0a8' });
  });
  const by = y + ids.length * 70 + 36;
  drawWin(x, by, w, 124);
  txt(GAME.chapters[F().ch || 0], x + 24, by + 18, { size: 19, color: '#ffe08a' });
  txt(`史料卡　${cardCount()} / ${Object.keys(CARDS).length}`, x + 24, by + 52, { size: 19 });
  txt(`时间　${fmtTime(G.time)}`, x + 280, by + 52, { size: 19 });
  txt(MapScene.map ? `所在：${MapScene.map.name}` : '', x + 24, by + 86, { size: 17, color: '#c8c0a8' });
}
async function fieldMenu() {
  Snd.sfx('confirm');
  const panel = new Panel(drawPartyPanel); UI.push(panel);
  let i = 0;
  for (; ;) {
    const c = await menu(['史料卡', '道具', '任务', '存档', '读档', '设置', '关闭'], { x: 16, y: 16, w: 170, start: i });
    if (c < 0 || c === 6) break;
    i = c;
    if (c === 0) await cardsMenu();
    else if (c === 1) await fieldItem();
    else if (c === 2) await questMenu();
    else if (c === 3) await saveMenu();
    else if (c === 4) { panel.close(); if (await loadMenu(false)) return; UI.push(panel); }
    else if (c === 5) await settingsMenu();
  }
  panel.close();
}
async function fieldItem() {
  const keys = Object.keys(G.inv);
  if (!keys.length) { await narr('身上什么东西也没有。'); return; }
  const items = keys.map(k => ({ label: ITEMS[k].name, right: G.inv[k] > 1 ? '×' + G.inv[k] : '', desc: ITEMS[k].desc, color: ITEMS[k].type === 'quest' ? '#80e0ff' : '#ffe08a' }));
  await menu(items, { x: 120, y: 60, w: 528, visible: 8, title: '随身物品', desc: true });
}

// ===== 进屋 =====
async function rest(b) {
  const c = await ask(b.keeper || null, b.ask || '要歇一歇吗？', ['歇一会儿', '不用了']);
  if (c !== 0) return;
  await fadeOut(500);
  Snd.play('none'); Snd.sfx('inn');
  await sleep(1500);
  autosave();
  Snd.play(MapScene.musicFor());
  await fadeIn(500);
  await narr('（休息好了。进度已自动存档。）');
}
async function enterBuilding(b) {
  if (b.type === 'rest') return rest(b);
  if (b.type === 'special') return STORY[b.ev](b);
  const lines = typeof b.say === 'function' ? b.say() : b.say;
  if (lines) await say(b.who || null, lines);
  else await narr('屋里没有人。');
  if (b.card && (!b.cardIf || b.cardIf())) await getCard(b.card);
  if (b.learn) await learn(b.learn);
}

// ===== 标题画面 =====
const TitleScene = {
  t: 0,
  update(dt) { this.t += dt; },
  draw() {
    const T = GAME.titleSky || ['#060818', '#1a1838', '#3a2438'];
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, T[0]); g.addColorStop(0.55, T[1]); g.addColorStop(1, T[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = mkRng(7);
    for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * 300, tw = (Math.sin(this.t / 600 + i) + 1) / 2; ctx.globalAlpha = 0.3 + tw * 0.7; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 2, 2); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4ecc8'; ctx.beginPath(); ctx.arc(600, 110, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.12)'; ctx.beginPath(); ctx.arc(600, 110, 80, 0, Math.PI * 2); ctx.fill();
    const L = GAME.titleHills || ['#2a2448', '#1e1a36', '#120f22'];
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = L[layer];
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 380 + layer * 50 - Math.abs(Math.sin(x / (140 - layer * 30) + layer * 2)) * (120 - layer * 30));
      ctx.lineTo(W, H); ctx.fill();
    }
    // 队伍从右往左走过
    const ids = GAME.titleSprites || GAME.party.map(id => CHARS[id].sp);
    ids.forEach((sp, i) => { const x = W - ((this.t / 30 + i * 56) % (W + 200)) + 100, y = 452; ctx.drawImage(Gfx.char(sp).left[Math.floor(this.t / 300 + i) % 2], x - 24, y - 24); });
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${GAME.titleSize || 96}px ${SERIF}`; ctx.lineWidth = 10; ctx.strokeStyle = '#2a0a08'; ctx.strokeText(GAME.title, W / 2, 140);
    const tg = ctx.createLinearGradient(0, 90, 0, 190); tg.addColorStop(0, '#fff2b0'); tg.addColorStop(1, '#d88a20'); ctx.fillStyle = tg; ctx.fillText(GAME.title, W / 2, 140);
    if (GAME.subtitle) { ctx.font = `bold 34px ${SERIF}`; ctx.fillStyle = '#e8d8f0'; ctx.fillText(`— ${GAME.subtitle} —`, W / 2, 222); }
    ctx.restore();
    if (GAME.tagline) txt(GAME.tagline, W / 2, H - 34, { align: 'center', size: 15, color: '#8a80a8' });
  }
};
// 引擎的署名和协议；题材自己的作者和协议写在剧本的 GAME.author / GAME.license
const ENGINE_INFO = { name: '像素历史 RPG 模板', author: '剑宁（jerrywong）', license: 'MPL-2.0', home: 'github.com/ijerrywong' };
async function aboutScreen() {
  await card(['关于', '',
    `《${GAME.title}》剧本：${GAME.author || '佚名'}　协议：${GAME.license || '未注明'}`,
    GAME.license && GAME.license.includes('NC') ? '可以免费玩、转发、改编，但不能拿去卖钱' : '',
    '史料卡图片的作者和许可，印在每张卡的下方',
    `游戏引擎：${ENGINE_INFO.name}　© ${ENGINE_INFO.author}　${ENGINE_INFO.license}`,
    '这个网页文件本身就是源代码',
    `联系作者：${ENGINE_INFO.home}`], { lh: 40, size: 18, big: true });
}
async function helpScreen() {
  await card(['操作说明', '', '方向键 / WASD：移动、选择', 'Z / 空格 / 回车：确认、调查、对话', 'X / Esc：取消；在地图上打开菜单', '手机：屏幕下方的十字键与 A / B 键', '', '和每个人聊聊天，地上闪光的是史料！'], { lh: 38, size: 21, big: true });
}
async function titleLoop() {
  Scene = TitleScene; Snd.play('title'); Fade.a = 0;
  for (; ;) {
    const has = [0, 1, 2, 3].some(s => loadSlot(s));
    const items = [{ label: '新的旅程', k: 'new' }, { label: '继续旅程', disabled: !has, k: 'load' }];
    if (hasCleared()) items.push({ label: '重生', k: 'rebirth', color: '#ffd870' });
    if (hasRebirth() && loadReports().length) items.push({ label: '推演报告', k: 'reports' });
    items.push({ label: '游戏设置', k: 'set' }, { label: '操作说明', k: 'help' }, { label: '关于', k: 'about' });
    const lh = items.length > 5 ? 32 : 38;
    const c = await menu(items, { x: W / 2 - 110, y: Math.min(300, H - 56 - items.length * lh - 30), w: 220, lh, cancel: false });
    const k = items[c].k;
    if (k === 'new') {
      newGame();
      await fadeOut(600);
      if (GAME.motto) await mottoCard(GAME.motto.start);
      await STORY.intro();
      return;
    }
    if (k === 'rebirth') { if (await rebirthEntry()) return; }
    if (k === 'load') { if (await loadMenu(true)) return; }
    if (k === 'reports') await reportsMenu();
    if (k === 'set') await settingsMenu();
    if (k === 'help') await helpScreen();
    if (k === 'about') await aboutScreen();
  }
}
