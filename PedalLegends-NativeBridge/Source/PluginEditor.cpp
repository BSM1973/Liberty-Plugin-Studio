#include "PluginEditor.h"

PedalLegendsBridgeEditor::PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    statusLabel.setJustificationType (juce::Justification::centred);
    statusLabel.setColour (juce::Label::textColourId, juce::Colours::black);
    statusLabel.setFont (juce::Font (juce::FontOptions ("Arial", 15.0f, juce::Font::plain)));
    addAndMakeVisible (statusLabel);
    setResizable (false, false);
    setSize (1520, 1000);
    startTimerHz (5);
}

PedalLegendsBridgeEditor::~PedalLegendsBridgeEditor()
{
    stopTimer();
    cancelPendingUpdate();
    if (originalEditor != nullptr)
        originalEditor->removeComponentListener (this);
    originalEditor.reset();
}

void PedalLegendsBridgeEditor::timerCallback()
{
    statusLabel.setText (processor.getStatus(), juce::dontSendNotification);
    if (originalEditor == nullptr)
    {
        if (auto* inner = processor.getEngineForEditor())
        {
            if (inner->hasEditor())
            {
                originalEditor.reset (inner->createEditorIfNeeded());
                if (originalEditor != nullptr)
                {
                    addAndMakeVisible (originalEditor.get());
                    statusLabel.setVisible (false);
                    originalEditor->addComponentListener (this);
                    const auto pref = originalEditor->getBounds();
                    // The original AU has its own corner drag-resizer. Let its editor
                    // drive this wrapper's size instead of leaving empty blue space.
                    setSize (juce::jlimit (800, 1800, juce::jmax (1520, pref.getWidth() + 80)),
                             juce::jlimit (600, 1160, juce::jmax (1000, pref.getHeight() + 40)));
                    resized();
                }
            }
        }
    }
}

void PedalLegendsBridgeEditor::paint (juce::Graphics& g)
{
    // The original editor owns the entire visible surface. Never draw a blue wrapper.
    g.fillAll (juce::Colour (0xffede4d0));
}

void PedalLegendsBridgeEditor::componentMovedOrResized (juce::Component& component,
                                                       bool /*wasMoved*/, bool wasResized)
{
    if (! wasResized || &component != originalEditor.get() || updatingChildLayout)
        return;

    // Resize requests originate from the original pedalboard's bottom-right handle.
    // Coalesce rapid drag events; never resize the AU from inside this callback.
    const int childW = originalEditor->getWidth();
    const int childH = originalEditor->getHeight();
    if (childW < 320 || childH < 240)
        return;

    pendingWidth = childW;
    pendingHeight = childH;
    triggerAsyncUpdate();
}

void PedalLegendsBridgeEditor::handleAsyncUpdate()
{
    if (originalEditor == nullptr || pendingWidth <= 0 || pendingHeight <= 0)
        return;

    const int targetW = juce::jlimit (400, 2400, pendingWidth);
    const int targetH = juce::jlimit (320, 1800, pendingHeight);
    if (targetW != getWidth() || targetH != getHeight())
        setSize (targetW, targetH);
}

void PedalLegendsBridgeEditor::resized()
{
    juce::ScopedValueSetter<bool> guard (updatingChildLayout, true);
    // No border, header or footer: the pedalboard exactly fills the host window.
    statusLabel.setBounds (getLocalBounds().reduced (18));
    if (originalEditor != nullptr)
        originalEditor->setBounds (getLocalBounds());
}
