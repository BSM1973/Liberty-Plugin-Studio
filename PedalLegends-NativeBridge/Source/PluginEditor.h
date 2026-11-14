#pragma once
#include "PluginProcessor.h"

class PedalLegendsBridgeEditor final : public juce::AudioProcessorEditor,
                                      private juce::Timer
{
public:
    explicit PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor&);
    ~PedalLegendsBridgeEditor() override;
    void paint (juce::Graphics&) override;
    void resized() override;
private:
    void timerCallback() override;
    PedalLegendsBridgeProcessor& processor;
    std::unique_ptr<juce::AudioProcessorEditor> originalEditor;
    juce::Label statusLabel;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PedalLegendsBridgeEditor)
};
