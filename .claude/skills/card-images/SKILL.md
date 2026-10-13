---
name: card-images
description: >
  给 history-rpg 的史料卡配真实图片（文物、遗址、古画的照片），只从 Wikimedia Commons 取能自由使用的图，
  先列候选让用户挑，再下载、缩小、写图片说明和出处。
  触发：用户说「给卡片配图」「史料卡加图片」「换一张图」「这张卡没有图」时使用；new-history-game 流程第 5 步也会调用。
---

# 史料卡配图

一张好的配图让孩子看到真东西：真的铜钱、真的遗址、古人画的画。图片说明要让孩子分清这是文物、遗址照片、后人的画，还是今天的照片。

## 管理约定

| 协议面 | 约定 |
|---|---|
| Tools | `python3 -I tools/commons.py search / preview / fetch`；看图用 Read 打开下载的小图 |
| Rules | 只用 Commons；许可只接受 CC0、公有领域、CC BY、CC BY-SA（脚本会拒绝 NC/ND）；图片长边 ≤520；卡面必须显示作者和许可 |
| State | 出处统一记在 `img/cards/credits.json`，`CREDITS.md` 由脚本生成，不要手改 |
| Verification | `node tools/playtest.js <id>` 通过；浏览器里打开至少一张横图卡、一张竖图卡看排版 |

## 流程

### 1. 列出要配图的卡
读 `js/story/<id>.js` 的 CARDS，挑出没有 `img` 的卡。先判断哪些**值得配**：有对应文物、遗址、古画的卡优先；纯概念的卡（例如「和亲」）可以不配。

### 2. 找候选
每张卡想 2–3 组搜索词（英文为主，Commons 英文描述多；文物名、遗址名、博物馆名都试试），慢慢搜（Commons 会限流）：
```bash
python3 -I tools/commons.py search "Ban Liang coin" "Weiyang Palace site"
```
每张卡挑 1–2 个「可用」的候选，下载小图亲眼看：
```bash
python3 -I tools/commons.py preview "File:Chinese Money 8 - Ban Liang Coin.jpg"
```
用 Read 打开 `.cache/previews/` 里的图，确认：画面里真的是卡上说的东西；清楚、主体够大；没有年代错位。

### 3. 给用户挑（要问用户）
用 AskUserQuestion，每张卡一题（一次最多 4 题，分批问），选项写：画面是什么、年代、许可、需要特别说明的地方（例如「这是唐代人画的传说」「这是今天的照片」）。把推荐的放第一个。也给「这张卡不配图」的选项。

### 4. 下载并写进卡片
```bash
python3 -I tools/commons.py fetch <卡片id> "File:...."
```
脚本会打印原说明和建议的 credit。然后在 CARDS 里加：
```js
img: { src: 'img/cards/<卡片id>.jpg', cap: '图片说明', credit: '作者 · 许可 · Wikimedia Commons' }
```
**图片说明（cap）的写法**：一两句，孩子读得懂。写清是什么、什么年代、在哪个博物馆或遗址。遇到下面几种要明说：
- 后人画的（例如「七百多年后唐朝人画的佛教传说，不是当时的记录」）
- 今天拍的现代东西（例如「今天蒙古草原上的毡帐」）
- 画的是别的人或别的事，只是能说明这张卡（例如苏武牧羊图说明「汉节」）

如果卡片正文提到的东西和图对不上，改正文或换图，不要硬配。

### 5. 验证
- `node tools/playtest.js <id>` 通过
- `python3 build.py <id>`，浏览器里打开一张横图卡、一张竖图卡（用 `UI.push(new CardView('<卡片id>'))`），看图片、说明、出处都完整显示

## 已知问题
- Commons 的「Attribution」许可可以用（署名即可）。
- 有些文物照片背景杂乱，优先选博物馆展柜里拍得正的。
- 搜索结果为空时，换成更具体的英文名，或者遗址所在城市名加 ruins / museum。
