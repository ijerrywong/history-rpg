#!/usr/bin/env python3
"""打包成单个可离线双击运行、也能直接发布成 Artifact 的 HTML

  python3 build.py             # 用 index.html 里写的剧本
  python3 build.py tangseng    # 换成 js/story/tangseng.js
输出 dist/<游戏标题>.html：脚本全部内联，img/cards 里本剧本用到的图片做成 data URI。
"""
import re, os, sys, json, base64
os.chdir(os.path.dirname(os.path.abspath(__file__)))
html = open('index.html', encoding='utf-8').read()
if len(sys.argv) > 1:
    sid = sys.argv[1]
    if not os.path.exists(f'js/story/{sid}.js'): sys.exit(f'没有剧本 js/story/{sid}.js')
    html = re.sub(r'src="js/story/[^"]+\.js"', f'src="js/story/{sid}.js"', html)
story = open(re.search(r'src="(js/story/[^"]+\.js)"', html).group(1), encoding='utf-8').read()
title = re.search(r"title:\s*'([^']+)'", story).group(1)
sub = re.search(r"subtitle:\s*'([^']+)'", story)
html = re.sub(r'<title>[^<]*</title>', f'<title>{title}{"·" + sub.group(1) if sub else ""}</title>', html)
# 只嵌入这个剧本引用到的图片
imgs = {f: 'data:image/jpeg;base64,' + base64.b64encode(open(f, 'rb').read()).decode() for f in sorted(set(re.findall(r"'(img/cards/[^']+\.jpg)'", story))) if os.path.exists(f)}
html = html.replace('<script charset="utf-8" src=', '<script>const EMBED_IMG = ' + json.dumps(imgs) + ';</script>\n<script charset="utf-8" src=', 1)
def inline(m):
    js = open(m.group(1), encoding='utf-8').read().replace('</script', '<\\/script')
    return '<script>\n' + js + '\n</script>'
body = re.sub(r'<script charset="utf-8" src="([^"]+)"></script>', inline, html)
i = body.index('<div id="wrap">')
os.makedirs('dist', exist_ok=True)
out = f'dist/{title}.html'
open(out, 'w', encoding='utf-8').write('<!doctype html>\n<html lang="zh-CN">\n<head>\n' + body[:i] + '</head>\n<body>\n' + body[i:] + '\n</body>\n</html>\n')
print(f'已生成 {out}（{os.path.getsize(out) // 1024}KB，内嵌图片 {len(imgs)} 张）')
