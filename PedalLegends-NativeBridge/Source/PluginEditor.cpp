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
    routingSelector.addItem (juce::String::fromUTF8 (u8"SPLIT : 2 CHEMINS A / B"), 3);
    routingSelector.setColour (juce::ComboBox::backgroundColourId, juce::Colour (0xfff4ead4));
    routingSelector.setColour (juce::ComboBox::textColourId, juce::Colour (0xff1c3225));
    routingSelector.setColour (juce::ComboBox::outlineColourId, juce::Colour (0xff9c865f));
    routingSelector.setSelectedId (1, juce::dontSendNotification);
    routingSelector.onChange = [this]
    {
        const int index = juce::jlimit (0, 2, routingSelector.getSelectedId() - 1);
        processor.getRoutingMode().setValueNotifyingHost ((float) index / 2.0f);
        if (index == 2) processor.ensureSplitEngines();
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

    for (int i = 0; i < 8; ++i)
    {
        auto& button = stageLaneButtons[(size_t) i];
        button.setTooltip ("Étape " + juce::String (i + 1) + " : affecter la pédale à A ou B");
        button.setColour (juce::TextButton::buttonColourId, juce::Colour (0xff33543a));
        button.setColour (juce::TextButton::textColourOffId, juce::Colour (0xfff8ecd1));
        button.onClick = [this, i]
        {
            auto& param = processor.getStageLane (i);
            param.setValueNotifyingHost (param.getIndex() == 0 ? 1.0f : 0.0f);
        };
        addAndMakeVisible (button);
        button.setVisible (false);
    }
    splitDiagram.setText ("SPLIT  →  A / B  →  SORTIE", juce::dontSendNotification);
    splitDiagram.setFont (juce::Font (juce::FontOptions (11.0f, juce::Font::bold)));
    splitDiagram.setColour (juce::Label::textColourId, juce::Colour (0xff284632));
    addAndMakeVisible (splitDiagram);
    splitDiagram.setVisible (false);

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
    blendSlider.setEnabled (mode == 1 || mode == 2);
    blendTitle.setEnabled (mode == 1 || mode == 2);
    blendTitle.setText (mode == 2 ? "BALANCE A / B" : "DOSAGE EFFET",
                        juce::dontSendNotification);
    const bool controlsVisible = mode == 2 && getWidth() >= 1120;
    for (int i = 0; i < 8; ++i)
    {
        auto& button = stageLaneButtons[(size_t) i];
        const bool laneB = processor.getStageLane (i).getIndex() != 0;
        button.setButtonText (juce::String (i + 1) + ":" + (laneB ? "B" : "A"));
        button.setColour (juce::TextButton::buttonColourId,
                          laneB ? juce::Colour (0xff98764c) : juce::Colour (0xff33543a));
        button.setVisible (controlsVisible);
    }
    splitDiagram.setVisible (controlsVisible);
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
    blendSlider.setBounds (toolbar.removeFromLeft (215).reduced (0, 4));
    toolbar.removeFromLeft (10);
    const bool room = getWidth() >= 1120;
    for (int i = 0; i < 8; ++i)
    {
        auto& button = stageLaneButtons[(size_t) i];
        if (room) button.setBounds (toolbar.removeFromLeft (42).reduced (2, 7));
        else      button.setBounds ({});
    }
    if (room) splitDiagram.setBounds (toolbar.removeFromLeft (210).reduced (0, 9));
    else      splitDiagram.setBounds ({});
    statusLabel.setBounds (area.reduced (18));
    if (originalEditor != nullptr)
        originalEditor->setBounds (area);
}
