#pragma once
#include <JuceHeader.h>
#include <array>

// Sends visualization-only state to the original Pedal Legends WKWebView.
// No audio-thread use, and no original DSP parameter is modified.
class PedalLegendsBridgeProcessor;
void lmsPushWebRouting (juce::AudioProcessorEditor& originalEditor,
                        PedalLegendsBridgeProcessor& processor, int mode, bool ready, const std::array<int, 8>& lanes);
