// 历史 RPG macOS 外壳：一个窗口 + WKWebView，加载打包好的单文件游戏。
// 用 Objective-C 而非 Swift：无需 Swift 运行库，macOS 10.13 起的 Intel / Apple 芯片 Mac 都能跑。
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

// 通过自定义协议 hrpg://game/ 提供游戏文件，让页面有固定的来源，存档（localStorage）才能可靠保存
@interface GameScheme : NSObject <WKURLSchemeHandler>
@end
@implementation GameScheme
- (void)webView:(WKWebView *)webView startURLSchemeTask:(id<WKURLSchemeTask>)task {
  NSString *name = task.request.URL.path.lastPathComponent;
  if (name.length == 0 || [name isEqualToString:@"/"]) name = @"game.html";
  NSString *path = [[NSBundle mainBundle] pathForResource:name ofType:nil inDirectory:@"web"];
  NSData *data = path ? [NSData dataWithContentsOfFile:path] : nil;
  if (!data) { [task didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorFileDoesNotExist userInfo:nil]]; return; }
  NSString *mime = [name hasSuffix:@".html"] ? @"text/html" : @"application/octet-stream";
  NSHTTPURLResponse *resp = [[NSHTTPURLResponse alloc] initWithURL:task.request.URL statusCode:200 HTTPVersion:@"HTTP/1.1"
                                                      headerFields:@{ @"Content-Type": [mime stringByAppendingString:@"; charset=utf-8"] }];
  [task didReceiveResponse:resp];
  [task didReceiveData:data];
  [task didFinish];
}
- (void)webView:(WKWebView *)webView stopURLSchemeTask:(id<WKURLSchemeTask>)task {}
@end

@interface AppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate>
@property (strong) NSWindow *window;
@property (strong) WKWebView *web;
@property (strong) GameScheme *scheme;
@end

@implementation AppDelegate
- (void)buildMenu {
  NSMenu *bar = [NSMenu new];
  NSMenuItem *appItem = [NSMenuItem new]; [bar addItem:appItem];
  NSMenu *appMenu = [NSMenu new];
  [appMenu addItemWithTitle:@"关于" action:@selector(orderFrontStandardAboutPanel:) keyEquivalent:@""];
  [appMenu addItem:[NSMenuItem separatorItem]];
  [appMenu addItemWithTitle:@"隐藏" action:@selector(hide:) keyEquivalent:@"h"];
  [appMenu addItemWithTitle:@"退出" action:@selector(terminate:) keyEquivalent:@"q"];
  appItem.submenu = appMenu;
  NSMenuItem *viewItem = [NSMenuItem new]; [bar addItem:viewItem];
  NSMenu *viewMenu = [[NSMenu alloc] initWithTitle:@"显示"];
  NSMenuItem *fs = [viewMenu addItemWithTitle:@"进入全屏" action:@selector(toggleFullScreen:) keyEquivalent:@"f"];
  fs.keyEquivalentModifierMask = NSEventModifierFlagCommand | NSEventModifierFlagControl;
  viewItem.submenu = viewMenu;
  NSApp.mainMenu = bar;
}

- (void)applicationDidFinishLaunching:(NSNotification *)n {
  [self buildMenu];
  WKWebViewConfiguration *cfg = [WKWebViewConfiguration new];
  self.scheme = [GameScheme new];
  [cfg setURLSchemeHandler:self.scheme forURLScheme:@"hrpg"];
  cfg.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
  if (@available(macOS 10.12, *)) cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;

  NSRect frame = NSMakeRect(0, 0, 1024, 768);
  self.window = [[NSWindow alloc] initWithContentRect:frame
                                            styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable
                                              backing:NSBackingStoreBuffered defer:NO];
  self.window.title = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
  self.window.backgroundColor = [NSColor colorWithRed:0.03 green:0.02 blue:0.06 alpha:1];
  self.window.contentMinSize = NSMakeSize(640, 480);
  self.window.collectionBehavior = NSWindowCollectionBehaviorFullScreenPrimary;
  self.window.delegate = self;
  [self.window setFrameAutosaveName:@"GameMain"];
  if (![self.window setFrameUsingName:@"GameMain"]) [self.window center];

  self.web = [[WKWebView alloc] initWithFrame:frame configuration:cfg];
  self.web.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  [self.web setValue:@NO forKey:@"drawsBackground"];
  self.web.navigationDelegate = self;
  self.window.contentView = self.web;
  [self.web loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"hrpg://game/game.html"]]];

  [self.window makeKeyAndOrderFront:nil];
  [self.window makeFirstResponder:self.web]; // 键盘直接进游戏
  [NSApp activateIgnoringOtherApps:YES];
}
// 设了环境变量 BAXIAN_DEBUG 时，加载完成后打印页面状态（用于自动测试）
- (void)webView:(WKWebView *)w didFinishNavigation:(WKNavigation *)nav {
  if (!getenv("BAXIAN_DEBUG")) return;
  NSString *js = @"(function(){ var old = localStorage.getItem('probe'); localStorage.setItem('probe', String(Date.now()));"
                  "return [document.title, typeof MapScene, typeof QUESTS, Object.keys(QUESTS).length, 'probe=' + old].join(' | '); })()";
  [w evaluateJavaScript:js completionHandler:^(id r, NSError *e) { printf("BAXIAN_DEBUG %s\n", [[r description] ?: e.description UTF8String]); fflush(stdout); }];
}
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)a { return YES; }
@end

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    NSApplication *app = [NSApplication sharedApplication];
    AppDelegate *d = [AppDelegate new];
    app.delegate = d;
    app.activationPolicy = NSApplicationActivationPolicyRegular;
    [app run];
  }
  return 0;
}
