'use strict';
// ===== 史料卡与章末小结 =====
// 剧本在 CARDS 里写卡片：{ title, ch: 章, fact: true 史实 / false 演绎, text, src: 出处 }
// 卡片可以带一张图：img: { src: 'img/cards/x.jpg', cap: 图片说明, credit: 作者与许可 }
// 剧本在 RECAPS 里写每章小结：{ game: [游戏里发生了什么], history: [真实的历史] }

function cardNo(id) { return Object.keys(CARDS).indexOf(id) + 1; }
function cardCount() { return Object.keys(G.cards).filter(id => CARDS[id]).length; }

// 卡片图片：开局预加载；单文件版由 build.py 把图片塞进 EMBED_IMG
const CARD_IMGS = {};
function cardImage(id) {
  const c = CARDS[id]; if (!c.img || typeof Image === 'undefined') return null;
  let im = CARD_IMGS[id];
  if (!im) { im = CARD_IMGS[id] = new Image(); const e = typeof EMBED_IMG !== 'undefined' ? EMBED_IMG : {}; im.src = e[c.img.src] || c.img.src; }
  return im.complete && im.naturalWidth ? im : null;
}
const cardSize = id => CARDS[id].img ? [728, 524] : [560, 440];

// 相框里的照片：照片要平滑缩放，不走像素风
function drawCardPhoto(id, x, y, w, h) {
  const c = CARDS[id], im = cardImage(id);
  // 相框贴着图片的实际比例，竖幅的画不会留黑边
  const k = im ? Math.min(w / im.naturalWidth, h / im.naturalHeight) : 1;
  const iw = im ? im.naturalWidth * k : w, ih = im ? im.naturalHeight * k : h, ix = x + (w - iw) / 2, iy = y + (h - ih) / 2;
  ctx.fillStyle = '#2a1a0a'; ctx.fillRect(ix - 5, iy - 5, iw + 10, ih + 10);
  ctx.fillStyle = '#f8f0dc'; ctx.fillRect(ix - 2, iy - 2, iw + 4, ih + 4);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(ix, iy, iw, ih);
  if (im) {
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, ix, iy, iw, ih);
    ctx.restore();
  } else txt('图片加载中……', x + w / 2, y + h / 2 - 10, { align: 'center', size: 16, color: '#a89878', shadow: false });
  let yy = y + h + 14;
  for (const l of wrap(c.img.cap || '', w, 15)) { txt(l, x, yy, { size: 15, color: '#3a2a1a', shadow: false }); yy += 24; }
  if (c.img.credit) txt(`图：${c.img.credit}`, x, yy + 2, { size: 12, color: '#8a6a40', shadow: false });
}

// 羊皮纸卡面
function drawCardFace(id, x, y, w, h, isNew) {
  const c = CARDS[id];
  ctx.save();
  rr(x, y, w, h, 10); ctx.fillStyle = '#efe0bc'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#8a5a2a'; rr(x + 6, y + 6, w - 12, h - 12, 8); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#b08850'; rr(x + 12, y + 12, w - 24, h - 24, 6); ctx.stroke();
  ctx.restore();
  txt(`${isNew ? '★ 新发现　' : ''}史料卡 No.${cardNo(id)}`, x + 32, y + 28, { size: 16, b: isNew, color: isNew ? '#b03020' : '#8a5a2a', shadow: false });
  const tag = c.fact ? '史 实' : '演 绎', tc = c.fact ? '#2a6a3a' : '#a04a20';
  ctx.font = `bold 16px ${FONT}`; const tw = ctx.measureText(tag).width + 20;
  ctx.fillStyle = tc; ctx.fillRect(x + w - 32 - tw, y + 24, tw, 26);
  txt(tag, x + w - 32 - tw / 2, y + 28, { align: 'center', size: 16, b: true, color: '#fff8e8', shadow: false });
  txt(c.title, x + w / 2, y + 66, { align: 'center', size: 34, font: SERIF, color: '#3a1a0a', shadow: false });
  ctx.fillStyle = '#b08850'; ctx.fillRect(x + 40, y + 116, w - 80, 2);
  if (c.img) {
    drawCardPhoto(id, x + 36, y + 138, 300, 220);
    wrap(c.text, w - 364 - 40, 20).forEach((l, i) => txt(l, x + 364, y + 136 + i * 34, { size: 20, color: '#2a1a0a', shadow: false }));
  } else wrap(c.text, w - 80, 21).forEach((l, i) => txt(l, x + 40, y + 136 + i * 37, { size: 21, color: '#2a1a0a', shadow: false }));
  if (c.src) txt(`—— ${c.src}`, x + w - 40, y + h - 46, { align: 'right', size: 16, color: '#8a5a2a', shadow: false });
}
class CardView extends Widget {
  constructor(id, o = {}) { super(); this.id = id; this.o = o; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 500 && (Input.tap('a') || Input.tap('b'))) { Snd.sfx('cancel'); this.close(); } }
  draw() {
    const k = clamp(this.t / 260, 0, 1), e = 1 - Math.pow(1 - k, 3);
    ctx.fillStyle = `rgba(0,0,0,${0.6 * e})`; ctx.fillRect(0, 0, W, H);
    const [w, h] = cardSize(this.id), x = W / 2 - w / 2, y = H / 2 - h / 2 - 8 + (1 - e) * 60;
    ctx.globalAlpha = e;
    if (this.o.isNew && y > 44) txt('获得新的史料卡！', W / 2, y - 34, { align: 'center', size: 22, b: true, color: '#ffe08a' });
    drawCardFace(this.id, x, y, w, h, this.o.isNew);
    if (this.o.isNew) txt(`收集进度 ${cardCount()} / ${Object.keys(CARDS).length}`, W / 2, y + h + 6, { align: 'center', size: 16, color: '#efe6d0' });
    ctx.globalAlpha = 1;
  }
}
async function getCard(id) {
  if (!CARDS[id]) { console.error('没有这张史料卡', id); return; }
  if (G.cards[id]) return;
  G.cards[id] = cardCount() + 1;
  Snd.sfx('levelup');
  FX.burst(W / 2, H / 2, 24, ['#ffe08a', '#fff8e0', '#f0c040']);
  await UI.push(new CardView(id, { isNew: true }));
}
const hasCard = id => !!(G && G.cards[id]);

async function cardsMenu() {
  const ids = Object.keys(CARDS);
  let i = 0;
  for (; ;) {
    const items = ids.map((id, k) => G.cards[id] ? { label: `${k + 1}. ${CARDS[id].title}`, right: CARDS[id].fact ? '史实' : '演绎', rcolor: CARDS[id].fact ? '#90e0a0' : '#f0b080' } : { label: `${k + 1}. ？？？`, right: (GAME.chapters[CARDS[id].ch] || '').split(' ')[0], disabled: true });
    const c = await menu(items, { x: 120, y: 40, w: 528, visible: 10, start: i, title: `史料卡（已收集 ${cardCount()} / ${ids.length}）` });
    if (c < 0) return;
    i = c;
    await UI.push(new CardView(ids[c]));
  }
}

// 章末小结：游戏里发生了什么 → 真实的历史 → 本章史料卡
class RecapView extends Widget {
  constructor(ch) {
    super(); this.ch = ch; this.t = 0; this.pg = 0;
    const R = RECAPS[ch];
    const ids = Object.keys(CARDS).filter(id => CARDS[id].ch === ch);
    this.pages = [
      { head: '这一章，我们经历了……', color: '#ffe08a', lines: R.game },
      { head: '真实的历史是这样的', color: '#90e0a0', lines: R.history },
      { head: `本章史料卡（${ids.filter(hasCard).length} / ${ids.length}）`, color: '#ffe08a', cards: ids },
    ];
  }
  update(dt) {
    this.t += dt;
    if (this.t > 600 && (Input.tap('a') || Input.tap('b'))) { Snd.sfx('cursor'); this.t = 0; if (++this.pg >= this.pages.length) this.close(); }
  }
  draw() {
    ctx.fillStyle = '#0a0c1c'; ctx.fillRect(0, 0, W, H);
    const P = this.pages[this.pg], a = clamp(this.t / 400, 0, 1);
    ctx.globalAlpha = a;
    txt(`${GAME.chapters[this.ch]}　·　小结`, W / 2, 30, { align: 'center', size: 20, color: '#a89878' });
    txt(P.head, W / 2, 68, { align: 'center', size: 32, font: SERIF, color: P.color });
    drawWin(40, 124, W - 80, H - 190);
    if (P.lines) {
      let y = 148;
      for (const ln of P.lines) {
        const ls = wrap(ln, W - 170, 21);
        txt('◆', 66, y + 2, { size: 16, color: P.color });
        ls.forEach((l, i) => txt(l, 92, y + i * 35, { size: 21 }));
        y += ls.length * 35 + 12;
      }
    } else {
      P.cards.forEach((id, i) => {
        const got = hasCard(id), y = 146 + i * 40;
        txt(got ? `✓　${CARDS[id].title}` : '？　？？？（这一章还有没找到的史料）', 76, y, { size: 21, color: got ? '#f4ecd8' : '#77778a' });
        if (got) txt(CARDS[id].fact ? '史实' : '演绎', W - 76, y, { align: 'right', size: 18, color: CARDS[id].fact ? '#90e0a0' : '#f0b080' });
      });
      txt('（菜单里的「史料卡」可以随时翻看）', W / 2, H - 100, { align: 'center', size: 17, color: '#a89878' });
    }
    if (this.t > 1000 && Math.floor(this.t / 400) % 2) txt('▼', W / 2, H - 44, { align: 'center', size: 16, color: '#a89060' });
    ctx.globalAlpha = 1;
  }
}
async function recap(ch) {
  if (!RECAPS[ch] || isRebirth()) return; // 重生模式不放章末小结，结局后有推演报告
  Snd.play('title');
  await fadeOut(400);
  const v = new RecapView(ch); UI.push(v);
  await fadeIn(300);
  await v.done;
}
