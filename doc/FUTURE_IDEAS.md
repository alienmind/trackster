# FUTURE IDEAS

This document contains a set of structured new feature ideas and concepts for expanding Trackster's capabilities beyond simple hardware mapping and sample management.

## Live MIDI Preview Feature (Circuit Tracks Specific)

### 1. Overview
The "Live Preview" module is a Web MIDI-powered interface for the "Trackster" web application. It allows users to remotely control a connected Novation Circuit Tracks via USB. The UI provides a track selector (Synth 1-2, MIDI 1-2, Drum 1-4) and a 64-pad grid. Clicking a pad automatically sends the specific MIDI protocol sequence to load that preset/sample on the hardware and immediately trigger a sound, simulating a physical pad press on the device.

### 2. Architecture & Web MIDI Setup
* **API:** `navigator.requestMIDIAccess({ sysex: false })`
* **Target Output:** Filter MIDI outputs for `name.includes("Circuit Tracks")`.
* **Hardware Prerequisites:** The Circuit Tracks must have MIDI Rx (Receive) enabled for Notes, CC, and Program Change.

### 3. MIDI Protocol Mapping
* **Synth 1 & Synth 2:** PGM `0-63` (Ch 1/2) followed by Note `60` ON.
* **Drums 1-4:** CC `8`, `18`, `44`, `50` (Ch 10) followed by Notes `60`, `62`, `64`, `65`.
* **MIDI 1 & MIDI 2:** PGM `0-63` (Ch 3/4) followed by Note `60` ON.

---

## More Device Specific Features for my Gear

Draft: Expand the application to interface directly with other hardware synthesizers.
* **Roland S-1**: Patch management, logical CC mapping control from the browser, and backup handling.
* **Arturia MiniFreak**: Librarian features, syncing patches directly over WebMIDI, and visualizing routing parameters.
* ...

---

## Circuit Tracks - Expand Audio Preview Features

Draft: Create a fully featured, client-side web audio previewer for sample management.
* Allow users to audition `.wav` samples in the browser before deploying them to SD cards.
* Waveform rendering using WaveSurfer.js.
* ADSR envelope preview (applying fake envelopes to hear how it sounds truncated).

---

## Sequencing Abilities!

Draft: Your browser becomes your DAW!
* Build a full multi-track sequencer into the browser that routes MIDI directly to the connected hardware.
* Piano roll and step sequencer interfaces.
* Clock synchronization to act as the master tempo for the DAWless setup.

---

## Strudel.cc Integration

Draft: Seamlessly integrate Strudel live-coding to merge your hardware setup with algorithmic music generation. This feature would include:
* **Basic Strudel.cc integration**: Add a coding canvas where we live code the music directly (no LLM aid).
* **AI-Assisted Composition**: Incorporate an LLM chat interface and the `strudel-mcp-server` to allow an AI to generate, play, and modify Strudel code on the fly via tools like "Play Music" or "Get Pattern".
* **Hardware MIDI Mapping**: Map algorithmic Strudel patterns directly to the logical MIDI channels of connected hardware (e.g., routing algorithmic drum sequences to the Circuit Tracks or generative melodies to the MiniFreak).
* **MIDI-to-Strudel Support**: Utilize scripts to convert recorded MIDI files into editable Strudel syntax for further algorithmic manipulation.
* **Layout Syncing**: Save Strudel sketches alongside your DAWless hardware routing configurations to instantly recall entire studio states.