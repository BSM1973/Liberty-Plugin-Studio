#include "PluginEditor.h"
#if JUCE_MAC
#include "NativeWebRouting.h"
#endif

namespace
{
    const juce::Colour ink (0xff23362a);
    const juce::Colour olive (0xff294735);
    const juce::Colour copper (0xffb78e55);
    const juce::Colour ivory (0xfff3ead5);
    const juce::Colour border (0xffa78e67);
    constexpr int routingHeaderHeight = 134;
}

PedalLegendsBridgeEditor::PedalLegendsBridgeEditor (PedalLegendsBridgeProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    statusLabel.setJustificationType (juce::Justification::centred);
    statusLabel.setColour (juce::Label::textColourId, ink);
    statusLabel.setFont (juce::Font (juce::FontOptions ("Arial", 15.0f, juce::Font::plain)));
    addAndMakeVisible (statusLabel);

    const juce::StringArray modes {
        juce::String::fromUTF8 (u8"SÉRIE"),
        "DIRECT + EFFETS",
        "SPLIT A/B"
    };
    for (int i = 0; i < 3; ++i)
    {
        auto& button = modeButtons[(size_t) i];
        button.setButtonText (modes[i]);
        button.setLookAndFeel (&routingTheme);
        button.setTooltip (i == 0 ? "Huit effets dans l'ordre original" :
                           i == 1 ? "Signal direct et effets, en parallèle" :
                                    "Deux chaînes de pédales distinctes, A et B, réunies à la sortie");
        button.onClick = [this, i]
        {
            // JUCE choice normalized values: 0, 0.5 and 1.
            processor.getRoutingMode().setValueNotifyingHost ((float) i / 2.0f);
            if (i == 2) processor.ensureSplitEngines();
            syncRoutingControls();
        };
        button.setColour (juce::TextButton::textColourOffId, ivory);
        addAndMakeVisible (button);
    }

    blendTitle.setText ("DOSAGE / BALANCE", juce::dontSendNotification);
    blendTitle.setFont (juce::Font (juce::FontOptions ("Arial", 10.0f, juce::Font::bold)));
    blendTitle.setColour (juce::Label::textColourId, ink);
    blendTitle.setJustificationType (juce::Justification::centredLeft);
    addAndMakeVisible (blendTitle);

    blendSlider.setSliderStyle (juce::Slider::LinearHorizontal);
    blendSlider.setRange (0.0, 100.0, 1.0);
    blendSlider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 52, 25);
    blendSlider.setTextValueSuffix (" %");
    blendSlider.setColour (juce::Slider::backgroundColourId, juce::Colour (0xffc6b89d));
    blendSlider.setColour (juce::Slider::trackColourId, olive);
    blendSlider.setColour (juce::Slider::thumbColourId, copper);
    blendSlider.setColour (juce::Slider::textBoxTextColourId, ink);
    blendSlider.setColour (juce::Slider::textBoxOutlineColourId, border);
    blendSlider.onValueChange = [this]
    {
        processor.getParallelBlend().setValueNotifyingHost ((float) blendSlider.getValue() / 100.0f);
    };
    addAndMakeVisible (blendSlider);

    for (int i = 0; i < 8; ++i)
    {
        auto& button = stageLaneButtons[(size_t) i];
        button.setLookAndFeel (&routingTheme);
        button.setTooltip ("Pédale " + juce::String (i + 1) + ": choisir son chemin A ou B");
        button.setColour (juce::TextButton::textColourOffId, ivory);
        button.onClick = [this, i]
        {
            auto& lane = processor.getStageLane (i);
            lane.setValueNotifyingHost (lane.getIndex() == 0 ? 1.0f : 0.0f);
            syncRoutingControls();
        };
        addAndMakeVisible (button);
    }

    routingStatus.setColour (juce::Label::textColourId, ink);
    routingStatus.setFont (juce::Font (juce::FontOptions ("Arial", 10.0f, juce::Font::bold)));
    routingStatus.setJustificationType (juce::Justification::centredLeft);
    addAndMakeVisible (routingStatus);

    // Routing schema remains in the visible native header, not underneath
    // the original AU's opaque WebView.
    addAndMakeVisible (routingDiagram);

    // The original pedalboard is 1440x960. The premium header is added
    // above it, not drawn over its controls.
    setResizable (false, false);
    setSize (1040, 827);
    syncRoutingControls();
    startTimerHz (8);
}

PedalLegendsBridgeEditor::~PedalLegendsBridgeEditor()
{
    stopTimer();
    cancelPendingUpdate();
    if (originalEditor != nullptr)
        originalEditor->removeComponentListener (this);
    originalEditor.reset();
    for (auto& button : modeButtons) button.setLookAndFeel (nullptr);
    for (auto& button : stageLaneButtons) button.setLookAndFeel (nullptr);
}

void PedalLegendsBridgeEditor::syncRoutingControls()
{
    const int mode = processor.getRoutingMode().getIndex();
    for (int i = 0; i < 3; ++i)
    {
        auto& b = modeButtons[(size_t) i];
        const bool selected = mode == i;
        b.setColour (juce::TextButton::buttonColourId,
                     selected ? olive : juce::Colour (0xff857d64));
        b.setColour (juce::TextButton::buttonOnColourId,
                     selected ? olive : juce::Colour (0xff857d64));
        b.setColour (juce::TextButton::textColourOffId, selected ? ivory : juce::Colour (0xfffcf2df));
    }

    blendSlider.setEnabled (mode != 0);
    blendTitle.setEnabled (mode != 0);
    blendTitle.setText (mode == 2 ? "BALANCE A / B" : "DIRECT / EFFETS",
                        juce::dontSendNotification);
    blendSlider.setValue ((double) processor.getParallelBlend().get() * 100.0,
                          juce::dontSendNotification);

    std::array<int, 8> lanes {};
    for (int i = 0; i < 8; ++i)
    {
        auto& button = stageLaneButtons[(size_t) i];
        const int lane = processor.getStageLane (i).getIndex();
        lanes[(size_t) i] = lane;
        button.setButtonText (juce::String (i + 1) + "  " + (lane ? "B" : "A"));
        button.setColour (juce::TextButton::buttonColourId, lane ? copper : olive);
        button.setVisible (mode == 2);
    }

    if (mode == 2)
    {
        const bool ready = processor.isTwoBranchReady();
        const bool unavailable = processor.isSplitUnavailable();
        routingStatus.setText (unavailable ? "SPLIT INDISPONIBLE - MODE SERIE DE SECOURS" :
                               ready ? "DEUX CHEMINS ACTIFS | FUSION VERS SORTIE" :
                                       "INITIALISATION DES DEUX CHEMINS...",
                               juce::dontSendNotification);
        routingStatus.setColour (juce::Label::textColourId,
                                 unavailable ? juce::Colour (0xffa23435) : ink);
        // The original WKWebView is a native child surface. JUCE overlay
        // graphics may be hidden underneath it; use the actual SVG instead.
        routingDiagram.setRouting (mode, ready, unavailable, lanes);
    }
    else
    {
        routingStatus.setText (mode == 0 ? "CHAINE SERIE D'ORIGINE" :
                                          "SIGNAL DIRECT + CHAINE D'EFFETS",
                               juce::dontSendNotification);
        routingStatus.setColour (juce::Label::textColourId, ink);
        routingDiagram.setRouting (mode, processor.isTwoBranchReady(),
                                   processor.isSplitUnavailable(), lanes);
    }
#if JUCE_MAC
    if (originalEditor != nullptr)
        lmsPushWebRouting (*originalEditor, processor, mode, processor.isTwoBranchReady(), lanes);
#endif
}

void PedalLegendsBridgeEditor::timerCallback()
{
    statusLabel.setText (processor.getStatus(), juce::dontSendNotification);
    syncRoutingControls();
    if (originalEditor != nullptr)
        return;

    if (auto* inner = processor.getEngineForEditor())
    {
        if (inner->hasEditor())
        {
            originalEditor.reset (inner->createEditorIfNeeded());
            if (originalEditor != nullptr)
            {
                addAndMakeVisible (originalEditor.get());
                originalEditor->addComponentListener (this);
                statusLabel.setVisible (false);
                routingDiagram.toFront (false);
                // Do not allow the hosted AU's advertised preferred dimensions
                // to enlarge the JUCE host. This was introduced with Split.
                // The original WebView receives exactly the area below the header.
                resized();
            }
        }
    }
}

void PedalLegendsBridgeEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xffede5d3));
    juce::Rectangle<float> bar (10.0f, 7.0f, (float) getWidth() - 20.0f,
                                (float) routingHeaderHeight - 14.0f);

    g.setGradientFill (juce::ColourGradient (juce::Colour (0xfff9f0db), bar.getX(), bar.getY(),
                                             juce::Colour (0xffd4c4a3), bar.getX(), bar.getBottom(),
                                             false));
    g.fillRoundedRectangle (bar, 14.0f);
    g.setColour (border);
    g.drawRoundedRectangle (bar, 14.0f, 1.3f);

    g.setColour (olive);
    g.fillRoundedRectangle (12.0f, 10.0f, 178.0f, 49.0f, 9.0f);
    g.setColour (ivory);
    g.setFont (juce::Font (juce::FontOptions ("Arial", 11.0f, juce::Font::bold)));
    g.drawFittedText ("LIBERTY", 23, 12, 155, 17, juce::Justification::centredLeft, 1);
    g.setFont (juce::Font (juce::FontOptions ("Arial", 16.0f, juce::Font::bold)));
    g.drawFittedText ("ROUTAGE AUDIO", 23, 31, 161, 22, juce::Justification::centredLeft, 1);

    g.setColour (juce::Colour (0xff877356));
    g.setFont (juce::Font (juce::FontOptions ("Arial", 9.5f, juce::Font::bold)));
    g.drawFittedText ("MODE DE SIGNAL", 205, 3, 260, 16,
                      juce::Justification::centredLeft, 1);
    g.drawFittedText ("A / B", 495, 45, 47, 17,
                      juce::Justification::centredLeft, 1);
    g.setColour (juce::Colour (0xffb59360));
    g.drawHorizontalLine (64, 14.0f, (float) getWidth() - 14.0f);
}

void PedalLegendsBridgeEditor::componentMovedOrResized (juce::Component&, bool, bool)
{
    // The original AU editor's internal drag handle must never resize the
    // containing DAW window. Its native sizing is independent of this host.
}

void PedalLegendsBridgeEditor::handleAsyncUpdate()
{
    // No second, asynchronous resizing pass after the AU appears.
}

void PedalLegendsBridgeEditor::resized()
{
    juce::ScopedValueSetter<bool> guard (updatingChildLayout, true);
    const auto full = getLocalBounds();
    auto board = full;
    board.removeFromTop (routingHeaderHeight);

    // 134-point native router; no overlay and no resize feedback into AU.
    int buttonX = 205;
    const int modeWidths[] = { 76, 123, 108 };
    for (int i = 0; i < 3; ++i)
    {
        modeButtons[(size_t) i].setBounds (buttonX, 21, modeWidths[i], 28);
        buttonX += modeWidths[i] + 6;
    }

    blendTitle.setBounds (555, 3, 188, 16);
    blendSlider.setBounds (555, 19, 245, 29);

    for (int i = 0; i < 8; ++i)
        stageLaneButtons[(size_t) i].setBounds (544 + 56 * i, 45, 52, 20);
    routingStatus.setBounds (805, 2, juce::jmax (0, getWidth() - 816), 17);

    statusLabel.setBounds (board.reduced (25));
    if (originalEditor != nullptr)
        originalEditor->setBounds (board);
    routingDiagram.setBounds (10, 65, juce::jmax (0, getWidth() - 20), 68);
    routingDiagram.toFront (false);
}
