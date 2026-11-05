---
name: kid-history-game
description: >
  陪 10 岁孩子自己做一个像素历史 RPG：一次问一个问题，孩子自己查史料、自己定大纲，
  模型写剧本，孩子动手改台词，测试通过后提交到孩子自己的分支、开 PR 请家长审。
  触发：孩子说「我想做一个 XX 的游戏」「接着做我的游戏」「下一章」「我想改台词」时使用（在「小史官」输出风格下）。
  不用于：家长做新题材（用 new-history-game）、审孩子的 PR（用 review-kid-pr）。
---

# 孩子做历史游戏

孩子是作者，你是助手。目标排序：**历史是真的 > 孩子学到东西 > 游戏做得快**。
只写 `js/story/<id>.js`、`tests/<id>.test.js`、`docs/<id>/`。引擎不动。

## 先读
- `.claude/skills/new-history-game/references/design-rules.md` —— 写剧本的规矩（读者是小学生、没有战斗、史料卡分史实和演绎）
- `.claude/skills/new-history-game/references/story-format.md` —— 剧本文件每一项怎么写
- `js/story/zhangqian.js` —— 完整范例；`tests/zhangqian.test.js` —— 试玩脚本范例
- 卡片在 story-format 的字段之外，多三个字段：`quote`（孩子查到的原文，一字不改）、`url`（在哪查到的）、`check: '待核'`（还没查到）

## 中断后接着做
先看 `docs/<id>/` 里有什么：有 `facts.md` 就别重新查，有 `outline.md` 就别重新定大纲。`git log --oneline -5` 看上次做到哪，用一句话告诉孩子。

## 流程

### 1. 选题（一次问一个问题）
依次问，每个问题给 2～3 个选项：
1. 想做哪段历史？（建议课本里学过的，越短越好）
2. 主角是谁？
3. 玩完以后，你最想让别人记住哪一件事？
4. 起一个剧本 id（拼音，比如 `zhenghe`）和你的笔名（不用真名）

规模固定为两章，10～15 分钟。孩子想做更多，先做完这两章再说。

### 2. 查证（孩子自己查，你教方法）
1. 让孩子说出 5～10 件「我觉得是真的」的事。你照写，不纠正，不补充。
2. 一件一件查。告诉孩子去哪查、搜什么词：
   - 古书原文：https://ctext.org （例如《史记》），搜人名或地名
   - 课本：第几册、第几课
3. 孩子把找到的句子和网址贴回来。你用大白话解释这句话的意思，问他「和你想的一样吗？」
4. 写进 `docs/<id>/facts.md`，一件事一行：

| 这件事 | 孩子查到的原文 | 出处网址或课本页 | 结果 |
|---|---|---|---|
| ... | 原样贴，不改一个字 | ... | 查到了 / 和想的不一样 / 待核 |

查不到的标「待核」，照样可以继续做，家长那边会帮忙查。**你不许替孩子填原文。**

### 3. 大纲（孩子说，你整理）
问孩子每章：在哪儿？遇到谁？发生什么事？拿到哪几张史料卡？
整理成 `docs/<id>/outline.md`，格式照 new-history-game 的大纲（地点、主线、史料卡、章末小结）。地点的造型只能选造型库里有的（`tools/gallery.html` 里能看到的），没有合适的写进 `docs/<id>/wishes.md`。
把大纲念给孩子听，他说「可以」才往下做。

### 4. 写剧本（一章一章写）
- 按 story-format 写第一章，接着写试玩脚本，然后跑 `node tools/playtest.js <id>`。
- 没通过：把错误用大白话念给孩子听，一起猜原因，再修。修了 3 次还不通过，就停下来，把错误原文写进 `docs/<id>/wishes.md`，留给家长。
- 史料卡：facts.md 里「查到了」的才能写 `fact: true`，并带上 quote 和 url；「待核」的写 `check: '待核'`；编的写 `fact: false, src: '游戏想象'`。

### 5. 动手题（每章至少一个）
挑一处让孩子自己改，比如一个 NPC 的台词、一张卡的文字。告诉他：打开哪个文件、搜什么字、改成什么样。他改完，你读一遍，再跑一次 playtest。
顺便教一个小概念，用他游戏里的东西举例。

### 6. 试玩
`python3 build.py <id>`，让孩子双击 `dist/<标题>.html` 玩一遍。问他：哪里好玩？哪里看不懂？记下来，下一轮改。

### 7. 提交、开 PR
1. 问孩子：「要不要把这次的进度存到 GitHub，请爸爸妈妈看看？」
2. 第一次：`git checkout -b kid/<id>`
3. `git add js/story/<id>.js tests/<id>.test.js docs/<id>/` → `git commit -m "<孩子用自己的话写的说明>"`
4. `git push origin kid/<id>`（origin 是孩子自己的 fork）
5. 开 PR：`gh pr create --repo ijerrywong/history-rpg --head <孩子账号>:kid/<id> --base main`。gh 用不了就告诉孩子在 GitHub 网页上点「Compare & pull request」
6. PR 说明里写：做了什么、哪些是编的、还有几条「待核」

## 结束前
跑 `node tools/playtest.js <id>` 和 `node tools/engine-check.js`，结果念给孩子听。告诉他下次从哪接着做。
