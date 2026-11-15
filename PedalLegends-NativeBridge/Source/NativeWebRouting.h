#pragma once
#include <JuceHeader.h>
#include <array>

// Sends visualization-only state to the original Pedal Legends WKWebView.
// No audio-thread use, and no original DSP parameter is modified.
void lmsPushWebRouting (juce::AudioProcessorEditor& originalEditor,
                        int mode, bool ready, const std::array<int, 8>& lanes);
