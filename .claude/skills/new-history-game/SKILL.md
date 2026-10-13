---
name: new-history-game
description: >
  给一段历史，做一个给小学生玩的像素历史 RPG（没有战斗，靠剧情、史料卡、章末小结学历史），
  在 history-rpg 项目里新建剧本、测试、打包发布。会先问题材和年级，派史料核查员查史实，
  大纲给用户确认后才写剧本，再串起配图、注音、补造型三道工序。
  触发：用户说「做一个 XX 历史的游戏」「新题材」「换一段历史」「把 XX 做成 RPG」「补完下一章」时使用。
  不用于：只改某张卡的图（用 card-images）、只补拼音（用 pinyin-pass）、只加建筑造型（用 scene-art）。
---

# 新历史游戏

把一段历史变成一个可以玩、可以发布的小 RPG。引擎不动，只写 `js/story/<id>.js` 和 `tests/<id>.test.js`。

## 先读
- `references/design-rules.md` —— 用户定下的规矩，逐条遵守
- `references/story-format.md` —— 剧本文件每一项怎么写
- `js/story/zhangqian.js` —— 完整范例；`tests/zhangqian.test.js` —— 试玩脚本范例

## 管理约定

| 协议面 | 约定 |
|---|---|
| Prompt | 目标是孩子玩得下去、记得住、记得对。不做战斗，不改引擎来迁就剧本（引擎缺能力就停下来告诉用户） |
| Tools | 史料查证交给 history-fact-checker 子代理；网页只读；发布前问用户 |
| State | 核查表存 `docs/<id>/facts.md`，大纲存 `docs/<id>/outline.md`；中断后从这两个文件接着做 |
| Rules | 史实只从核查表取；卡片分史实/演绎；造型名只用造型库里有的（gallery 里能看到的） |
| Verification | HARD：`node tools/playtest.js <id>` 和 `node tools/engine-check.js` 都通过才能发布。SOFT：浏览器截几张关键画面看一眼 |
| Feedback | 用户提的新要求、踩到的坑，记进 `.claude/skills/new-history-game/IMPROVEMENTS.md`，攒够了再改进这个 skill |

## 流程

### 1. 问清楚（要问用户）
用 AskUserQuestion 一次问完，给推荐项：
- 题材（哪段历史、从哪到哪）；剧本 id（拼音，例如 `zhenghe`）
- 年级（默认小学三到六年级）
- 规模：先做 spike（前两章，10–15 分钟）还是完整 5 章（30–45 分钟）。默认 spike
- 想重点让孩子记住什么（可选）

### 2. 查史实（派子代理）
派 `history-fact-checker`，告诉它题材、年代、想覆盖的事件、年级。把它交回的表存进 `docs/<id>/facts.md`。
给用户看一个短摘要：主要时间线、有争议的点、传说和史实容易混的地方、读音存疑的字。找不到依据的地方照实说。

### 3. 大纲（要用户确认）
写 `docs/<id>/outline.md`，每章一节：
- 地点：城镇（size、theme）、世界地图地标、关卡 —— 每处写要用的造型 art 名，造型库里没有的标「需新造型」
- 主线：3–6 个事件，靠什么 flag 推进，卡点和提示语
- 史料卡清单：标题、史实/演绎、从谁那里拿到（NPC/进屋/文物）、出处
- 支线：0–1 个寻物或送信
- 章末小结要点：真实历史 + 哪些是虚构的
再画一张粗格世界地图草稿（字符画），标出关卡顺序。

给用户讲清楚：这样安排之后孩子会怎么玩、大概多长、哪些是编的。用 AskUserQuestion 让用户确认或改。**确认之前不写剧本。**

### 4. 写剧本和试玩脚本
- 按 `references/story-format.md` 写 `js/story/<id>.js`；对话照 design-rules 的长度写。
- 写 `tests/<id>.test.js`：steps 走到每张卡、每个任务；routes 覆盖主线路、关卡、文物。
- 跑 `node tools/playtest.js <id>`，不通过就修到通过（常见原因：NPC 名字对不上、卡片没有获取途径、地点被山堵住）。

### 5. 三道工序
1. 大纲里标了「需新造型」→ 用 **scene-art** 工序逐个补
2. **pinyin-pass**：扫全部用字，补拼音表
3. **card-images**：给能配图的卡找真实图片

每道工序做完都重跑 `node tools/playtest.js <id>`。

### 6. 验证（HARD gate）
```bash
node tools/playtest.js <id>      # 全部通过
node tools/engine-check.js       # 全部通过
python3 build.py <id> && python3 -m http.server 8765 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8765/dist/<标题>.html?v=<每次换个数字，防缓存>
# 截图：标题、对话、史料卡、城镇、世界地图
```
浏览器自动化窗口会把 requestAnimationFrame 限到每秒 1 帧，截图前用 javascript_tool 手动调 `frame(lastT + 50)` 推进。

### 7. 打包发布（要问用户）
```bash
python3 build.py <id>            # → dist/<标题>.html，单文件，图片已内嵌
```
问用户要不要发布，确认后用 Artifact 发布 `dist/<标题>.html`。最后交给用户：链接、这一版有几章几张卡、哪些是虚构情节、还存疑的读音或史实。

## 交付物清单
- `js/story/<id>.js`、`tests/<id>.test.js`、`docs/<id>/facts.md`、`docs/<id>/outline.md`
- 新增的图片 `img/cards/*.jpg`、更新后的 `CREDITS.md`
- （如有）`js/engine/buildings.js` 里新增的造型
- `dist/<标题>.html` 和 Artifact 链接
