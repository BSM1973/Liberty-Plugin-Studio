#pragma once

#include <JuceHeader.h>
#include <array>

// Non-interactive native overlay. It mirrors the SAME eight A/B parameters
// that the DSP reads and never modifies the hosted Audio Unit or its WebView.
// Transparent to all mouse/keyboard activity on the eight original pedals.
class PedalLegendsSplitGraphic final : public juce::Component
{
public:
    PedalLegendsSplitGraphic()
    {
        setInterceptsMouseClicks (false, false);
        setOpaque (false);
        lanes.fill (0);
    }

    void setRouting (bool shouldShow, bool isAudioReady,
                     const std::array<int, 8>& assignments)
    {
        if (visible == shouldShow && ready == isAudioReady && lanes == assignments)
            return;
        visible = shouldShow;
        ready = isAudioReady;
        lanes = assignments;
        setVisible (visible);
        repaint();
    }

    void paint (juce::Graphics& g) override
    {
        if (! visible || getWidth() <= 0 || getHeight() <= 0)
            return;

        // Exact reference coordinates of the original fixed 1440 x 960 board:
        // .liberty-header 119px; .touring-board margin-top 14px, padding
        // top 17px; .board-heading 35px; .pedal-grid 4 x 2, 292px high.
        juce::Graphics::ScopedSaveState state (g);
        g.addTransform (juce::AffineTransform::scale ((float) getWidth() / 1440.0f,
                                                      (float) getHeight() / 960.0f));
        const juce::Colour aColour (0xff9ed2a2);
        const juce::Colour bColour (0xfff0bd70);
        const float gridX = 55.0f;
        const float cellWidth = 314.5f;
        const float gapX = 24.0f;
        const float cellHeight = 292.0f;
        const float gapY = 21.0f;
        const float firstY = 185.0f;

        std::array<juce::Rectangle<float>, 8> rects;
        for (int i = 0; i < 8; ++i)
        {
            const int col = i % 4, row = i / 4;
            rects[(size_t) i] = {
                gridX + col * (cellWidth + gapX),
                firstY + row * (cellHeight + gapY),
                cellWidth, cellHeight
            };
        }

        // Two clear parallel patch rails in unused areas of the board.
        // Their small connections are visually linked to the pedal outlines.
        const float topRailY = 179.0f;
        const float midRailY = 491.0f;
        g.setColour (aColour.withAlpha (ready ? 0.75f : 0.35f));
        g.drawLine (58.0f, topRailY, 1386.0f, topRailY, 2.0f);
        g.setColour (bColour.withAlpha (ready ? 0.75f : 0.35f));
        g.drawLine (58.0f, midRailY, 1386.0f, midRailY, 2.0f);

        for (int i = 0; i < 8; ++i)
        {
            const auto r = rects[(size_t) i].reduced (3.0f);
            const bool laneB = lanes[(size_t) i] != 0;
            const auto colour = laneB ? bColour : aColour;
            // The 2-pixel outline shows assignment without obscuring knobs
            // or the pedal graphic. The tinted corner is a lane identifier.
            g.setColour (colour.withAlpha (ready ? 0.94f : 0.40f));
            g.drawRoundedRectangle (r, 12.0f, 2.3f);

            juce::Rectangle<float> badge (r.getRight() - 44.0f, r.getBottom() - 37.0f,
                                          35.0f, 24.0f);
            g.setColour (juce::Colour (0xff15271c).withAlpha (0.94f));
            g.fillRoundedRectangle (badge, 6.0f);
            g.setColour (colour);
            g.drawRoundedRectangle (badge, 6.0f, 1.5f);
            g.setFont (juce::Font (juce::FontOptions ("Arial", 12.0f, juce::Font::bold)));
            g.drawText (laneB ? "B" : "A", badge.toNearestInt(),
                        juce::Justification::centred, false);

            // A short cable lead in the slot margin; no line crosses
            // the pedal control surface or blocks pointer events.
            const float connectorX = r.getCentreX();
            if (i < 4)
            {
                g.drawLine (connectorX, topRailY, connectorX, r.getY(), 2.2f);
                g.fillEllipse (connectorX - 3.0f, topRailY - 3.0f, 6.0f, 6.0f);
            }
            else
            {
                g.drawLine (connectorX, midRailY, connectorX, r.getY(), 2.2f);
                g.fillEllipse (connectorX - 3.0f, midRailY - 3.0f, 6.0f, 6.0f);
            }
        }

        g.setFont (juce::Font (juce::FontOptions ("Arial", 10.0f, juce::Font::bold)));
        g.setColour (aColour);
        g.drawFittedText ("CHEMIN A", 59, 156, 110, 18, juce::Justification::centredLeft, 1);
        g.setColour (bColour);
        g.drawFittedText ("CHEMIN B", 59, 471, 110, 18, juce::Justification::centredLeft, 1);
        if (! ready)
        {
            g.setColour (juce::Colour (0xfff3e5cd));
            g.setFont (juce::Font (juce::FontOptions ("Arial", 10.0f, juce::Font::bold)));
            g.drawFittedText ("SPLIT : VERIFICATION DU MOTEUR", 550, 469, 390, 18,
                              juce::Justification::centred, 1);
        }
    }

private:
    std::array<int, 8> lanes {};
    bool visible = false;
    bool ready = false;
};
