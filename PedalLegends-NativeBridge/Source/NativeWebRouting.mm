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
    char viewportAssociationKey;

    // AppKit and React must see the same viewport dimensions. In particular
    // the original AU may create WKWebView at its previous preferred size
    // before JUCE embeds and resizes the editor.
    void synchronizeWebViewport (WKWebView* web, const juce::AudioProcessorEditor& editor)
    {
        if (web == nil) return;

        NSMutableDictionary* state = (NSMutableDictionary*)
            objc_getAssociatedObject (web, &viewportAssociationKey);
        if (state == nil)
        {
            state = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                     @(-1), @"width", @(-1), @"height",
                     @(0), @"settling", nil];
            objc_setAssociatedObject (web, &viewportAssociationKey, state,
                                      OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        }

        const int wantedW = editor.getWidth(), wantedH = editor.getHeight();
        if (wantedW < 320 || wantedH < 240) return;
        const int previousW = [state[@"width"] intValue];
        const int previousH = [state[@"height"] intValue];
        const bool changed = previousW != wantedW || previousH != wantedH;
        int settling = [state[@"settling"] intValue];
        if (changed)
        {
            settling = 0;
            state[@"width"] = @(wantedW);
            state[@"height"] = @(wantedH);
        }

        // Correct only the actual embedded WebKit child when its immediate
        // native parent already matches the reserved JUCE editor rectangle.
        // Never touch the surrounding DAW window, AU view controller, zoom,
        // original React canvas, or any preset/DSP parameter.
        NSView* parent = [web superview];
        if (parent != nil)
        {
            const NSRect parentBounds = [parent bounds];
            const NSRect webFrame = [web frame];
            const bool parentMatches = std::abs (NSWidth(parentBounds) - wantedW) <= 4.0
                                    && std::abs (NSHeight(parentBounds) - wantedH) <= 4.0;
            if (parentMatches)
            {
                [web setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];
                if (std::abs(NSWidth(webFrame) - NSWidth(parentBounds)) > 2.0
                 || std::abs(NSHeight(webFrame) - NSHeight(parentBounds)) > 2.0)
                {
                    [web setFrame:parentBounds];
                    [web setNeedsLayout:YES];
                    settling = 0;
                }
            }

            // One lightweight trace per editor/size change, so if a specific
            // AU uses a nonstandard parent hierarchy, we can diagnose it from
            // the user's Mac without guessing another transform percentage.
            if (changed)
            {
                const juce::String details =
                    juce::Time::getCurrentTime().toISO8601 (true)
                    + " JUCE=" + juce::String (wantedW) + "x" + juce::String (wantedH)
                    + " parent=" + juce::String (NSWidth(parentBounds), 1) + "x"
                    + juce::String (NSHeight(parentBounds), 1)
                    + " WK=" + juce::String (NSWidth(webFrame), 1) + "x"
                    + juce::String (NSHeight(webFrame), 1)
                    + " matched=" + (parentMatches ? "yes" : "no") + "\\n";
                const auto log = juce::File::getSpecialLocation (juce::File::userHomeDirectory)
                                      .getChildFile ("Library/Logs/PedalLegends-Viewport.log");
                log.appendText (details);
            }
        }

        // React's original CR component calculates scale from the viewport
        // on 'resize'. After embedding, that event can be missed, even when
        // JUCE has already called setBounds. Repeat during first two seconds,
        // then stop; no permanent loop and no additional CSS transforms.
        if (changed || settling < 16)
        {
            [web evaluateJavaScript:
                @"window.dispatchEvent(new Event('resize'));"
                completionHandler:nil];
            state[@"settling"] = @(settling + 1);
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

    synchronizeWebViewport (web, originalEditor);

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
