'use strict';
// ===== 主循环 =====
let Scene = null;
let lastT = performance.now();
function frame(t) {
  const dt = Math.min(50, t - lastT); lastT = t;
  try {
    Input.update(dt);
    if (G && Scene !== TitleScene) G.time += dt;
    Fade.update(dt); Shake.update(dt); FX.update(dt);
    UI.update(dt);
    if (Scene && Scene.update) Scene.update(dt);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (Scene) Scene.draw();
    Fade.draw();
    UI.draw();
    FX.draw();
  } catch (e) { console.error(e); }
  Input.endFrame();
  requestAnimationFrame(frame);
}

// 迷宫楼层事件
const _warp = warp;
warp = async function (id, x, y, dir) {
  await _warp(id, x, y, dir);
  const m = MapScene.map;
  if (m.kind === 'd') { const ev = DUNGEONS[m.did].onFloor; if (ev && ev[m.floor]) await STORY[ev[m.floor]](); }
};

// ===== 画面缩放与触屏 =====
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
function resize() {
  const pad = isTouch ? 190 : 0;
  const s = Math.min(innerWidth / W, (innerHeight - pad) / H);
  cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', resize); resize();
document.querySelectorAll('[data-k]').forEach(el => {
  const k = el.dataset.k;
  const on = e => { e.preventDefault(); Snd.unlock(); Input.press(k); el.classList.add('on'); };
  const off = e => { e.preventDefault(); Input.release(k); el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
});
cv.addEventListener('pointerdown', () => Snd.unlock());

// 剧本数据就绪后的一次性连接
initQuests();
Object.keys(CARDS).forEach(cardImage); // 预加载史料卡图片
for (const L of Object.values(LOCS)) if (L.kind === 'dun') DUNGEONS[L.id].loc = L;
document.title = GAME.title + (GAME.subtitle ? '·' + GAME.subtitle : '');
try { document.fonts && document.fonts.load('bold 60px "Ma Shan Zheng"', GAME.title + (GAME.subtitle || '') + GAME.chapters.join('') + Object.values(CARDS).map(c => c.title).join('') + '史实演绎料卡小结'); } catch (e) { }
requestAnimationFrame(frame);
titleLoop();
