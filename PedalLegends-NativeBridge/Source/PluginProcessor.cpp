#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
    // Factory AU original, installed independently from this native bridge.
    const juce::String originalType = "aufx";
    const juce::String originalSubtype = "yZPb";
    const juce::String originalManufacturer = "Plmk";
    constexpr juce::uint32 stateMagic = 0x504C4231; // PLB1
}

PedalLegendsBridgeProcessor::PedalLegendsBridgeProcessor()
    : juce::AudioProcessor (BusesProperties()
          .withInput ("Entrée", juce::AudioChannelSet::stereo(), true)
          .withOutput ("Sortie", juce::AudioChannelSet::stereo(), true))
{
    formatManager.addDefaultFormats();
    triggerAsyncUpdate();
}

PedalLegendsBridgeProcessor::~PedalLegendsBridgeProcessor()
{
    cancelPendingUpdate();
    const juce::SpinLock::ScopedLockType lock (engineLock);
    engine.reset();
}

bool PedalLegendsBridgeProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto in = layouts.getMainInputChannelSet();
    const auto out = layouts.getMainOutputChannelSet();
    return in == out && (in == juce::AudioChannelSet::mono() || in == juce::AudioChannelSet::stereo());
}

void PedalLegendsBridgeProcessor::prepareToPlay (double sampleRate, int blockSize)
{
    const juce::SpinLock::ScopedLockType lock (engineLock);
    currentSampleRate = sampleRate;
    currentBlockSize = blockSize;
    prepared = true;
    if (engine != nullptr)
        engine->prepareToPlay (sampleRate, blockSize);
}

void PedalLegendsBridgeProcessor::releaseResources()
{
    const juce::SpinLock::ScopedLockType lock (engineLock);
    prepared = false;
    if (engine != nullptr)
        engine->releaseResources();
}

void PedalLegendsBridgeProcessor::processBlock (juce::AudioBuffer<float>& audio, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;
    juce::SpinLock::ScopedTryLockType lock (engineLock);
    if (lock.isLocked() && engine != nullptr)
        engine->processBlock (audio, midi);
    // Missing engine or lock contention: safe dry pass-through, no allocations.
}

void PedalLegendsBridgeProcessor::processBlock (juce::AudioBuffer<double>& audio, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;
    juce::SpinLock::ScopedTryLockType lock (engineLock);
    if (lock.isLocked() && engine != nullptr && engine->supportsDoublePrecisionProcessing())
        engine->processBlock (audio, midi);
    // Dry pass-through when the hosted AU is float-only.
}

void PedalLegendsBridgeProcessor::handleAsyncUpdate()
{
    startOriginalAU();
}

void PedalLegendsBridgeProcessor::refreshStatus (const juce::String& newStatus)
{
    status = newStatus;
    updateHostDisplay();
}

void PedalLegendsBridgeProcessor::startOriginalAU()
{
    // Never trigger a scan of all plugins' binaries: enumerate registered AU IDs
    // and inspect only the exact PluginMaker identity.
    auto* format = formatManager.getFormat (0);
    if (format == nullptr)
    {
        refreshStatus (juce::String::fromUTF8 (u8"Hébergement Audio Unit non disponible."));
        return;
    }

    const auto allIDs = format->searchPathsForPlugins ({}, false, false);
    juce::OwnedArray<juce::PluginDescription> matches;
    for (const auto& id : allIDs)
    {
        if (! id.containsIgnoreCase (originalSubtype)
            || ! id.containsIgnoreCase (originalManufacturer))
            continue;

        juce::OwnedArray<juce::PluginDescription> types;
        format->findAllTypesForFile (types, id);
        for (const auto* type : types)
        {
            if (type != nullptr && type->fileOrIdentifier.containsIgnoreCase (originalSubtype)
                && type->fileOrIdentifier.containsIgnoreCase (originalManufacturer)
                && type->fileOrIdentifier.containsIgnoreCase (originalType))
            {
                matches.add (new juce::PluginDescription (*type));
            }
        }
    }

    if (matches.isEmpty())
    {
        refreshStatus (juce::String::fromUTF8 (u8"Moteur original introuvable : installez LIBERTY_PEDAL_LEGENDS.component (aufx/yZPb/Plmk)."));
        return;
    }

    refreshStatus (juce::String::fromUTF8 (u8"Chargement du moteur audio d'origine..."));
    const auto description = *matches.getFirst();
    auto weak = juce::WeakReference<PedalLegendsBridgeProcessor> (this);
    formatManager.createPluginInstanceAsync (
        description, currentSampleRate, currentBlockSize,
        [weak] (std::unique_ptr<juce::AudioPluginInstance> instance, const juce::String& error) mutable
        {
            if (auto* self = weak.get())
                self->finishCreation (std::move (instance), error);
        });
}

void PedalLegendsBridgeProcessor::finishCreation (
    std::unique_ptr<juce::AudioPluginInstance> instance, const juce::String& error)
{
    if (instance == nullptr)
    {
        refreshStatus (juce::String::fromUTF8 (u8"Échec du chargement de l'AU original : ") + error);
        return;
    }

    // Prepare on a non-realtime thread before installing the engine into the
    // audio callback. No external allocation occurs inside processBlock.
    instance->setBusesLayout (getBusesLayout());
    if (prepared)
        instance->prepareToPlay (currentSampleRate, currentBlockSize);

    restoreSnapshot (*instance);
    {
        const juce::SpinLock::ScopedLockType lock (engineLock);
        engine = std::move (instance);
    }
    refreshStatus (juce::String::fromUTF8 (u8"Moteur original chargé - 40 pédales disponibles dans son interface."));
}

void PedalLegendsBridgeProcessor::restoreSnapshot (juce::AudioPluginInstance& destination)
{
    if (! savedEngineState.isEmpty())
        destination.setStateInformation (savedEngineState.getData(), (int) savedEngineState.getSize());
}

void PedalLegendsBridgeProcessor::getStateInformation (juce::MemoryBlock& out)
{
    juce::MemoryBlock snapshot = savedEngineState;
    {
        const juce::SpinLock::ScopedLockType lock (engineLock);
        if (engine != nullptr)
            engine->getStateInformation (snapshot);
    }
    juce::MemoryOutputStream stream (out, false);
    stream.writeInt ((int) stateMagic);
    stream.writeInt ((int) snapshot.getSize());
    stream.write (snapshot.getData(), snapshot.getSize());
}

void PedalLegendsBridgeProcessor::setStateInformation (const void* data, int dataSize)
{
    if (data == nullptr || dataSize < 8) return;
    juce::MemoryInputStream stream (data, (size_t) dataSize, false);
    if ((juce::uint32) stream.readInt() != stateMagic) return;
    const int size = stream.readInt();
    if (size < 0 || size > dataSize - 8) return;
    juce::MemoryBlock snapshot;
    snapshot.setSize ((size_t) size, false);
    if (stream.read (snapshot.getData(), (size_t) size) != size) return;

    const juce::SpinLock::ScopedLockType lock (engineLock);
    savedEngineState = snapshot;
    if (engine != nullptr)
        engine->setStateInformation (savedEngineState.getData(), (int) savedEngineState.getSize());
}

juce::AudioProcessorEditor* PedalLegendsBridgeProcessor::createEditor()
{
    return new PedalLegendsBridgeEditor (*this);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new PedalLegendsBridgeProcessor();
}
