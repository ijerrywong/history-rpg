#!/usr/bin/env python3
"""生成 App 图标：python3 -I tools/make_icon.py [剧本id]  → mac/<剧本id>.icns

画法：64×64 的像素画，再无损放大到 1024。
背景是黄昏的沙丘和远处的驼队，中间站着剧本的主角（GAME.titleSprites 的第一个精灵），
人物像素直接取自游戏引擎的 charGrid，和游戏里长得一模一样。
"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sid = sys.argv[1] if len(sys.argv) > 1 else 'zhangqian'

# 1. 从游戏引擎里拿主角的像素格和配色
js = r"""
const { boot } = require('./tools/lib/sandbox');
const g = boot('js/story/%s.js');
console.log(g.R(`(() => {
  const key = (GAME.titleSprites || [])[0] || CHARS[GAME.party[0]].sp;
  const d = SPRITES[typeof key === 'function' ? key() : key];
  const grid = charGrid('down', 0, d).map(r => r.join(''));
  const pal = { k: '#181018', h: d.h, s: d.s || '#f2c494', e: '#181018', m: d.s ? shadeHex(d.s, -0.25) : '#d89a7a', r: d.r, R: d.R, t: d.t, b: d.b || '#222', x: d.x || '#1a1a1a', y: d.y || '#f0c040', g: '#8a8a96', j: d.j || '#8a5a30', q: d.q || '#e8e0d0' };
  return JSON.stringify({ grid, pal, sky: GAME.titleSky || null });
})()`));
""" % sid
data = json.loads(subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

N = 64
img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
px = img.load()

# 2. 圆角方形底（macOS 图标的外形，四周留边）
M, R = 5, 11
def inside(x, y):
    cx = min(max(x, M + R), N - 1 - M - R); cy = min(max(y, M + R), N - 1 - M - R)
    return (x - cx) ** 2 + (y - cy) ** 2 <= R * R and M <= x < N - M and M <= y < N - M

# 3. 黄昏的天空（分层色带）、太阳、沙丘、远处的驼队
sky = ['#2a1838', '#4a2440', '#7a3438', '#b85a30', '#e08a3a', '#f0b860']
dunes = [('#c88a48', 40), ('#a86a38', 46), ('#8a5430', 52)]
for y in range(N):
    for x in range(N):
        if not inside(x, y): continue
        band = min(len(sky) - 1, max(0, (y - M) * len(sky) // 38))
        px[x, y] = hexc(sky[band])
d = ImageDraw.Draw(img)
d.ellipse([47, 11, 56, 20], fill=hexc('#ffe8a0'))
import math
for col, base in dunes:
    for x in range(N):
        top = int(base - 4 * math.sin(x / 9 + base))
        for y in range(top, N):
            if inside(x, y): px[x, y] = hexc(col)
# 驼队剪影：两峰双峰驼（朝左），站在第一道沙丘上
CAMEL = ["##.......",
         ".#..#.#..",
         ".########",
         "..#######",
         "..#....#.",
         "..#....#."]
for cx in (5, 13):
    by = int(40 - 4 * math.sin((cx + 4) / 9 + 40)) - 5
    for dy, row in enumerate(CAMEL):
        for dx, ch in enumerate(row):
            x, y = cx + dx, by + dy
            if ch == '#' and inside(x, y): px[x, y] = hexc('#3a2030')

# 4. 主角：16×16 放大 2 倍，带深色描边，站在画面中下方
grid, pal = data['grid'], data['pal']
SX, SY, S = 16, 26, 2
sprite = Image.new('RGBA', (16 * S + 4, 16 * S + 4), (0, 0, 0, 0))
sp = sprite.load()
for y, row in enumerate(grid):
    for x, k in enumerate(row):
        if k == '.' or k not in pal: continue
        for a in range(S):
            for b in range(S):
                sp[2 + x * S + a, 2 + y * S + b] = hexc(pal[k])
# 描边
mask = [[sp[x, y][3] > 0 for y in range(sprite.size[1])] for x in range(sprite.size[0])]
for x in range(sprite.size[0]):
    for y in range(sprite.size[1]):
        if mask[x][y]: continue
        if any(0 <= x + dx < sprite.size[0] and 0 <= y + dy < sprite.size[1] and mask[x + dx][y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            sp[x, y] = hexc('#140c18')
img.alpha_composite(sprite, (SX - 2, SY - 2))

# 5. 放大并导出 iconset → icns
big = img.resize((1024, 1024), Image.NEAREST)
os.makedirs(os.path.join(ROOT, 'mac'), exist_ok=True)
big.save(os.path.join(ROOT, 'mac', f'{sid}-icon.png'))
with tempfile.TemporaryDirectory() as tmp:
    iconset = os.path.join(tmp, 'AppIcon.iconset'); os.makedirs(iconset)
    for size in (16, 32, 128, 256, 512):
        for scale in (1, 2):
            p = size * scale
            im = big.resize((p, p), Image.NEAREST if p >= 64 else Image.LANCZOS)
            im.save(os.path.join(iconset, f'icon_{size}x{size}{"@2x" if scale == 2 else ""}.png'))
    out = os.path.join(ROOT, 'mac', f'{sid}.icns')
    subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', out], check=True)
print(f'已生成 mac/{sid}.icns 和预览 mac/{sid}-icon.png')
