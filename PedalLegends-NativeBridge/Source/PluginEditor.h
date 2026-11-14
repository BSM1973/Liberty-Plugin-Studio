#pragma once
#include "PluginProcessor.h"

class PedalLegendsBridgeEditor final : public juce::AudioProcessorEditor,
                                      private juce::Timer,
                                      private juce::ComponentListener,
                                      private juce::AsyncUpdater
{
public:
    explicit PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor&);
    ~PedalLegendsBridgeEditor() override;
    void paint (juce::Graphics&) override;
    void resized() override;
private:
    void timerCallback() override;
    void componentMovedOrResized (juce::Component&, bool wasMoved, bool wasResized) override;
    void handleAsyncUpdate() override;
    PedalLegendsBridgeProcessor& processor;
    std::unique_ptr<juce::AudioProcessorEditor> originalEditor;
    juce::Label statusLabel;
    bool updatingChildLayout = false;
    int pendingWidth = 0;
    int pendingHeight = 0;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PedalLegendsBridgeEditor)
};
