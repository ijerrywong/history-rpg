# history-rpg

给小学生玩的像素历史 RPG 模板：没有战斗，靠剧情、史料卡、章末小结学历史。纯前端，单文件可发布成 Artifact。

## 结构
- `js/engine/` —— 引擎，换题材时不改；不许写任何题材专属的名字（`node tools/engine-check.js` 会查）
- `js/story/<id>.js` —— 一段历史一个剧本（范例：zhangqian.js）
- `tests/<id>.test.js` —— 试玩脚本；`tests/fixtures/minimal-story.js` —— 引擎独立性用的假题材
- `img/cards/` —— 史料卡图片（出处在 credits.json，CREDITS.md 由脚本生成）
- `docs/<id>/` —— 史料核查表和大纲
- `tools/` —— playtest.js、engine-check.js、commons.py、pinyin_scan.py、gallery.html

## 常用命令
```bash
node tools/playtest.js zhangqian    # 无头试玩：全部卡、任务、路线
node tools/engine-check.js          # 引擎独立性
python3 build.py zhangqian          # 打包 dist/<标题>.html
```

## 做事走 skill
- 新题材、补章节 → `new-history-game`（会派子代理 `history-fact-checker` 查史实）
- 配图 → `card-images`；拼音 → `pinyin-pass`；新建筑/地标造型 → `scene-art`

《张骞传》已发布的 Artifact：https://claude.ai/artifact/8dMHsc9wQXNXqNUuN4wwoB（index.html + js/ 多文件版；以后可以改发 dist 单文件）
