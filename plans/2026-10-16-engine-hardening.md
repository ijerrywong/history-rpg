# 计划：引擎和工具加固（为第二个题材做准备）

日期：2026-10-16
来源：`.claude/skills/new-history-game/IMPROVEMENTS.md` 待处理清单里，不需要再做设计决定的几条。

## 范围

只动下面列出的文件。**不改** `js/story/zhangqian.js`、`tests/zhangqian.test.js`、`index.html`、`build.py`。
引擎（`js/engine/`）里不许出现任何题材专属的名字。

**每一项的通用验证**（每项做完都要跑，必须全部通过）：

```bash
node tools/playtest.js zhangqian    # 末行「全部通过」，退出码 0
node tools/engine-check.js          # 末行「全部通过」，退出码 0
```

**不在本计划内**（需要先做设计决定，以后另立计划）：

- 入口页按题材选剧本（`index.html` 写死了张骞剧本）
- 长安地标从 3×2 格放大到 4×3 格

## WI-1 试玩脚本：剧本 id 写错时给出看得懂的提示

现状：`node tools/playtest.js nosuch` 打出一大段 Node 堆栈（`Cannot find module .../tests/nosuch.test.js`），退出码 1，和"测试不通过"的退出码一样，分不清。

要求：

- 改 `tools/playtest.js`：读取前先检查 `js/story/<id>.js` 和 `tests/<id>.test.js` 是否存在。
- 缺哪个就打印一行中文提示，例如 `没有剧本 js/story/nosuch.js` 或 `没有试玩脚本 tests/nosuch.test.js`，不打印堆栈。
- 缺文件时退出码为 `2`（和脚本里现有的"失败"退出码一致），测试不通过仍是 `1`。

完成标准：

- `node tools/playtest.js nosuch` 只输出一行提示，`echo $?` 为 `2`
- 通用验证通过

## WI-2 探索场景（DUNGEONS）补回归测试

现状：引擎支持探索场景（`js/engine/world.js` 的 `genDungeon`，`main.js` 里的 `onFloor`，进入时的 `onEnter`），但张骞剧本没用到，没有任何测试走过这条路。

要求：

- 在 `tests/fixtures/minimal-story.js`（假题材）里加一个最小的探索场景：
  - 世界地图上一个 `kind: 'dun'` 的地点
  - `DUNGEONS` 里对应一条定义：2 层，有 `onEnter`，有第 2 层（`floor` 为 1）的 `onFloor` 事件
  - 事件里设置一个 flag（例如 `G.flags.dunFloor1 = true`），供检查用
- 在 `tools/engine-check.js` 里加一段：进入这个探索场景 → 确认 `onEnter` 触发 → 下到第 2 层 → 确认 `onFloor` 设置的 flag 为真 → 没有运行时错误。
- 加的名字只能用假题材里的名词（和现有的郑和、龙江船厂同一套），不能出现张骞剧本里的名字。
- 如果测试暴露出引擎 bug，只做让测试通过的最小修复，并在状态记录里写明改了什么。

完成标准：

- `node tools/engine-check.js` 输出里有一行说明探索场景检查通过，末行「全部通过」
- 故意把 fixture 里的 `onFloor` 删掉后，`engine-check` 会不通过（证明这个检查真的在查；验证完要恢复）
- 通用验证通过

## WI-3 剧本格式文档补「重生线」一节

现状：重生线的引擎能力在 `js/engine/rebirth.js`（文件头注释里列了剧本要提供什么），但 `.claude/skills/new-history-game/references/story-format.md` 没有这一节，下一个题材做重生线时没有文档可查。

要求：

- 在 `story-format.md` 里，「STORY —— 剧情脚本」和「tests/<id>.test.js」两节之间，新增一节 `## REBIRTH —— 重生线（可选）`，写清：
  - `REBIRTH` 对象的字段：`intro`、`res`、`know`、`reflect`，各自是什么、哪些可选
  - `GAME.motto` 的字段
  - 剧本里可用的函数：`isRebirth`、`res`、`addRes`、`learn`、`knows`、`decide`、`endRebirth`、`markCleared`，每个一句话说明
  - 试玩开关：网址加 `?rebirth` 或 `#rebirth`
  - 范例指向 `js/story/zhangqian.js` 的 `REBIRTH` 定义
- 在「tests/<id>.test.js」一节补上 `rebirth` 路径的写法（`name`、`picks`、`steps`、`ending`），范例指向 `tests/zhangqian.test.js`。
- 内容以 `rebirth.js` 和 `zhangqian.js` 的实际代码为准，不写代码里没有的东西。
- 在 `IMPROVEMENTS.md` 里"story-format.md 还没写这一节"那一条后面追加 `（已处理：2026-10-xx）`，不删原文。

完成标准：

- 上面列出的 8 个函数名、4 个 `REBIRTH` 字段名，每一个都能在新的一节里 grep 到，也都能在 `js/engine/rebirth.js` 里 grep 到
- 通用验证通过
