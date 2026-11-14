#pragma once

#include <JuceHeader.h>
#include <atomic>
#include <memory>

// The original PluginMaker/Faust DSP is not available as source.
// This processor HOSTS the user's validated original AU instead of reimplementing it.
// Original AU identity: aufx/yZPb/Plmk ; bridge identity: aufx/PdLg/LbMS.
class PedalLegendsBridgeProcessor final : public juce::AudioProcessor,
                                         private juce::AsyncUpdater
{
public:
    PedalLegendsBridgeProcessor();
    ~PedalLegendsBridgeProcessor() override;

    const juce::String getName() const override { return "Pedal Legends"; }
    void prepareToPlay (double sampleRate, int maxBlockSize) override;
    void releaseResources() override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    void processBlock (juce::AudioBuffer<double>&, juce::MidiBuffer&) override;
    bool isBusesLayoutSupported (const BusesLayout&) const override;
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return "Pedalboard"; }
    void changeProgramName (int, const juce::String&) override {}
    bool hasEditor() const override { return true; }
    juce::AudioProcessorEditor* createEditor() override;
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    // Only for use by the editor on the JUCE message thread.
    juce::AudioPluginInstance* getEngineForEditor() const noexcept { return engine.get(); }
    juce::String getStatus() const { return status; }

private:
    void handleAsyncUpdate() override;
    void startOriginalAU();
    void finishCreation (std::unique_ptr<juce::AudioPluginInstance>, const juce::String& error);
    void refreshStatus (const juce::String& value);
    void restoreSnapshot (juce::AudioPluginInstance&);

    // The message thread owns these objects. The audio callback uses a TRY lock and
    // bypasses on contention; it never blocks on plugin creation or UI operations.
    juce::SpinLock engineLock;
    juce::AudioPluginFormatManager formatManager;
    std::unique_ptr<juce::AudioPluginInstance> engine;
    juce::MemoryBlock savedEngineState;
    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;
    bool prepared = false;
    juce::String status = "Recherche du moteur Pedal Legends original...";

    JUCE_DECLARE_WEAK_REFERENCEABLE (PedalLegendsBridgeProcessor)
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PedalLegendsBridgeProcessor)
};
