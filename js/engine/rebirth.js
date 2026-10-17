'use strict';
// ===== 重生模式：正史通关后，回到关键时刻，在当时的条件下重新做决定 =====
// 剧本提供（都可选，没有 REBIRTH 就没有重生入口）：
//   REBIRTH = {
//     intro: async () => {},                        // 放好场景和位置，开始一局
//     res: [{ id, name, start?, get?: () => 数, bool? }],   // 资源；get 用来算派生值（如消息条数）
//     know: { id: '一句话' },                       // 可以打听到的消息
//     reflect: { q: '反思题', opts: ['选项', ...] },
//   }
//   GAME.motto = { text, src, kid, start?, clear?, end? }   // 开局、通关、报告末尾显示的引文
// 剧本里用：isRebirth()、res(id)、addRes(id, n, 原因)、learn(id)、knows(id)、decide(...)、endRebirth(...)、markCleared()
// 续玩：重生进度用正史的 autosave() 存；剧本只该在剧情走完一段的安全点存（进城、换段落），不要在决策中途存

const isRebirth = () => !!(G && G.mode === 'rebirth');
const hasRebirth = () => typeof REBIRTH !== 'undefined';
const clearedKey = () => `${GAME.id}_cleared`;
const reportsKey = () => `${GAME.id}_reports`;
function markCleared() { store(clearedKey(), '1'); }
// 试玩开关：网址后面加 ?rebirth 或 #rebirth，不用先通关就能进重生
const trialUnlock = () => { try { return /(^|[?#&])rebirth\b/.test(location.search + location.hash); } catch (e) { return false; } };
const hasCleared = () => hasRebirth() && (store(clearedKey()) === '1' || trialUnlock());
function loadReports() { try { return JSON.parse(store(reportsKey()) || '[]'); } catch (e) { return []; } }

// ----- 引文 -----
async function mottoCard(extra) {
  const M = GAME.motto; if (!M) return;
  const lines = [...wrap(M.text, W - 140, 21), `—— ${M.src}`, ''];
  if (M.kid) lines.push(...wrap(M.kid, W - 140, 21));
  if (extra) lines.push('', ...wrap(extra, W - 140, 21));
  await card(lines, { lh: 36, size: 21 });
}

// ----- 资源 -----
const resDef = id => REBIRTH.res.find(r => r.id === id);
function res(id) { const d = resDef(id); return d.get ? d.get() : (G.res[id] || 0); }
const resText = (d, v) => d.bool ? (v ? '有' : '无') : String(v);
async function addRes(id, n, why) {
  const d = resDef(id); if (!n) return;
  G.res[id] = Math.max(0, (G.res[id] || 0) + n);
  G.log.push({ k: 'res', id, n, why });
  Snd.sfx(n > 0 ? 'chest' : 'cancel');
  await narr(`（${d.name} ${n > 0 ? '+' : ''}${n}${why ? '：' + why : ''}）`);
}
function drawResPanel() {
  if (!isRebirth() || Scene !== MapScene) return;
  const s = REBIRTH.res.map(d => `${d.name}${resText(d, res(d.id))}`).join('  '); // 右上角，窄一点，别压住中间的地名牌
  ctx.font = `15px ${FONT}`;
  const w = ctx.measureText(s).width + 32;
  drawWin(W - w - 8, 8, w, 36);
  txt(s, W - w + 8, 18, { size: 15, ruby: false });
}

// ----- 消息（信息约束：没打听到的事，对应选项是灰的）-----
const knows = id => !!(G && G.know && G.know[id]);
async function learn(id) {
  if (!isRebirth() || knows(id)) return;
  G.know[id] = 1; G.log.push({ k: 'know', id });
  Snd.sfx('chest');
  await narr(`（记下一条消息：${REBIRTH.know[id]}）`);
}

// ----- 决策点 -----
// opts: [{ label, cost?: { 资源id: 数 }, need?: 消息id 或 [消息id], why: [{ t: 理由, card?: 依据卡 }] }]
async function decide(id, who, q, opts) {
  const need = o => [].concat(o.need || []);
  const lack = o => Object.entries(o.cost || {}).filter(([r, n]) => res(r) < n);
  const items = opts.map(o => {
    const miss = need(o).filter(k => !knows(k)), poor = lack(o);
    const cost = Object.entries(o.cost || {}).map(([r, n]) => `${resDef(r).name}-${n}`).join(' ');
    const desc = miss.length ? `你还不知道：${miss.map(k => REBIRTH.know[k]).join('；')}` : poor.length ? `${poor.map(([r]) => resDef(r).name).join('、')}不够了` : cost ? `要花：${cost}` : '';
    return { label: o.label, right: cost, disabled: !!(miss.length || poor.length), desc };
  });
  let c;
  for (; ;) {
    const mb = new MsgBox(who, q, { passive: true, top: true }); UI.push(mb);
    c = await menu(items, { x: 40, y: 220, w: W - 80, desc: true, cancel: false, pick: id, size: 19 });
    mb.close();
    if (c >= 0) break;
  }
  const o = opts[c];
  for (const [r, n] of Object.entries(o.cost || {})) await addRes(r, -n, o.label);
  const whys = o.why || [];
  let w = 0;
  if (whys.length > 1) w = await menu(whys.map(x => x.t), { x: 40, y: 200, w: W - 80, title: '你为什么这么选？', cancel: false, pick: id + ':why', size: 19 });
  G.log.push({ k: 'decide', id, q, choice: o.label, why: whys[w] ? whys[w].t : '', card: whys[w] && whys[w].card });
  return c;
}

// ----- 开局 / 续玩 -----
// 重生的进度只有一份（进城、歇息时自动存），一局结束或从头再来时清掉
const loadRebirth = () => loadSlot(0, rbKey);
const clearRebirth = () => store(rbKey(0), null);
async function rebirthEntry() {
  const d = loadRebirth();
  if (!d) { await startRebirth(); return true; }
  const c = await menu([{ label: '接着上次的', right: `${d.meta.place} ${fmtTime(d.meta.time)}` }, '从头再来'], { x: 40, y: 200, w: W - 80, title: '上次的重生还没走完', pick: 'resume' });
  if (c < 0) return false;
  if (c === 0) { Snd.sfx('save'); await resumeRebirth(d); return true; }
  if (await ask(null, '上次那一局的进度会丢掉。从头再来吗？', ['从头再来', '算了']) !== 0) return false;
  await startRebirth(); return true;
}
async function resumeRebirth(d) {
  await loadGameData(d);
  UI.stack.unshift(new Panel(drawResPanel));
}
async function startRebirth() {
  clearRebirth();
  newGame();
  G.mode = 'rebirth'; G.res = {}; G.know = {}; G.log = [];
  for (const d of REBIRTH.res) if (!d.get) G.res[d.id] = d.start || 0;
  await fadeOut(600);
  await mottoCard(GAME.motto && GAME.motto.start);
  UI.stack.unshift(new Panel(drawResPanel));
  await REBIRTH.intro();
  G.res0 = Object.fromEntries(REBIRTH.res.map(d => [d.id, res(d.id)])); // 开局时手里有什么（intro 里可能先给了东西）
  autosave(); // intro 里存的那份还没有 res0，续玩到结局会出不了报告
}

// ----- 结局和推演报告 -----
// e: { title, type: '史实' | '合理推演' | '历史上没有发生', lines: [], compare: [] }
const TYPE_COLOR = { '史实': '#90e0a0', '合理推演': '#ffe08a', '历史上没有发生': '#f0b080' };
function buildReport(e) {
  const dec = G.log.filter(x => x.k === 'decide');
  const known = Object.keys(REBIRTH.know).filter(knows), unknown = Object.keys(REBIRTH.know).filter(k => !knows(k));
  const resLines = REBIRTH.res.map(d => `${d.name}：${resText(d, G.res0[d.id])} → ${resText(d, res(d.id))}`);
  return {
    t: Date.now(), title: e.title, type: e.type,
    pages: [
      { head: `结局：${e.title}`, sub: e.type, lines: e.lines },
      { head: '你做的决定', lines: dec.length ? dec.flatMap(x => [`${x.choice}`, `　理由：${x.why}${x.card && CARDS[x.card] ? `（依据：「${CARDS[x.card].title}」）` : ''}`]) : ['这一局没有做大的决定。'] },
      { head: '你手里有什么', lines: [...resLines, `打听到的：${known.map(k => REBIRTH.know[k]).join('；') || '没有'}`, `没打听到的：${unknown.map(k => REBIRTH.know[k]).join('；') || '没有'}`] },
      { head: '和正史比一比', lines: e.compare || [] },
    ],
  };
}
class ReportView extends Widget {
  constructor(rep) { super(); this.rep = rep; this.pg = 0; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 500 && (Input.tap('a') || Input.tap('b'))) { Snd.sfx('cursor'); this.t = 0; if (++this.pg >= this.rep.pages.length) this.close(); } }
  draw() {
    ctx.fillStyle = '#0a0c1c'; ctx.fillRect(0, 0, W, H);
    const P = this.rep.pages[this.pg];
    ctx.globalAlpha = clamp(this.t / 300, 0, 1);
    txt(`推演报告　${this.pg + 1} / ${this.rep.pages.length}`, W / 2, 24, { align: 'center', size: 18, color: '#a89878' });
    txt(P.head, W / 2, 56, { align: 'center', size: 30, font: SERIF, color: '#ffe08a' });
    if (P.sub) txt(P.sub, W / 2, 98, { align: 'center', size: 18, color: TYPE_COLOR[P.sub] || '#efe6d0' });
    drawWin(32, 126, W - 64, H - 176);
    let y = 146;
    for (const ln of P.lines) {
      const sub = ln.startsWith('　'), ls = wrap(ln.trim(), W - 150, 19);
      if (!sub) txt('◆', 54, y + 2, { size: 14, color: '#ffe08a' });
      ls.forEach((l, i) => txt(l, sub ? 96 : 78, y + i * 30, { size: 19, color: sub ? '#c8c0a8' : '#f4ecd8' }));
      y += ls.length * 30 + (sub ? 10 : 4);
      if (y > H - 80) break;
    }
    if (this.t > 800 && Math.floor(this.t / 400) % 2) txt('▼', W / 2, H - 40, { align: 'center', size: 16, color: '#a89060' });
    ctx.globalAlpha = 1;
  }
}
async function endRebirth(e) {
  await fadeOut(600);
  Snd.play('ending');
  await card([e.title, '', e.type], { big: true });
  const rep = buildReport(e), v = new ReportView(rep);
  UI.push(v); await fadeIn(300); await v.done;
  const R = REBIRTH.reflect;
  if (R) {
    const mb = new MsgBox(null, R.q, { passive: true, top: true }); UI.push(mb);
    const c = await menu(R.opts, { x: 40, y: 220, w: W - 80, cancel: false, pick: 'reflect', size: 19 });
    mb.close();
    rep.reflect = R.opts[c];
    rep.pages.push({ head: '反思', lines: [R.q, '　' + rep.reflect] });
  }
  await mottoCard(GAME.motto && GAME.motto.end);
  const all = loadReports(); all.unshift(rep); store(reportsKey(), JSON.stringify(all.slice(0, 30)));
  G.over = 1; clearRebirth();
  await card(['推演报告已保存。', '', '标题画面的「推演报告」里可以随时翻看。', '换一种选择，再来一次「重生」吧！'], { lh: 40 });
  UI.stack.length = 0;
  titleLoop();
}
async function reportsMenu() {
  const all = loadReports();
  if (!all.length) { await card(['还没有推演报告。'], {}); return; }
  for (; ;) {
    const d = t => { const x = new Date(t); return `${x.getMonth() + 1}月${x.getDate()}日 ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
    const c = await menu(all.map((r, i) => ({ label: `${all.length - i}. ${r.title}`, right: `${r.type}　${d(r.t)}`, rcolor: TYPE_COLOR[r.type] })), { x: 40, y: 60, w: W - 80, visible: 10, title: '推演报告' });
    if (c < 0) return;
    await UI.push(new ReportView(all[c]));
  }
}
