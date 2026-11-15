#pragma once
#include <JuceHeader.h>

// Custom premium routing/button finish, consistent with the 1970s-inspired
// cream, olive and copper physical pedalboard. Font rendering uses JUCE,
// never emoji or unsupported arrow glyphs.
class PedalLegendsRoutingTheme final : public juce::LookAndFeel_V4
{
public:
    void drawButtonBackground (juce::Graphics& g, juce::Button& button,
                               const juce::Colour& background, bool hovered,
                               bool pressed) override
    {
        auto r = button.getLocalBounds().toFloat().reduced (0.6f);
        const auto upper = pressed ? background.darker (0.13f) :
                           hovered ? background.brighter (0.18f) : background.brighter (0.075f);
        const auto lower = pressed ? background.darker (0.20f) : background.darker (0.15f);
        g.setGradientFill (juce::ColourGradient (upper, r.getCentreX(), r.getY(),
                                                 lower, r.getCentreX(), r.getBottom(),
                                                 false));
        g.fillRoundedRectangle (r, 7.0f);
        g.setColour (juce::Colour (0xffaa9874));
        g.drawRoundedRectangle (r, 7.0f, 1.1f);
        g.setColour (juce::Colours::white.withAlpha (hovered ? 0.26f : 0.15f));
        g.drawHorizontalLine ((int) (r.getY() + 2.0f),
                              r.getX() + 7.0f, r.getRight() - 7.0f);
    }

    void drawButtonText (juce::Graphics& g, juce::TextButton& button,
                         bool hovered, bool down) override
    {
        g.setFont (juce::Font (juce::FontOptions ("Arial", 12.0f, juce::Font::bold)));
        const auto text = button.findColour (juce::TextButton::textColourOffId);
        g.setColour (hovered ? text.brighter (0.10f) : text);
        g.drawFittedText (button.getButtonText(), button.getLocalBounds().reduced (5, 2),
                          juce::Justification::centred, 1);
    }
};
