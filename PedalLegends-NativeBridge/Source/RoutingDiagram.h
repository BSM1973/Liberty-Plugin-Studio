#pragma once
#include <JuceHeader.h>
#include <array>

// A literal signal-flow diagram drawn in the native routing header.
// It uses the same mode and stage assignments as the processing engine.
// Crucially: no imaginary cable connections over the fixed 4x2 pedal grid.
class PedalLegendsRoutingDiagram final : public juce::Component
{
public:
    PedalLegendsRoutingDiagram()
    {
        setOpaque (false);
        setInterceptsMouseClicks (false, false);
    }

    void setRouting (int modeToShow, bool engineReady, bool isUnavailable,
                     const std::array<int, 8>& assignments)
    {
        if (mode == modeToShow && ready == engineReady && unavailable == isUnavailable
            && lanes == assignments)
            return;
        mode = modeToShow;
        ready = engineReady;
        unavailable = isUnavailable;
        lanes = assignments;
        repaint();
    }

    void paint (juce::Graphics& g) override
    {
        auto bounds = getLocalBounds().toFloat().reduced (1.0f);
        if (bounds.getWidth() < 450.0f || bounds.getHeight() < 65.0f)
            return;

        const auto cream = juce::Colour (0xfff5ecd8);
        const auto border = juce::Colour (0xffbba27a);
        const auto ink = juce::Colour (0xff293c2e);
        const auto colourA = juce::Colour (0xff3b684b);
        const auto colourB = juce::Colour (0xffa47641);
        const auto disabledColour = juce::Colour (0xff8b8579);

        g.setColour (cream);
        g.fillRoundedRectangle (bounds, 10.0f);
        g.setColour (border);
        g.drawRoundedRectangle (bounds, 10.0f, 1.0f);

        const float w = bounds.getWidth();
        const float cx = bounds.getX();
        const float cy = bounds.getY() + bounds.getHeight() / 2.0f;
        // Compact native header: maximize separation between A and B
        // rather than allowing their 25px stage chips to overlap.
        const float yA = bounds.getY() + 18.0f;
        const float yB = bounds.getBottom() - 18.0f;
        const float xSplit = cx + 95.0f;
        const float xJoin = bounds.getRight() - 103.0f;
        const float xRailStart = xSplit + 88.0f;
        const float xRailEnd = xJoin - 82.0f;

        const auto drawLabel = [&] (const juce::String& text, juce::Rectangle<float> r,
                                   const juce::Colour& colour, float size)
        {
            g.setColour (colour);
            g.setFont (juce::Font (juce::FontOptions ("Arial", size, juce::Font::bold)));
            g.drawFittedText (text, r.toNearestInt(), juce::Justification::centred, 1);
        };
        const auto drawNode = [&] (const juce::String& text, float x, float y, bool highlighted)
        {
            const juce::Rectangle<float> rect (x - 32.0f, y - 13.0f, 64.0f, 26.0f);
            g.setColour (highlighted ? ink : juce::Colour (0xff776e5d));
            g.fillRoundedRectangle (rect, 6.0f);
            drawLabel (text, rect, cream, 10.0f);
        };
        const auto drawLane = [&] (const juce::String& label, float y,
                                  const juce::Colour& tint, int selectedLane, bool useStages)
        {
            g.setColour (tint.withAlpha (0.9f));
            g.drawLine (xRailStart, y, xRailEnd, y, 2.7f);
            drawLabel (label, { xSplit + 6.0f, y - 12.0f, 76.0f, 24.0f }, tint, 12.0f);

            if (! useStages)
            {
                const juce::Rectangle<float> r ((xRailStart + xRailEnd) / 2.0f - 36.0f,
                                                y - 11.0f, 72.0f, 22.0f);
                g.setColour (tint);
                g.fillRoundedRectangle (r, 5.0f);
                drawLabel ("DIRECT", r, juce::Colours::white, 10.0f);
                return;
            }

            std::array<int, 8> stages {};
            int count = 0;
            for (int i = 0; i < 8; ++i)
                if (selectedLane == -1 || lanes[(size_t) i] == selectedLane)
                    stages[(size_t) count++] = i + 1;

            if (count == 0)
            {
                drawLabel ("SANS PÉDALE",
                           { (xRailStart + xRailEnd) / 2.0f - 53.0f, y - 12.0f, 106.0f, 24.0f },
                           disabledColour, 10.0f);
                return;
            }

            const float usable = xRailEnd - xRailStart;
            const float interval = usable / (float) (count + 1);
            const float chipWidth = juce::jmin (41.0f, interval * 0.58f);
            for (int i = 0; i < count; ++i)
            {
                const float x = xRailStart + (float) (i + 1) * interval;
                const juce::Rectangle<float> chip (x - chipWidth / 2.0f, y - 12.5f,
                                                   chipWidth, 25.0f);
                g.setColour (tint);
                g.fillRoundedRectangle (chip, 6.0f);
                g.setColour (cream.withAlpha (0.65f));
                g.drawRoundedRectangle (chip, 6.0f, 0.9f);
                drawLabel (juce::String (stages[(size_t) i]), chip, cream, 12.0f);
            }
        };

        drawNode (juce::String::fromUTF8 (u8"ENTRÉE"), cx + 49.0f, cy, true);
        drawNode ("SORTIE", bounds.getRight() - 49.0f, cy, true);

        // These two joints describe the real DSP topology, not physical
        // positions of pedal widgets on the original 4x2 canvas.
        g.setColour (ink.withAlpha (0.8f));
        g.drawLine (cx + 81.0f, cy, xSplit, cy, 2.3f);
        g.drawLine (xJoin, cy, bounds.getRight() - 81.0f, cy, 2.3f);

        if (mode == 0)
        {
            g.drawLine (xSplit, cy, xJoin, cy, 2.6f);
            drawLane ("", cy, colourA, -1, true);
        }
        else
        {
            const auto laneColourA = (mode == 2 && ! ready)
                                        ? disabledColour : colourA;
            const auto laneColourB = (mode == 2 && ! ready)
                                        ? disabledColour : colourB;
            // Simple, non-crossing Y split and Y merge, one line per branch.
            g.setColour (laneColourA);
            g.drawLine (xSplit, cy, xRailStart, yA, 2.5f);
            g.drawLine (xRailEnd, yA, xJoin, cy, 2.5f);
            g.setColour (laneColourB);
            g.drawLine (xSplit, cy, xRailStart, yB, 2.5f);
            g.drawLine (xRailEnd, yB, xJoin, cy, 2.5f);

            if (mode == 1)
            {
                drawLane ("DIRECT", yA, colourA, -1, false);
                drawLane ("EFFETS", yB, colourB, -1, true);
            }
            else
            {
                drawLane ("A", yA, laneColourA, 0, true);
                drawLane ("B", yB, laneColourB, 1, true);
            }
        }

        // Prominent guardrail: the diagram must never suggest two running
        // pedal engines when the original AU cannot initialize them.
        if (mode == 2 && ! ready)
        {
            juce::Rectangle<float> message (bounds.getCentreX() - 166.0f,
                                             bounds.getCentreY() - 11.0f,
                                             332.0f, 22.0f);
            g.setColour (unavailable ? juce::Colour (0xff943d37)
                                     : juce::Colour (0xff8b6d41));
            g.fillRoundedRectangle (message, 5.0f);
            drawLabel (unavailable ? "SPLIT INDISPONIBLE - SON EN SÉRIE"
                                   : "INITIALISATION DES DEUX BRANCHES",
                       message, cream, 10.0f);
        }
    }

private:
    int mode = 0;
    bool ready = false;
    bool unavailable = false;
    std::array<int, 8> lanes { 0,0,0,0,1,1,1,1 };
};
