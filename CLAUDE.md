# history-rpg

给小学生玩的像素历史 RPG 模板：没有战斗，靠剧情、史料卡、章末小结学历史。纯前端，单文件可发布成 Artifact。

## 结构
- `js/engine/` —— 引擎，换题材时不改；不许写任何题材专属的名字（`node tools/engine-check.js` 会查）
- `js/story/<id>.js` —— 一段历史一个剧本（范例：zhangqian.js）
- `tests/<id>.test.js` —— 试玩脚本；`tests/fixtures/minimal-story.js` —— 引擎独立性用的假题材
- `img/cards/` —— 史料卡图片（出处在 credits.json，CREDITS.md 由脚本生成）
- `docs/<id>/` —— 史料核查表和大纲；`docs/adr/` —— 架构决策记录（重生模式、美术方向、开场引文）
- `docs/private/` —— 商业模式和商业思考，**不进 git**（已在 .gitignore）；商业内容一律写这里，不写进 ADR
- `tools/` —— playtest.js、engine-check.js、commons.py、pinyin_scan.py、gallery.html

## 授权
分开授权，详见 `COPYRIGHT.md`：引擎、工具、工序用 MPL-2.0（`LICENSE`）；题材内容（`js/story/`、`docs/`、题材测试和图标）用 CC BY-NC-SA 4.0（`LICENSE-CONTENT`）；图片按 CREDITS.md。新增文件时按这个划分归类，有歧义先问。

## 常用命令
```bash
node tools/playtest.js zhangqian    # 无头试玩：全部卡、任务、路线
node tools/engine-check.js          # 引擎独立性
python3 build.py zhangqian          # 打包 dist/<标题>.html
mac/build_mac.sh zhangqian          # 分发版：dist/<标题>.app 和 dist/<标题>-mac.zip（App + 使用说明 + 浏览器版）
```

## 做事走 skill
- 新题材、补章节 → `new-history-game`（会派子代理 `history-fact-checker` 查史实）
- 配图 → `card-images`；拼音 → `pinyin-pass`；新建筑/地标造型 → `scene-art`

《张骞传》（五章完整版）已发布的 Artifact：https://claude.ai/artifact/8dMHsc9wQXNXqNUuN4wwoB（发 index.html + files；更新时用同一个 file_path）
