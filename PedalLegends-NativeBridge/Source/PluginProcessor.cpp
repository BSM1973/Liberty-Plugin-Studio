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
    routingMode = new juce::AudioParameterChoice (
        juce::ParameterID { "lms_route_mode", 1 }, "Routage",
        juce::StringArray { "Série", "Parallèle (direct + effets)", "SPLIT A / B (deux chaînes)" }, 0);
    parallelBlend = new juce::AudioParameterFloat (
        juce::ParameterID { "lms_parallel_blend", 1 }, "Dosage parallèle",
        juce::NormalisableRange<float> { 0.0f, 1.0f, 0.001f }, 0.5f);
    addParameter (routingMode);
    addParameter (parallelBlend);
    for (int stage = 0; stage < 8; ++stage)
    {
        stageLanes[(size_t) stage] = new juce::AudioParameterChoice (
            juce::ParameterID { "lms_split_stage_" + juce::String (stage + 1), 1 },
            "Branche étage " + juce::String (stage + 1),
            juce::StringArray { "A", "B" }, stage < 4 ? 0 : 1);
        addParameter (stageLanes[(size_t) stage]);
    }
    stageEnabledParameterIndices.fill (-1);
    formatManager.addDefaultFormats();
    triggerAsyncUpdate();
}

PedalLegendsBridgeProcessor::~PedalLegendsBridgeProcessor()
{
    cancelPendingUpdate();
    stopTimer();
    const juce::SpinLock::ScopedLockType lock (engineLock);
    twoBranchReady.store (false);
    splitEngineA.reset();
    splitEngineB.reset();
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
    // Allocate only off the audio thread. Serial mode remains unchanged.
    dryFloat.setSize (2, juce::jmax (64, blockSize), false, false, true);
    dryDouble.setSize (2, juce::jmax (64, blockSize), false, false, true);
    branchBFloat.setSize (2, juce::jmax (64, blockSize), false, false, true);
    branchBDouble.setSize (2, juce::jmax (64, blockSize), false, false, true);
    if (engine != nullptr)
        engine->prepareToPlay (sampleRate, blockSize);
    if (splitEngineA != nullptr)
        splitEngineA->prepareToPlay (sampleRate, blockSize);
    if (splitEngineB != nullptr)
        splitEngineB->prepareToPlay (sampleRate, blockSize);
}

void PedalLegendsBridgeProcessor::releaseResources()
{
    const juce::SpinLock::ScopedLockType lock (engineLock);
    prepared = false;
    if (engine != nullptr)
        engine->releaseResources();
    if (splitEngineA != nullptr)
        splitEngineA->releaseResources();
    if (splitEngineB != nullptr)
        splitEngineB->releaseResources();
}

void PedalLegendsBridgeProcessor::processBlock (juce::AudioBuffer<float>& audio, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;
    juce::SpinLock::ScopedTryLockType lock (engineLock);
    if (! lock.isLocked() || engine == nullptr)
        return; // preserve V10 safe direct pass-through on contention

    const int mode = routingMode->getIndex();
    const int channels = audio.getNumChannels();
    const int samples = audio.getNumSamples();

    // A *real* dual-pedal-path split: process two independent copies of the
    // original AU on the same input, with each stage enabled only in its lane.
    // Join at OUTPUT. Both lanes preserve the order of their assigned stages.
    if (mode == 2 && twoBranchReady.load() && splitEngineA != nullptr
        && splitEngineB != nullptr && channels <= branchBFloat.getNumChannels()
        && samples <= branchBFloat.getNumSamples())
    {
        for (int ch = 0; ch < channels; ++ch)
            branchBFloat.copyFrom (ch, 0, audio, ch, 0, samples);
        juce::AudioBuffer<float> branchB (branchBFloat.getArrayOfWritePointers(), channels, samples);
        juce::MidiBuffer secondaryMidi;
        splitEngineA->processBlock (audio, midi);
        splitEngineB->processBlock (branchB, secondaryMidi);
        const float amountB = juce::jlimit (0.0f, 1.0f, parallelBlend->get());
        for (int ch = 0; ch < channels; ++ch)
        {
            audio.applyGain (ch, 0, samples, 1.0f - amountB);
            audio.addFrom (ch, 0, branchB, ch, 0, samples, amountB);
        }
        return;
    }

    // Compatibility: old projects stay serial, and split is safely serial
    // until both AU instances and every Enabled mapping are ready.
    if (mode != 1 || samples > dryFloat.getNumSamples()
        || channels > dryFloat.getNumChannels())
    {
        engine->processBlock (audio, midi);
        return;
    }
    for (int ch = 0; ch < channels; ++ch)
        dryFloat.copyFrom (ch, 0, audio, ch, 0, samples);
    engine->processBlock (audio, midi);
    const float wet = juce::jlimit (0.0f, 1.0f, parallelBlend->get());
    for (int ch = 0; ch < channels; ++ch)
    {
        audio.applyGain (ch, 0, samples, wet);
        audio.addFrom (ch, 0, dryFloat, ch, 0, samples, 1.0f - wet);
    }
}

void PedalLegendsBridgeProcessor::processBlock (juce::AudioBuffer<double>& audio, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;
    juce::SpinLock::ScopedTryLockType lock (engineLock);
    if (! lock.isLocked() || engine == nullptr || ! engine->supportsDoublePrecisionProcessing())
        return;

    const int mode = routingMode->getIndex();
    const int channels = audio.getNumChannels();
    const int samples = audio.getNumSamples();
    if (mode == 2 && twoBranchReady.load() && splitEngineA != nullptr
        && splitEngineB != nullptr && splitEngineA->supportsDoublePrecisionProcessing()
        && splitEngineB->supportsDoublePrecisionProcessing()
        && channels <= branchBDouble.getNumChannels()
        && samples <= branchBDouble.getNumSamples())
    {
        for (int ch = 0; ch < channels; ++ch)
            branchBDouble.copyFrom (ch, 0, audio, ch, 0, samples);
        juce::AudioBuffer<double> branchB (branchBDouble.getArrayOfWritePointers(), channels, samples);
        juce::MidiBuffer secondaryMidi;
        splitEngineA->processBlock (audio, midi);
        splitEngineB->processBlock (branchB, secondaryMidi);
        const double amountB = juce::jlimit (0.0, 1.0, (double) parallelBlend->get());
        for (int ch = 0; ch < channels; ++ch)
        {
            audio.applyGain (ch, 0, samples, 1.0 - amountB);
            audio.addFrom (ch, 0, branchB, ch, 0, samples, amountB);
        }
        return;
    }
    if (mode != 1 || samples > dryDouble.getNumSamples()
        || channels > dryDouble.getNumChannels())
    {
        engine->processBlock (audio, midi);
        return;
    }
    for (int ch = 0; ch < channels; ++ch)
        dryDouble.copyFrom (ch, 0, audio, ch, 0, samples);
    engine->processBlock (audio, midi);
    const double wet = juce::jlimit (0.0, 1.0, (double) parallelBlend->get());
    for (int ch = 0; ch < channels; ++ch)
    {
        audio.applyGain (ch, 0, samples, wet);
        audio.addFrom (ch, 0, dryDouble, ch, 0, samples, 1.0 - wet);
    }
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
#if JUCE_WINDOWS
    refreshStatus (juce::String::fromUTF8 (
        u8"Windows VST3 (développement) : moteur DSP des 40 pédales non encore porté. "
        u8"Cette version n'effectue pas le traitement des pédales."));
    return;
#else
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
    originalDescription = description;
    originalDescriptionValid = true;
    auto weak = juce::WeakReference<PedalLegendsBridgeProcessor> (this);
    formatManager.createPluginInstanceAsync (
        description, currentSampleRate, currentBlockSize,
        [weak] (std::unique_ptr<juce::AudioPluginInstance> instance, const juce::String& error) mutable
        {
            if (auto* self = weak.get())
                self->finishCreation (std::move (instance), error);
        });
#endif // JUCE_WINDOWS
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
    startTimerHz (15); // synchronize edits to the two independent split engines off the audio thread
    if (routingMode->getIndex() == 2)
        ensureSplitEngines();
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
    // Backwards-compatible extension: previous PLB1 snapshots remain readable.
    stream.writeInt (0x504C5231); // PLR1
    stream.writeInt (routingMode->getIndex());
    stream.writeFloat (parallelBlend->get());
    stream.writeInt (0x504C5331); // PLS1: dual-branch assignment extension
    for (const auto* lane : stageLanes)
        stream.writeInt (lane->getIndex());
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
    if (stream.getNumBytesRemaining() >= 12 && stream.readInt() == 0x504C5231)
    {
        const int restoredMode = juce::jlimit (0, 2, stream.readInt());
        const float restoredBlend = juce::jlimit (0.0f, 1.0f, stream.readFloat());
        routingMode->setValueNotifyingHost ((float) restoredMode / 2.0f);
        parallelBlend->setValueNotifyingHost (restoredBlend);
        if (stream.getNumBytesRemaining() >= 36 && stream.readInt() == 0x504C5331)
            for (auto* lane : stageLanes)
                lane->setValueNotifyingHost ((float) juce::jlimit (0, 1, stream.readInt()));
    }
    else
    {
        routingMode->setValueNotifyingHost (0.0f); // old session => serial
    }
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
