---
name: scene-art
description: >
  给 history-rpg 的造型库（js/engine/buildings.js）加新的城镇建筑或世界地图地标，
  照着实物在那个年代的特征画像素造型，给用户看画廊截图确认后再用进剧本。
  触发：用户说「加一种建筑」「这个地方要有自己的样子」「画个寺庙/港口/城门」「景物太像了」时使用；
  new-history-game 大纲里标了「需新造型」时也走这里。
---

# 补造型

用户的硬要求：景物要按实物特征各有造型，**不能拿现有的房子换个颜色、改个名字凑数**。孩子玩几个地方，靠的就是每个地方长得不一样。

## 管理约定

| 协议面 | 约定 |
|---|---|
| Tools | 编辑 `js/engine/buildings.js`；看效果用 `tools/gallery.html` 和游戏里的城镇；实物资料可以派 history-fact-checker 或 WebSearch |
| Rules | 造型名用通用英文词（temple、harbor），不写题材专属名字（engine-check 会查）；不用旧造型改色冒充新造型；不画年代错位的东西 |
| Verification | `node tools/engine-check.js`、`node tools/playtest.js <id>` 通过；画廊截图 + 城镇里截图给用户看过 |

## 流程

### 1. 先查实物（不画想当然的样子）
写下这个东西在**那个年代**的 3–5 个可辨认特征，例如：
- 汉代烽燧：夯土高墩、顶上女墙、旁边堆着柴草（积薪）、守卒小屋
- 匈奴单于大帐：比普通毡帐大、装饰华丽、门前立马尾大纛
拿不准就查（派 history-fact-checker，或 WebSearch 找遗址、文物、古画）。顺手记下**不能画的东西**（例如汉代西域没有伊斯兰圆顶）。

### 2. 和用户对一下特征（要问用户）
用 AskUserQuestion 列出打算画的特征和不画的东西，让用户确认或补充。用户对孩子会喜欢什么最有判断。

### 3. 画
在 `js/engine/buildings.js` 里加一项。

**城镇建筑**（`BUILDINGS`）：
- 画布宽 80（5 格）、高 48 + top；坐标原点是占地左上角，往上画用负 y
- 门必须在底边正中（x 32–48），因为门格固定在那里
- `top` 是高出占地的部分：第一排建筑上方只有约 2 格空地，超过 32 就要在城镇上设 `yOffset: 1`
- `label` 是招牌的 y（原始像素）；`fx(ctx, X, Y, t)` 是每帧动画，比如飘旗、炊烟
- 可用小件：`hanRoof`（汉式屋顶，可加鸱尾）、`rammed`（夯土墙）、`door`、`lattice`（窗格）、`horse`、`sheep`、`flagPole`、`yurtBody`、`yurtMini`、`waveFlag`、`smoke`；
  像素原语 `prect` `pell` `ppoly` `pline` `px` `shadeHex`；植物 `tree` `pine` `deadTree`

**世界地图地标**（`LANDMARKS`）：
- 占 w×h 格（每格 16 像素），入口是最下排正中那格，其余格子游戏里走不通
- 关卡（GATE_ART）用 4×4，`draw(x, o)` 里用 `o.open` 画打开后的样子

一个造型就是一幅小画：先画最远的，再画近的；颜色从同一种材料的明暗里取，不要满屏纯色。

### 4. 看效果
```bash
python3 -m http.server 8765 --bind 127.0.0.1
```
- 浏览器打开 `http://127.0.0.1:8765/tools/gallery.html?v=<数字>`：和其他造型放在一起，确认一眼能分出来
- 剧本里给建筑写上 `art: '<名字>'`，进游戏截一张城镇图：招牌位置、挡没挡住别的建筑和路、人从后面走过时被挡住是否正常

把两张截图给用户看，按意见修一轮。

### 5. 验证
```bash
node tools/engine-check.js
node tools/playtest.js <id>
```

## 现有造型（会越来越多，以 gallery 为准）
- 城镇：palace 宫殿、market 市场、bookshop 书肆、barracks 兵营、house 民宅、station 驿站、office 官府、beacon 烽火台、yurt 毡帐、yurt_home 住人的毡帐、yurt_herd 带羊圈的毡帐、yurt_old 旧毡帐、yurt_royal 首领大帐、hall 通用瓦房
- 地标：capital 都城、frontier 边城、camp 游牧营地、oasis 绿洲城、hanpass 汉式关城（关卡）、xnpost 草原哨卡（关卡）
