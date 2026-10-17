# 剧本文件格式（js/story/<id>.js）

一段历史 = 一个剧本文件。引擎（js/engine/）不改，剧本里写全部题材内容。
参考范例：`js/story/zhangqian.js`（张骞，序章 + 第一章）。最小可运行范例：`tests/fixtures/minimal-story.js`。

剧本按下面的顺序定义这些全局常量（引擎在运行时读取它们）。

## GAME —— 游戏本身
```js
const GAME = {
  id: 'zhangqian',                 // 存档键前缀，和文件名一致
  title: '张骞传', subtitle: '出使西域', tagline: '像素历史角色扮演 · 公元前138年',
  chapters: ['序章 未央宫', '第一章 匈奴十年'],   // 「章名 标题」，中间一个空格
  party: ['zhang'],                // 开局队伍（CHARS 的键）
  titleSprites: ['zhangqian', 'ganfu'],          // 标题画面走过的人物（可选）
  titleSky: [3 色], titleHills: [3 色],           // 标题画面配色（可选）
};
```

## PINYIN —— 拼音表（由 pinyin-pass 工序维护）
`{ '张骞': 'zhāng qiān', '单于': 'chán yú' }`。音节数必须等于字数。引擎自动给台词、卡片、招牌、菜单注音，每行同一个词只注第一次。

## CHARS / SPRITES / SPEAK —— 人物
```js
const CHARS = { zhang: { name: '张骞', title: '一句身份说明', sp: () => hasItem('jie') ? 'zhangqian' : 'zhangqian0' } };  // sp 可以是函数
Object.assign(SPRITES, { zhangqian: { h: 发色, s: 肤色?, r: 衣, R: 衣暗部, t: 腰带, x: 帽/配件色?, b: 胡子色?, y: 金饰色?, j: 杖色?, q: 穗色?, f: [特征], small?: true } });
const SPEAK = { '张骞': 'zhangqian' };   // 对话头像：说话人名字 → 精灵
```
可用特征 f：topknot 发髻、hat 道冠、cap 帽、helmet 盔、strawhat 斗笠、official 官帽、crown 冠、furhat 毡帽、buns 双髻、messy 乱发、tufts 童发、beard 胡子、longbeard 长须、skirt 裙、belly 肚子、jie 持节、sword 剑、crutch 拐、gourd 葫芦、flower 簪花、moon 额上月牙、antenna 触须、ghost 鬼魂。
现成 NPC 精灵：man man2 woman woman2 oldman oldwoman child girl guard soldier merchant monk scholar beggar official fisher innkeeper ghost。

## ITEMS —— 道具（没有战斗，只有信物和任务物品）
`{ jie: { name: '汉节', type: 'key', desc }, q_letter: { name: '家书', type: 'quest', desc } }`

## CARDS —— 史料卡
```js
yuezhi: { ch: 0, fact: true, title: '大月氏', src: '《史记·大宛列传》',
  text: '给孩子看的说明，短句，≤110 字',
  img: { src: 'img/cards/yuezhi.jpg', cap: '图片说明：是什么、什么年代、藏在哪', credit: '作者 · 许可 · Wikimedia Commons' } },  // img 可选，由 card-images 工序加
```
- fact: true 必须有 src（史料名或「出土文物」）；游戏编的写 fact: false、src: '游戏想象'。
- 有 img 的卡片正文区更窄，正文控制在 110 字内。
- 卡片顺序就是图鉴编号顺序，按章节排。

## RECAPS —— 章末小结
`{ 0: { game: ['这一章玩家经历了什么', ...], history: ['真实的历史', ..., '注意：哪些情节是虚构的'] } }`

## WORLD_DEF / LOCS / RELICS / GATE_ART / GATE_MSG —— 世界地图
```js
const WORLD_DEF = { name: '西北边疆', start: 'A', seed: 138,
  coarse: ['^^^^', ...],           // 粗格：每个字符 = 4×4 地块
  zones: [{ z: 'han', x0, y0, x1, y1 }],              // 粗格坐标的矩形；第一个是默认区
  zoneInfo: { han: { ground: '.', mtn: '^' } } };
```
粗格字符：`^` 山（用区域的 mtn）、`~` 水、`T` 树林、`h` 丘陵、`.` 草地、`d` 沙漠、`s` 沙滩、`*` 雪地、`g` 鬼域、`2`–`7` 关卡（`F().gateN = 1` 打开）、其他大写字母 = LOCS 的键（不要用 T 和数字）。
地点落在粗格 `(cx*4+1, cy*4+2)`。

```js
const LOCS = {
  A: { id: 'changan', kind: 'town', icon: 'bigcity', art: 'capital', name: '长安城', need?: () => bool, needMsg?: '进不去时的提示' },
  Z: { id: 'dayuan', kind: 'event', art: 'oasis', name: '大宛', ev: 'dayuan' },   // event：走上去就跑 STORY[ev]
};
const RELICS = [{ at: 'world:han' | 'town:changan' | 'dun:id:层', card: 'banliang', say: '捡到时的描述' }];  // 地上闪光的竹简
const GATE_ART = { '3': 'hanpass', '7': 'xnpost' };
const GATE_MSG = { '3': async () => { ... 可以 ask 后跑剧情，或 return '提示文字' } };
const DUNGEONS = {};   // 探索场景（洞穴、宫殿内部），可留空
```
地标 art（世界地图）和建筑 art（城镇）的可用名字，打开 `tools/gallery.html` 看；没有合适的走 scene-art 工序加新的。
地标占 w×h 格，入口是最下排正中那一格，其余格子走不通 —— 设计粗格时给地标留出空地。

## TOWNS —— 城镇
```js
changan: { name: '长安城', size: 'big' | 'small', theme: 'city' | 'village' | 'desert' | 'snow' | 'coast' | 'water' | 'ghost' | 'steppe',
  roof?, wall?, music?: 'town', yOffset?: 1 /* 整排建筑下移，给很高的建筑留天空 */, onEnter?: async () => {},
  b: [{ slot: 0, type: 'rest' | 'house' | 'special', art: 'palace', label: '未央宫',
        who?, say?: [] | () => [], card?, cardIf?: () => bool,   // house：进门对话，可附卡
        ev?: 'weiyang',                                          // special：跑 STORY[ev]
        keeper?, ask?,                                           // rest：歇息并自动存档
        roof?, wall?, washing? }],
  decor: ['plaza', 'trees', 'garden', 'pond', 'field'],          // 空位的装饰
  features?: { canal: { y, bridges: [x] }, road: [y], tiles: ['r','k','t','b'], props: n },
  npcs: [{ sp, name, x, y, say | fn, cond?, card?, cardIf?, still? }] }
```
- 建筑格位：small 地图 22×16，列 x = 2/8/14，行 y = 2/8（+yOffset），slot = 行×3 + 列；big 地图 28×22，列 2/8/14/20，行 2/8/14，slot = 行×4 + 列。每座建筑占 5×3 格，门在底边正中。
- 道路行：small 是 y=6、12，big 是 6、18。NPC 放在空地或路上，被挡住时引擎会就近挪。
- 出口在地图底边正中。

## QUESTS —— 支线（寻物 find / 送信 deliver，没有讨伐）
```js
lamb: { name, town, npc, ch, type: 'find', find: 'world:steppe', item: 'q_lamb', icon?: 'lamb',
        desc, ask: [], wait, done: [], after, reward: { cards: ['qiyang'], items: [] } },
jiashu: { ..., type: 'deliver', item, to: { town, npc, say: [] } },
```

## STORY —— 剧情脚本
`STORY.intro()` 必须有：放好 Scene 和起始位置（参考张骞的 intro）。其余是建筑 ev、NPC fn、关卡和事件点调用的函数。

常用工具：`say(名字, 文本|数组)`、`narr(文本)`、`ask(名字, 问题, [选项]) → 序号`、`card([行], { big, auto, lh })`、
`chapter(n)`（章节标题卡 + 自动存档）、`recap(n)`（章末小结）、`getCard(id)`、`giveItem(id)`、`joinParty(id)`、
`toTown(id)`、`toWorldAt(LOCS键)`、`doorPos(town, slot)`、`fadeOut/fadeIn`、`Snd.play(曲)`、`Snd.sfx(音)`、
`Shake.start(幅度, 毫秒)`、`autosave()`、`F()`（剧情 flag）、`hasItem`、`hasCard`、`MapScene.refresh()`。
结局：`recap(最后一章)` → 感谢卡 → `UI.stack.length = 0; titleLoop();`

曲子：title town field dungeon sad dream sea ending，也可以 `SONGS.xxx = { bpm, style, lead, loop, mel, ch }` 自己加（参考 steppe）。

## REBIRTH —— 重生线（可选）
正史通关后，回到关键时刻，在当时的条件下重新做决定。引擎在 `js/engine/rebirth.js`；剧本里没有 `REBIRTH` 就没有重生入口。
范例：`js/story/zhangqian.js` 的 `REBIRTH` 定义和 `STORY.rbHome` 等函数。
```js
const REBIRTH = {
  intro: async () => {},   // 必写：放好 Scene 和起始位置，开始一局（可以先给人物、道具、flag、消息）
  res: [{ id, name, start?, get?: () => 数, bool? }],   // 必写：右上角显示的资源。start 初始值（默认 0）；
                           // get 用来算派生值（如消息条数，有 get 就不存数）；bool 显示成「有 / 无」
  know: { id: '一句话' },  // 必写：能打听到的消息，推演报告里分「打听到的 / 没打听到的」列出
  reflect: { q: '反思题', opts: ['选项', ...] },        // 可选：结局后问一道反思题，答案记进报告
};
```
`GAME.motto = { text, src, kid, start?, clear?, end? }`（可选）：引文卡。`text` 原文、`src` 出处、`kid` 给孩子的一句话；
`start` 开局、`clear` 正史通关（剧本自己调 `mottoCard(GAME.motto.clear)`）、`end` 推演报告之后，各附一句。

剧本里用：
- `isRebirth()` —— 现在是不是重生局，正史和重生共用的剧情靠它分叉
- `res(id)` —— 读资源当前值（有 `get` 的走 `get`）
- `addRes(id, n, 原因)` —— 资源加减（不会低于 0），弹一句提示并记进日志
- `learn(id)` —— 记下一条消息（只在重生局里生效，记过的不重复）
- `knows(id)` —— 是否已经打听到这条消息
- `decide(id, 谁, 问题, opts)` —— 决策点，返回选中的序号。`opts: [{ label, cost?: { 资源id: 数 }, need?: 消息id 或 [消息id], why: [{ t: 理由, card?: 依据卡 }] }]`；
  没打听到 `need` 或资源不够 `cost` 的选项是灰的；`why` 多于一条时再问「你为什么这么选？」
- `endRebirth({ title, type: '史实' | '合理推演' | '历史上没有发生', lines: [], compare: [] })` —— 结局：显示推演报告、反思题，保存报告，回标题画面
- `markCleared()` —— 标记正史已通关，标题画面出现「重生」（放在正史结局里）

只在重生里拿的史料卡加 `rebirth: true`（不算进正史的收集数）。
试玩开关：网址后面加 `?rebirth` 或 `#rebirth`，不用先通关就能进重生。
续玩：重生进度只有一份，和正史存档分开，进城、`chapter()`、歇息时自动存；标题画面点「重生」会问接着上次的还是从头再来。`REBIRTH.intro()` 末尾放好场景后照常 `autosave()`。剧本不要在 `decide` 前后的半截剧情里存档，读档后那段剧情接不上。

## tests/<id>.test.js —— 试玩脚本（必写）
```js
module.exports = H => ({
  steps: [['章节名', [H.npc('名字'), H.door('招牌'), H.pickAll(), H.leave(), H.pickWorld('区'), H.enter('L'), H.toWorld('L'), H.gate('3')]]],
  ending: H.enter('Z'),
  routes: [{ name, flags?, quests?, from: 'A' | { loc, dx, dy }, to | toGate | toChest, expect?: false }],
});
```
steps 要走到每一张卡、每一个任务；routes 至少检查：每段主线路通、关卡没打开前过不去、文物和任务物品走得到。

有重生线时再加 `rebirth`，每条路径从 `startRebirth()` 开局走到一个结局（范例：`tests/zhangqian.test.js`）：
```js
  rebirth: [{ name: '路径名', picks: { 决策id: 选项序号, '决策id:why': 理由序号 }, resumeAt?: 步数, steps: [H.door('…'), H.enter('L')], ending: '结局 title' }],
```
`picks` 按 `decide` 的 id 指定自动玩家选哪个（没写的选第一个能选的）；`ending` 要和 `endRebirth` 的 `title` 一字不差。
所有路径合起来要拿到每一张 `rebirth: true` 的卡。
`resumeAt`：走完前几步就「关掉网页」，换一个新沙盒从标题画面「重生 → 接着上次的」续玩剩下的步骤。至少挑一条路径，在进城（自动存档点）之后续玩。
