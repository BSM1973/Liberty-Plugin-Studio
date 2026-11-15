// Import Apple frameworks before JUCE's optional global using namespace,
// otherwise Carbon's Point/Component typedefs become ambiguous.
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#include "NativeWebRouting.h"

namespace
{
    // Native JUCE child windows hosting the original PluginMaker Audio Unit
    // embed WKWebView. Find it under the current editor's own macOS NSView.
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
}

void lmsPushWebRouting (juce::AudioProcessorEditor& originalEditor,
                        int mode, bool ready, const std::array<int, 8>& lanes)
{
    // Called only on the JUCE message thread, never in processBlock.
    jassert (juce::MessageManager::getInstance()->isThisTheMessageThread());
    const auto* peer = originalEditor.getPeer();
    if (peer == nullptr) return;
    auto* native = (id) peer->getNativeHandle();
    if (native == nil || ! [native isKindOfClass:[NSView class]]) return;

    WKWebView* web = findWebView ((NSView*) native);
    if (web == nil) return;

    // Data-only payload; all text is numeric and originates from local
    // routing parameters. JS function exists only in our signed UI resources.
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
