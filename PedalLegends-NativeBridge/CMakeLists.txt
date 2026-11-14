cmake_minimum_required(VERSION 3.22)
project(LibertyPedalLegendsBridge VERSION 0.2.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (APPLE)
  set(LMS_PLUGIN_FORMATS AU VST3)
  set(LMS_HOST_AU TRUE)
elseif (WIN32)
  # Windows build is currently the portable JUCE VST3 front-end only.
  # The original PluginMaker AU DSP has no Windows version: do not release
  # this target as a functional 40-pedal audio product until DSP is ported.
  set(LMS_PLUGIN_FORMATS VST3)
  set(LMS_HOST_AU FALSE)
else()
  message(FATAL_ERROR "Pedal Legends : macOS ou Windows requis.")
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
  FORMATS ${LMS_PLUGIN_FORMATS}
  PRODUCT_NAME "Pedal Legends"
  DESCRIPTION "Pedal Legends JUCE native - original AU host on macOS, Windows DSP pending"
  IS_SYNTH FALSE
  NEEDS_MIDI_INPUT FALSE
  NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE
  PLUGINHOST_AU ${LMS_HOST_AU}
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
