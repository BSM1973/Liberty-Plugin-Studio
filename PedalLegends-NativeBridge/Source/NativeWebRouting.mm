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
    char geometryAssociationKey;

    // The original 1440x960 React editor already scales itself perfectly
    // whenever WKWebView's REAL viewport is the size requested by JUCE.
    // The hosted Audio Unit can retain an old NSView/WKWebView size when
    // inserted into the new native Split header. Resize only the chain
    // INSIDE the original AU editor's own native peer; never touch the host
    // window, CSS zoom, pageZoom, or the actual canvas.
    void ensureEmbeddedWebViewSize (NSView* editorRoot, WKWebView* web,
                                    int width, int height)
    {
        if (editorRoot == nil || web == nil || width < 320 || height < 240)
            return;

        const NSSize wanted = NSMakeSize ((CGFloat) width, (CGFloat) height);
        const NSSize rootBounds = [editorRoot bounds].size;
        // JUCE must have laid out the embedded editor before doing anything.
        // This guard prevents altering an AU whose native peer has not yet
        // adopted its JUCE component bounds.
        if (std::abs (rootBounds.width - wanted.width) > 3.0
         || std::abs (rootBounds.height - wanted.height) > 3.0)
            return;

        bool changed = false;
        NSView* current = (NSView*) web;
        int depth = 0;
        // Never resize editorRoot or its superviews. Walk solely along the
        // original Audio Unit's native child hierarchy.
        while (current != editorRoot && current != nil && depth++ < 12)
        {
            const NSRect frame = [current frame];
            if (std::abs (frame.size.width - wanted.width) > 2.0
             || std::abs (frame.size.height - wanted.height) > 2.0
             || std::abs (frame.origin.x) > 2.0
             || std::abs (frame.origin.y) > 2.0)
            {
                [current setFrame:NSMakeRect (0.0, 0.0,
                                             wanted.width, wanted.height)];
                [current setNeedsLayout:YES];
                changed = true;
            }
            [current setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];
            current = [current superview];
        }
        if (current != editorRoot)
            return; // Unexpected hierarchy; do not manipulate unrelated views.

        const auto token = juce::String (width) + "x" + juce::String (height);
        NSString* previous = (NSString*) objc_getAssociatedObject (
            web, &geometryAssociationKey);
        const bool firstForSize = previous == nil
            || ! [previous isEqualToString:
                    [NSString stringWithUTF8String:token.toRawUTF8()]];
        if (changed || firstForSize)
        {
            NSString* key = [NSString stringWithUTF8String:token.toRawUTF8()];
            objc_setAssociatedObject (web, &geometryAssociationKey, key,
                                      OBJC_ASSOCIATION_COPY_NONATOMIC);
            // Request the calculation already built into the original
            // React CR component. Do not replace its own CSS scaling.
            [web evaluateJavaScript:
                @"window.dispatchEvent(new Event('resize'));"
                completionHandler:nil];
        }
    }

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

    ensureEmbeddedWebViewSize ((NSView*) native, web,
                               originalEditor.getWidth(),
                               originalEditor.getHeight());


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
