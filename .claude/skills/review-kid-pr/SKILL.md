---
name: review-kid-pr
description: >
  审孩子用 kid-history-game 做的游戏 PR：拉下代码跑测试，派 history-fact-checker 核对每张史实卡的原文和出处，
  再草拟一份给孩子看的 PR 留言（先夸，再逐条说哪里要改、去哪查），家长确认后才发。
  触发：家长说「看看孩子的 PR」「审一下 #N」「孩子提交了」时使用。
  不用于：家长自己的 PR（用 code-review）、做新题材（用 new-history-game）。
---

# 审孩子的 PR

审的是两样：**游戏能不能玩**、**历史对不对**。留言的读者是 10 岁孩子。

## 流程

### 1. 拉下来，跑测试
```bash
gh pr list --state open                  # 不知道编号时先看
gh pr checkout <n>
node tools/playtest.js <id>
node tools/engine-check.js
git diff main --stat                     # 只该动 js/story/<id>.js、tests/<id>.test.js、docs/<id>/
```
改动超出这三处（比如碰了引擎或别人的剧本），先停下来告诉家长，不往下审。

### 2. 核史实（派子代理）
把 `docs/<id>/facts.md` 和剧本里全部 `fact: true` 以及 `check: '待核'` 的卡（标题、text、src、quote、url）交给 `history-fact-checker`，要求它逐条回答：
- quote 在 url 那一页上找不找得到？是不是原文（有没有被改字、被编）
- 卡片的白话 text 和原文意思对不对得上？有没有夸大
- 「待核」的那几条：能不能查到？出处在哪
- 年份、人名、地名、读音有没有错

### 3. 给家长看结果
用一张表：每张卡一行，写结论（对 / 要改 / 查不到）和理由。再列测试结果、超出范围的改动、`docs/<id>/wishes.md` 里孩子想要但引擎做不到的东西。

### 4. 草拟给孩子的留言（家长确认后才发）
- 先说两三个做得好的地方，要具体（「你找到了《史记》的原文，这一句选得很好」）
- 再逐条说要改的：哪张卡、哪里不对、**去哪查**、搜什么词。不直接给答案，让他自己去查
- 句子短，不用术语，一条留言不超过 10 行
- 给家长看草稿，用 AskUserQuestion 问：照发、改了再发、还是先不发
- 照发：`gh pr review <n> --comment --body-file <草稿>`。针对某一行的，用 `gh api` 发行内评论

### 5. 合并以后
家长决定合并时才合并（`gh pr merge <n>`，问过才跑）。之后按家长的意思走 pinyin-pass、card-images、发布，这些都在家长这边做。
最后 `git checkout main`。

## 记下来
孩子反复犯的错、DeepSeek 常编错的东西，记进 `.claude/skills/kid-history-game/IMPROVEMENTS.md`，攒够了再改 skill 或「小史官」输出风格。
