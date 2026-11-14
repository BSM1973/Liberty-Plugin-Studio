#include "PluginEditor.h"

PedalLegendsBridgeEditor::PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    statusLabel.setJustificationType (juce::Justification::centred);
    statusLabel.setColour (juce::Label::textColourId, juce::Colours::white);
    statusLabel.setFont (juce::Font (juce::FontOptions ("Arial", 15.0f, juce::Font::plain)));
    addAndMakeVisible (statusLabel);
    setResizable (false, false);
    setSize (1100, 720);
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
                    originalEditor->addComponentListener (this);
                    const auto pref = originalEditor->getBounds();
                    // The original AU has its own corner drag-resizer. Let its editor
                    // drive this wrapper's size instead of leaving empty blue space.
                    setSize (juce::jmax (640, pref.getWidth() + 20),
                             juce::jmax (480, pref.getHeight() + 86));
                    resized();
                }
            }
        }
    }
}

void PedalLegendsBridgeEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff15283d));
    g.setColour (juce::Colour (0xffd5af72));
    g.setFont (juce::Font (juce::FontOptions (17.0f, juce::Font::bold)));
    g.drawFittedText ("LIBERTY MUSIC SOFTWARE - PEDAL LEGENDS", 18, 4, getWidth() - 36, 28,
                      juce::Justification::centredLeft, 1);
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

    pendingWidth = childW + 20;
    pendingHeight = childH + 86;
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
    auto area = getLocalBounds().reduced (10);
    area.removeFromTop (30);
    auto footer = area.removeFromBottom (36);
    statusLabel.setBounds (footer);
    if (originalEditor != nullptr)
        originalEditor->setBounds (area);
}
