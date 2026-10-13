#!/usr/bin/env python3
"""拼音表检查：python3 -I tools/pinyin_scan.py js/story/<剧本>.js

1. 检查 PINYIN 里每个词：音节数和字数对得上、剧本里确实用到了
2. 列出剧本台词里用到、但还没被任何拼音词覆盖的字（按出现次数排序，附一处上下文），
   用来挑生僻字、多音字、人名地名
"""
import re, sys
from collections import Counter

p = sys.argv[1] if len(sys.argv) > 1 else 'js/story/zhangqian.js'
s = open(p, encoding='utf-8').read()
i = s.find('const PINYIN')
if i < 0:
    body, text = '', s
else:
    j = s.index('};', i); body = s[i:j]; text = s[:i] + s[j:]
pairs = re.findall(r"'([^']+)':\s*'([^']+)'", body)
cjk = lambda c: '一' <= c <= '鿿'
# 只看引号里的字（台词、卡片、名字），不看注释
strs = re.findall(r"'([^'\n]*)'", text) + re.findall(r"`([^`]*)`", text)
words = ''.join(strs)

bad = []
for w, py in pairs:
    if len(py.split()) != len(w): bad.append(f'音节数不对：{w} → {py}')
    if w not in words: bad.append(f'剧本里没用到：{w}')
print(f'拼音表 {len(pairs)} 个词' + ('，问题：\n  ' + '\n  '.join(bad) if bad else '，没有问题'))

covered = set(''.join(w for w, _ in pairs))
cnt = Counter(c for c in words if cjk(c) and c not in covered)
print(f'\n还没注音的字 {len(cnt)} 个，少见的排前面（次数 字 上下文）：')
for c, n in sorted(cnt.items(), key=lambda x: (x[1], x[0])):  # 少见的字排前面
    k = words.index(c)
    print(f'{n:4d} {c}  …{words[max(0, k - 5):k + 6]}…')
sys.exit(1 if bad else 0)
