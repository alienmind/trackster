# FUTURE IDEAS

This document contains a set of structured new feature ideas and concepts for expanding Trackster's capabilities beyond simple hardware mapping and sample management.

## Live MIDI Preview Feature (Circuit Tracks Specific)

### Overview
The "Live Preview" module is a Web MIDI-powered interface for the "Trackster" web application. It allows users to remotely control a connected Novation Circuit Tracks via USB. The UI provides a track selector (Synth 1-2, MIDI 1-2, Drum 1-4) and a 64-pad grid. Clicking a pad automatically sends the specific MIDI protocol sequence to load that preset/sample on the hardware and immediately trigger a sound, simulating a physical pad press on the device.

### Overview: Canvas & Overview Improvements

* **Automatic Optimization of Cabling**: Suggest reconnecting things in a different way via an "Optimize" button in the overview to clean up the physical routing diagram.
* **MIDI Channels Sidebar**: Render a table on a new right collapsible navbar displaying the assigned MIDI channels for each device on the canvas.

### Overview: Add new gear! (LLM assisted)
This feature would allow users to easily add new hardware synthesizers to the application. 
* With one LLM we will receive a description of the device
* An image of the gear will be added - LLM will generate an SVG optionally, but the image can still be used
* LLM would also generate a set of cable routings for the new gear as a default
* It will be added to the catalogue of available units

### General: More Device Specific Features for my Gear

Draft: Expand the application to interface directly with other hardware synthesizers specific features.
* **Roland S-1**: Patch management, logical CC mapping control from the browser, and backup handling.
* **Arturia MiniFreak**: Librarian features, syncing patches directly over WebMIDI, and visualizing routing parameters.
* In general, the ability to "listen to midi" and save the sequenced pattern on any MIDI device.

### Behringer Grind: Visual Engine Map & Interactive Patch Bay Guide

* **Patch & Layout Saving**:
  * Save patches and physical layout parameters by a picture. I.e. Ability to take/upload a picture of the setup and document it with a custom name.
* **Visual Engine Map & Knob Guide**:
  * Interactive selector to visualize different synth engines (e.g., Wavetable, FM, Karplus-Strong) and their related controls.
  * Hovering or clicking on a knob explains its exact function and sonic behavior in the context of the selected engine.
* **Interactive Patch Bay Overlay**:
  * Visual hot-spots mapped directly on top of the physical patch bay ports in the device image.
  * Hovering over a port reveals a tooltip explaining its role (CV/Gate input, output modulation), voltage specifications, and patching tips/suggestions.


## Circuit Tracks: Expand Audio Preview Features

Currently we can preview the samples on each bank, extend the ability to work with samples in general on a sample collection.
* Allow users to audition any `.wav` samples in a collection before deploying them to SD cards.
* ADSR envelope preview (applying fake envelopes to hear how it sounds truncated).


### Circuit Tracks: preview directly on the Circuit Tracks via midi

#### Notes: Architecture & Web MIDI Setup
* **API:** `navigator.requestMIDIAccess({ sysex: false })`
* **Target Output:** Filter MIDI outputs for `name.includes("Circuit Tracks")`.
* **Hardware Prerequisites:** The Circuit Tracks must have MIDI Rx (Receive) enabled for Notes, CC, and Program Change.

#### Notes: MIDI Protocol Mapping
* **Synth 1 & Synth 2:** PGM `0-63` (Ch 1/2) followed by Note `60` ON.
* **Drums 1-4:** CC `8`, `18`, `44`, `50` (Ch 10) followed by Notes `60`, `62`, `64`, `65`.
* **MIDI 1 & MIDI 2:** PGM `0-63` (Ch 3/4) followed by Note `60` ON.


## New feature: Sequencer!

Your browser becomes your DAW!
* Build a full multi-track sequencer into the browser that routes MIDI directly to the connected hardware.
* Piano roll, step sequencer interfaces or ... a Circuit Tracks emulation.
* Clock synchronization to act as the master tempo for the DAWless setup.
* Translate to/from Strudel (see next feature)

---

## New feature: Strudel.cc Integration!

Seamlessly integrate Strudel live-coding to merge your hardware setup with algorithmic music generation. This feature would include:
* **Basic Strudel.cc integration**: Add a coding canvas where we live code the music directly (no LLM aid).
* **AI-Assisted Composition**: Incorporate an LLM chat interface and the `strudel-mcp-server` to allow an AI to generate, play, and modify Strudel code on the fly via tools like "Play Music" or "Get Pattern".
* **Hardware MIDI Mapping**: Map algorithmic Strudel patterns directly to the logical MIDI channels of connected hardware (e.g., routing algorithmic drum sequences to the Circuit Tracks or generative melodies to the MiniFreak).
* **MIDI-to-Strudel Support**: Utilize scripts to convert recorded MIDI files into editable Strudel syntax for further algorithmic manipulation.
* **Layout Syncing**: Save Strudel sketches alongside your DAWless hardware routing configurations to instantly recall entire studio states.