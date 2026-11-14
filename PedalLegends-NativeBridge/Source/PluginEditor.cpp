#include "PluginEditor.h"

PedalLegendsBridgeEditor::PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    statusLabel.setJustificationType (juce::Justification::centred);
    statusLabel.setColour (juce::Label::textColourId, juce::Colours::black);
    statusLabel.setFont (juce::Font (juce::FontOptions ("Arial", 15.0f, juce::Font::plain)));
    addAndMakeVisible (statusLabel);
    routingTitle.setText ("ROUTAGE", juce::dontSendNotification);
    routingTitle.setColour (juce::Label::textColourId, juce::Colour (0xff23382b));
    routingTitle.setFont (juce::Font (juce::FontOptions (12.0f, juce::Font::bold)));
    addAndMakeVisible (routingTitle);

    routingSelector.addItem (juce::String::fromUTF8 (u8"SÉRIE"), 1);
    routingSelector.addItem (juce::String::fromUTF8 (u8"PARALLÈLE : DIRECT + EFFETS"), 2);
    routingSelector.setColour (juce::ComboBox::backgroundColourId, juce::Colour (0xfff4ead4));
    routingSelector.setColour (juce::ComboBox::textColourId, juce::Colour (0xff1c3225));
    routingSelector.setColour (juce::ComboBox::outlineColourId, juce::Colour (0xff9c865f));
    routingSelector.setSelectedId (1, juce::dontSendNotification);
    routingSelector.onChange = [this]
    {
        processor.getRoutingMode().setValueNotifyingHost (
            routingSelector.getSelectedId() == 2 ? 1.0f : 0.0f);
    };
    addAndMakeVisible (routingSelector);

    blendTitle.setText (juce::String::fromUTF8 (u8"DOSAGE EFFET"), juce::dontSendNotification);
    blendTitle.setColour (juce::Label::textColourId, juce::Colour (0xff23382b));
    blendTitle.setFont (juce::Font (juce::FontOptions (12.0f, juce::Font::bold)));
    addAndMakeVisible (blendTitle);

    blendSlider.setSliderStyle (juce::Slider::LinearHorizontal);
    blendSlider.setRange (0.0, 100.0, 1.0);
    blendSlider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 54, 24);
    blendSlider.setTextValueSuffix (" %");
    blendSlider.setColour (juce::Slider::thumbColourId, juce::Colour (0xffb18549));
    blendSlider.setColour (juce::Slider::trackColourId, juce::Colour (0xff33583d));
    blendSlider.setValue (50.0, juce::dontSendNotification);
    blendSlider.onValueChange = [this]
    {
        processor.getParallelBlend().setValueNotifyingHost ((float) blendSlider.getValue() / 100.0f);
    };
    addAndMakeVisible (blendSlider);

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
    const int mode = processor.getRoutingMode().getIndex();
    routingSelector.setSelectedId (mode + 1, juce::dontSendNotification);
    blendSlider.setValue ((double) processor.getParallelBlend().get() * 100.0,
                          juce::dontSendNotification);
    blendSlider.setEnabled (mode == 1);
    blendTitle.setEnabled (mode == 1);
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
                    setSize (juce::jlimit (800, 1800, juce::jmax (1520, pref.getWidth())),
                             juce::jlimit (600, 1160, juce::jmax (1000, pref.getHeight() + 44)));
                    resized();
                }
            }
        }
    }
}

void PedalLegendsBridgeEditor::paint (juce::Graphics& g)
{
    // Neutral cream toolbar and original pedalboard. No blue exterior.
    g.fillAll (juce::Colour (0xffede4d0));
    g.setColour (juce::Colour (0xffe2d4b9));
    g.fillRect (0, 0, getWidth(), 43);
    g.setColour (juce::Colour (0xffbda681));
    g.drawHorizontalLine (42, 0.0f, (float) getWidth());
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
    pendingHeight = childH + 44;
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
    // Only a thin cream router bar; original pedalboard fills all space below.
    auto area = getLocalBounds();
    auto toolbar = area.removeFromTop (44);
    toolbar.removeFromLeft (14);
    routingTitle.setBounds (toolbar.removeFromLeft (78));
    routingSelector.setBounds (toolbar.removeFromLeft (255).reduced (2, 7));
    toolbar.removeFromLeft (16);
    blendTitle.setBounds (toolbar.removeFromLeft (122));
    blendSlider.setBounds (toolbar.removeFromLeft (242).reduced (0, 4));
    statusLabel.setBounds (area.reduced (18));
    if (originalEditor != nullptr)
        originalEditor->setBounds (area);
}
