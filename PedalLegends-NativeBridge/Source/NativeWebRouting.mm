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

    // WebKit's pageZoom scales HTML and pointer hit-testing together.
    // Never apply a JUCE affine transform to WKWebView's native NSView.
    // The source layout is approximately 1440 x 960; the JUCE editor uses a
    // compact 136-point routing header and the remaining space for the board.
    // Reserve a small safety margin for the original footer.
    if (@available(macOS 11.0, *))
    {
        const CGFloat visibleWidth = NSWidth ([web bounds]);
        const CGFloat visibleHeight = NSHeight ([web bounds]);
        if (visibleWidth > 320.0 && visibleHeight > 240.0)
        {
            const CGFloat zoom = std::max (0.45, std::min (1.0,
                std::min ((visibleWidth - 12.0) / 1440.0,
                          (visibleHeight - 12.0) / 960.0)));
            if (std::abs ([web pageZoom] - zoom) > 0.005)
                [web setPageZoom:zoom];
        }
    }

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
