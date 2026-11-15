#pragma once
#include "PluginProcessor.h"
#include "RoutingDiagram.h"
#include "RoutingTheme.h"

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
    void syncRoutingControls();

    PedalLegendsBridgeProcessor& processor;
    std::unique_ptr<juce::AudioProcessorEditor> originalEditor;
    juce::Label statusLabel;
    juce::Label blendTitle;
    juce::Label routingStatus;
    std::array<juce::TextButton, 3> modeButtons;
    std::array<juce::TextButton, 8> stageLaneButtons;
    juce::Slider blendSlider;
    PedalLegendsRoutingTheme routingTheme;
    PedalLegendsRoutingDiagram routingDiagram;

    bool updatingChildLayout = false;
    int originalWidth = 1440;
    int originalHeight = 960;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PedalLegendsBridgeEditor)
};
