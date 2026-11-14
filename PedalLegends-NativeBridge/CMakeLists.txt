cmake_minimum_required(VERSION 3.22)
project(LibertyPedalLegendsBridge VERSION 0.1.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (NOT APPLE)
  message(FATAL_ERROR "Pedal Legends Bridge : compilation macOS uniquement, car le moteur d'origine est un Audio Unit.")
endif()

if (NOT DEFINED JUCE_DIR OR NOT EXISTS "${JUCE_DIR}/CMakeLists.txt")
  message(FATAL_ERROR "Préciser -DJUCE_DIR=/chemin/vers/JUCE (JUCE 8.0.10).")
endif()

add_subdirectory("${JUCE_DIR}" JUCE)

juce_add_plugin(PedalLegendsBridge
  COMPANY_NAME "Liberty Music Software"
  BUNDLE_ID "com.libertymusicsoftware.pedallegends.bridge"
  PLUGIN_MANUFACTURER_CODE LbMS
  PLUGIN_CODE PdLg
  FORMATS AU VST3
  PRODUCT_NAME "Pedal Legends"
  DESCRIPTION "Liberty Pedal Legends - native bridge for original Pedal Legends AU"
  IS_SYNTH FALSE
  NEEDS_MIDI_INPUT TRUE
  NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE
  PLUGINHOST_AU TRUE
  COPY_PLUGIN_AFTER_BUILD FALSE
)

juce_generate_juce_header(PedalLegendsBridge)

target_sources(PedalLegendsBridge PRIVATE
  Source/PluginProcessor.cpp
  Source/PluginEditor.cpp
)
target_compile_definitions(PedalLegendsBridge PUBLIC
  JUCE_WEB_BROWSER=0
  JUCE_USE_CURL=0
  JUCE_VST3_CAN_REPLACE_VST2=0
)
target_link_libraries(PedalLegendsBridge PRIVATE
  juce::juce_audio_utils
  juce::juce_audio_processors
  juce::juce_gui_extra
  juce::juce_recommended_config_flags
  juce::juce_recommended_warning_flags
)
