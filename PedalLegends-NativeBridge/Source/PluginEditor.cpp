#include "PluginEditor.h"

PedalLegendsBridgeEditor::PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    statusLabel.setJustificationType (juce::Justification::centred);
    statusLabel.setColour (juce::Label::textColourId, juce::Colours::white);
    statusLabel.setFont (juce::Font (juce::FontOptions ("Arial", 15.0f, juce::Font::plain)));
    addAndMakeVisible (statusLabel);
    setSize (1100, 720);
    startTimerHz (5);
}

PedalLegendsBridgeEditor::~PedalLegendsBridgeEditor()
{
    stopTimer();
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
                    const auto pref = originalEditor->getBounds();
                    setSize (juce::jmax (940, pref.getWidth()), juce::jmax (650, pref.getHeight() + 42));
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
    g.drawFittedText ("LIBERTY MUSIC SOFTWARE · PEDAL LEGENDS", 18, 4, getWidth() - 36, 28,
                      juce::Justification::centredLeft, 1);
}

void PedalLegendsBridgeEditor::resized()
{
    auto area = getLocalBounds().reduced (10);
    area.removeFromTop (30);
    auto footer = area.removeFromBottom (36);
    statusLabel.setBounds (footer);
    if (originalEditor != nullptr)
        originalEditor->setBounds (area);
}
