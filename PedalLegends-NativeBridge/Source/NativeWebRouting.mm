// Import Apple frameworks before JUCE's optional global using namespace.
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>
#include "NativeWebRouting.h"
#include "PluginProcessor.h"

namespace
{
    WKWebView* findWebView (NSView* root)
    {
        if (root == nil) return nil;
        if ([root isKindOfClass:[WKWebView class]])
            return (WKWebView*) root;
        for (NSView* child in [root subviews])
            if (auto* result = findWebView (child))
                return result;
        return nil;
    }

    char handlerAssociationKey;
}

@interface LMSPresetRoutingHandler : NSObject <WKScriptMessageHandler>
{
@private
    juce::WeakReference<PedalLegendsBridgeProcessor> processorRef;
}
- (instancetype) initWithProcessor:(PedalLegendsBridgeProcessor*) p;
@end

@implementation LMSPresetRoutingHandler

- (instancetype) initWithProcessor:(PedalLegendsBridgeProcessor*) p
{
    self = [super init];
    if (self != nil)
        processorRef = juce::WeakReference<PedalLegendsBridgeProcessor> (p);
    return self;
}

- (void)userContentController:(WKUserContentController*)controller
      didReceiveScriptMessage:(WKScriptMessage*)message
{
    if (![message.name isEqualToString:@"lmsPresetRouting"])
        return;
    if (![message.body isKindOfClass:[NSDictionary class]])
        return;
    auto* processor = processorRef.get();
    if (processor == nullptr)
        return;
    // WKScriptMessageHandler is called on the AppKit main thread.
    if (! juce::MessageManager::getInstance()->isThisTheMessageThread())
        return;

    NSDictionary* request = (NSDictionary*) message.body;
    NSNumber* mode = request[@"mode"];
    NSNumber* balance = request[@"balance"];
    NSArray* choices = request[@"lanes"];
    if (![mode isKindOfClass:[NSNumber class]] ||
        ![balance isKindOfClass:[NSNumber class]] ||
        ![choices isKindOfClass:[NSArray class]] ||
        [choices count] != 8)
        return;

    const int selectedMode = [mode intValue];
    if (selectedMode != 0 && selectedMode != 2)
        return;
    const double value = [balance doubleValue];
    if (!std::isfinite(value) || value < 0.0 || value > 1.0)
        return;

    std::array<int, 8> lanes {};
    for (NSUInteger i = 0; i < 8; ++i)
    {
        id item = choices[i];
        if (![item isKindOfClass:[NSNumber class]])
            return;
        const int v = [(NSNumber*) item intValue];
        if (v != 0 && v != 1)
            return;
        lanes[(size_t) i] = v;
    }
    processor->recallFactoryPresetRouting (selectedMode, lanes, (float)value);
}
@end

void lmsPushWebRouting (juce::AudioProcessorEditor& originalEditor,
                        PedalLegendsBridgeProcessor& processor,
                        int mode, bool ready, const std::array<int, 8>& lanes)
{
    // Only message-thread UI updates. No interaction with the audio callback.
    jassert (juce::MessageManager::getInstance()->isThisTheMessageThread());
    const auto* peer = originalEditor.getPeer();
    if (peer == nullptr) return;
    auto* native = (id) peer->getNativeHandle();
    if (native == nil || ! [native isKindOfClass:[NSView class]]) return;

    WKWebView* web = findWebView ((NSView*) native);
    if (web == nil) return;

    // Reset inherited WebKit magnification. The original editor may already
    // implement its own responsive scaling; do NOT stack pageZoom on it.
    if (@available(macOS 11.0, *))
        if (std::abs ([web pageZoom] - 1.0) > 0.002)
            [web setPageZoom:1.0];

    // Fit the *measured rendered page*, not guessed nominal dimensions.
    // CSS zoom preserves WebKit hit testing (unlike native affine transforms).
    // We measure the actual root bounding box after the original React layout
    // has run; if it already fits, nothing is changed.
    static NSString* const fitScript = @R"JS(
    (function () {
      if (window.__lmsNativeFitInstalled) return;
      window.__lmsNativeFitInstalled = true;
      let pending = false;
      let passes = 0;
      function fit() {
        pending = false;
        const root = document.querySelector('#main .liberty-root') ||
                     document.querySelector('#main');
        if (!root || window.innerWidth < 320 || window.innerHeight < 300) return;
        const rect = root.getBoundingClientRect();
        if (rect.width < 150 || rect.height < 150) return;
        const body = document.body;
        const current = Number(body.dataset.lmsFitZoom || 1);
        const widthLimit = Math.max(320, window.innerWidth - 12);
        const heightLimit = Math.max(300, window.innerHeight - 12);
        const ratio = Math.min(widthLimit / rect.width,
                               heightLimit / rect.height);
        const next = Math.max(0.55, Math.min(2.2, current * ratio));
        if (Math.abs(next - current) / current < 0.035) return;
        body.style.zoom = String(next);
        body.dataset.lmsFitZoom = String(next);
        // React may reflow after WebKit zoom. Check once more, with a limit.
        if (++passes < 3) requestAnimationFrame(queueFit);
      }
      function queueFit() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(fit);
      }
      window.addEventListener('resize', () => { passes = 0; queueFit(); });
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', queueFit, {once: true});
      else queueFit();
      setTimeout(() => { passes = 0; queueFit(); }, 350);
      setTimeout(() => { passes = 0; queueFit(); }, 1100);
    })();
    )JS";
    [web evaluateJavaScript:fitScript completionHandler:nil];

    // Install once per original WebView. The handler holds only a weak JUCE
    // processor pointer; the host editor can close without a dangling object.
    if (objc_getAssociatedObject (web, &handlerAssociationKey) == nil)
    {
        LMSPresetRoutingHandler* handler =
            [[LMSPresetRoutingHandler alloc] initWithProcessor:&processor];
        [web.configuration.userContentController
            addScriptMessageHandler:handler name:@"lmsPresetRouting"];
        objc_setAssociatedObject (web, &handlerAssociationKey, handler,
                                  OBJC_ASSOCIATION_RETAIN_NONATOMIC);
#if !__has_feature(objc_arc)
        [handler release];
#endif
    }

    // Data-only payload from the real native host routing parameters.
    juce::String command ("window.__lmsV121_updateRouting && window.__lmsV121_updateRouting({mode:");
    command << mode << ",ready:" << (ready ? "true" : "false") << ",lanes:[";
    for (size_t i = 0; i < lanes.size(); ++i)
    {
        if (i) command << ",";
        command << juce::jlimit (0, 1, lanes[i]);
    }
    command << "]});";
    NSString* script = [NSString stringWithUTF8String:command.toRawUTF8()];
    [web evaluateJavaScript:script completionHandler:nil];
}
