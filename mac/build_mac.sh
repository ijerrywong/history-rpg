#!/bin/bash
# 打包 macOS 版：dist/<标题>.app 与 dist/<标题>-mac.zip（通用二进制，macOS 10.13+）
# 用法：mac/build_mac.sh [剧本id]，默认 zhangqian
set -euo pipefail
cd "$(dirname "$0")/.."
SID="${1:-zhangqian}"
python3 build.py "$SID"
NAME="$(python3 -c "import re;print(re.search(r\"title:\s*'([^']+)'\", open('js/story/$SID.js',encoding='utf-8').read()).group(1))")"
APP="dist/${NAME}.app"
rm -rf "$APP" "dist/${NAME}-mac.zip"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web"
clang -arch x86_64 -arch arm64 -mmacosx-version-min=10.13 -fobjc-arc -O2 -framework Cocoa -framework WebKit mac/main.m -o "$APP/Contents/MacOS/Game"
cp "dist/${NAME}.html" "$APP/Contents/Resources/web/game.html"
[ -f "mac/$SID.icns" ] || python3 -I tools/make_icon.py "$SID"   # 图标：主角站在黄昏的沙丘上
cp "mac/$SID.icns" "$APP/Contents/Resources/AppIcon.icns"
VERSION="$(git rev-list --count HEAD 2>/dev/null || echo 1)"
cat > "$APP/Contents/Info.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>${NAME}</string>
  <key>CFBundleDisplayName</key><string>${NAME}</string>
  <key>CFBundleIdentifier</key><string>local.historyrpg.$SID</string>
  <key>CFBundleExecutable</key><string>Game</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0.$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>10.13</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.educational-games</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PL
codesign --force --deep -s - "$APP"
PKG="$(mktemp -d)/${NAME}"; mkdir -p "$PKG"
ditto "$APP" "$PKG/${NAME}.app"; cp mac/使用说明.txt "$PKG/使用说明.txt"; cp "dist/${NAME}.html" "$PKG/${NAME}（浏览器版）.html"
ditto -c -k --keepParent "$PKG" "dist/${NAME}-mac.zip"; rm -rf "$(dirname "$PKG")"
echo "已生成 $APP 与 dist/${NAME}-mac.zip"
