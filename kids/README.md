# 孩子模式：设置清单（给家长看）

孩子在自己的电脑上用 Claude Code（模型接 DeepSeek）做历史游戏，家长在自己的电脑上用 Claude 审核。

| 谁 | 用什么 | 做什么 |
|---|---|---|
| 孩子 | 输出风格「小史官」+ skill `kid-history-game` | 选题、自己查史料、定大纲、改台词、提交到自己的分支、开 PR |
| 家长 | skill `review-kid-pr` | 跑测试、派 history-fact-checker 核史实、草拟给孩子的留言、决定合并和发布 |

## 一次性设置

### 1. GitHub
- 孩子的账号由家长注册、家长负责（GitHub 规定未满 13 岁不能注册自己的账号），孩子在家长看管下使用。用户名和显示名用孩子的笔名。
- 主仓库是私有的：在 Settings → General 打开 **Allow forking**，把孩子的账号加为协作者，孩子再 fork 一份。
- 注意：个人账号的私有仓库，协作者都有写权限，免费版也保护不了 main。所以靠下面三层挡住：孩子只在自己的 fork 里干活；主仓库在孩子电脑上设成只能拉取；权限配置禁止推 main。

### 2. 孩子的电脑
```bash
# 需要 node、python3、git、gh；Claude Code 按 DeepSeek 文档接好（模型名以 DeepSeek 当时的文档为准）
git clone https://github.com/<孩子账号>/history-rpg.git
cd history-rpg
git remote add upstream https://github.com/ijerrywong/history-rpg.git
git remote set-url --push upstream no_push           # 主仓库只能拉，不能推
git config user.name "<孩子笔名>"
git config user.email "<孩子账号的 noreply 邮箱>"      # GitHub → Settings → Emails 里找
cp kids/settings.local.example.json .claude/settings.local.json
gh auth login                                        # 用孩子的账号登录
```
在仓库目录里运行 `claude`，第一句话问「你是谁」，应该回答「小史官」。

### 3. 权限配置管什么（`kids/settings.local.example.json`）
- 打开「小史官」输出风格
- 改不了：`js/engine/`、`tools/`、`mac/`、`.claude/`、`build.py`、`index.html`、`AGENTS.md`、`js/story/zhangqian.js`
- 不能执行：推到 main、强推、`git reset --hard`、改远程地址、`rm -rf`；不能派 history-fact-checker
- 不用每次确认：跑试玩和检查、打包、git 查看、添加、提交、建分支

2026-10-17 在家长电脑上实测过（Claude Code 2.1.302）：改引擎、改工具、改张骞剧本都被拦下；`git push origin main`、`git push origin HEAD:main`、`git push -f` 也被拦下；新建自己的剧本、推到 `kid/` 分支可以正常做。
写规则时注意：拦文件只能用 `Edit(路径)`，`Write(路径)` 不起作用；`:*` 只能放在规则末尾。

## 日常
- 孩子：在仓库目录运行 `claude`，说「我想做一个 XX 的游戏」或「接着做我的游戏」。
- 同步主仓库的更新：`git fetch upstream && git merge upstream/main`（孩子不会的话，家长帮忙）
- 家长：在自己的电脑上说「看看孩子的 PR」。

## 还没验证的（第一次试跑时记下来）
- DeepSeek 照着 kid-history-game 写剧本，playtest 几轮能通过、卡在哪里。3 轮以内能过、错误孩子看得懂，就不用做「预制积木」；否则按卡住的地方再做（判断标准和做法记在 `.claude/skills/kid-history-game/IMPROVEMENTS.md`）
- 孩子那边 WebFetch、gh 能不能用
