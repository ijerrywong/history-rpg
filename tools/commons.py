#!/usr/bin/env python3
"""Wikimedia Commons 史料卡配图工具

  python3 -I tools/commons.py search "Ban Liang coin" "Weiyang Palace site"   # 列候选：文件名 | 尺寸 | 许可 | 作者
  python3 -I tools/commons.py fetch banliang "File:Chinese Money 8 - Ban Liang Coin.jpg"
      → 下载到 img/cards/banliang.jpg（长边缩到 520），作者和许可记进 img/cards/credits.json，重写 CREDITS.md
  python3 -I tools/commons.py preview "File:xxx.jpg" ...   # 下载小图到 .cache/previews/，用来先看一眼再决定
  python3 -I tools/commons.py credits    # 只重写 CREDITS.md

只接受能自由使用的许可：CC0、公有领域、CC BY、CC BY-SA。带 NC（非商业）/ ND（禁止改编）的一律拒绝。
Commons 会限流（429），脚本会等一会儿自动重试；连续查很多时每次之间留几秒。
"""
import json, os, re, subprocess, sys, tempfile, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'img', 'cards')
CREDITS = os.path.join(IMG, 'credits.json')
UA = {'User-Agent': 'history-rpg/0.1 (kids history game; personal use)'}
API = 'https://commons.wikimedia.org/w/api.php?'

def get(url):
    for k in range(5):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(15 * (k + 1)); continue
            raise
    raise RuntimeError('Commons 一直限流，过几分钟再试')

def clean(m, k, n=120):
    return re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', m.get(k, {}).get('value', ''))).strip()[:n]

def license_ok(lic):
    l = lic.lower()
    if 'nc' in re.split(r'[\s\-]', l) or 'nd' in re.split(r'[\s\-]', l): return False
    return l.startswith('cc0') or 'public domain' in l or l.startswith('cc by') or l == 'attribution' or l == 'pd' or l.startswith('pd-')

def search(terms):
    for t in terms:
        print('##', t)
        d = json.loads(get(API + urllib.parse.urlencode({'action': 'query', 'generator': 'search', 'gsrsearch': t + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 8, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'format': 'json'})))
        for p in (d.get('query', {}).get('pages', {}) or {}).values():
            ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
            lic = clean(m, 'LicenseShortName', 40)
            print(f"  {'可用' if license_ok(lic) else '不可用'} | {p['title']} | {ii['width']}x{ii['height']} | {lic} | {clean(m, 'Artist', 50)}")
            print(f"        {clean(m, 'ImageDescription', 140)}")
        time.sleep(2)

def load_credits():
    return json.load(open(CREDITS, encoding='utf-8')) if os.path.exists(CREDITS) else {}

def write_md(cr):
    L = ['# 图片来源', '', '史料卡里的图片都来自 Wikimedia Commons，已缩小到长边 520 像素以内。由 `tools/commons.py` 生成，不要手改。', '',
         '| 卡片 | 文件 | 作者 | 许可 |', '|---|---|---|---|']
    for cid, v in cr.items():
        L.append(f"| {cid} | [{v['title'][5:]}]({v['page']}) | {v['artist'] or '佚名'} | {v['license']} |")
    open(os.path.join(ROOT, 'CREDITS.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def fetch(cid, title):
    d = json.loads(get(API + urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 900, 'format': 'json'})))
    p = list(d['query']['pages'].values())[0]
    if 'imageinfo' not in p: sys.exit(f'Commons 上没有这个文件：{title}')
    ii = p['imageinfo'][0]; m = ii['extmetadata']
    lic = clean(m, 'LicenseShortName', 40)
    if not license_ok(lic): sys.exit(f'许可「{lic}」不能自由使用，换一张')
    os.makedirs(IMG, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'src')
        open(src, 'wb').write(get(ii['thumburl']))
        out = os.path.join(IMG, cid + '.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '520', src, '--out', out], check=True, capture_output=True)
    cr = load_credits()
    cr[cid] = {'title': p['title'], 'page': ii['descriptionurl'], 'license': lic, 'artist': clean(m, 'Artist', 80), 'desc': clean(m, 'ImageDescription', 200)}
    json.dump(cr, open(CREDITS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    write_md(cr)
    print(f"已保存 img/cards/{cid}.jpg（{os.path.getsize(out) // 1024}KB）| {lic} | {cr[cid]['artist']}")
    print(f"图片原说明：{cr[cid]['desc']}")
    print(f"卡片 img.credit 可写：{cr[cid]['artist'] or '佚名'} · {lic} · Wikimedia Commons")

def preview(titles):
    out = os.path.join(ROOT, '.cache', 'previews'); os.makedirs(out, exist_ok=True)
    for title in titles:
        d = json.loads(get(API + urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 480, 'format': 'json'})))
        p = list(d['query']['pages'].values())[0]
        if 'imageinfo' not in p: print('没有这个文件：', title); continue
        ii = p['imageinfo'][0]; m = ii['extmetadata']
        f = os.path.join(out, re.sub(r'[^\w.-]+', '_', p['title'][5:])[:80])
        if not f.lower().endswith(('.jpg', '.jpeg', '.png')): f += '.jpg'
        open(f, 'wb').write(get(ii['thumburl']))
        print(f"{f} | {clean(m, 'LicenseShortName', 40)} | {clean(m, 'Artist', 50)}\n   {clean(m, 'ImageDescription', 200)}")
        time.sleep(2)

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == 'search': search(a[1:])
    elif a[0] == 'fetch' and len(a) == 3: fetch(a[1], a[2])
    elif a[0] == 'preview': preview(a[1:])
    elif a[0] == 'credits': write_md(load_credits()); print('已重写 CREDITS.md')
    else: sys.exit(__doc__)
