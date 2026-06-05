# FUTURE IDEAS

This document contains a set of structured new feature ideas, concepts, and high-level designs for expanding Trackster's capabilities beyond simple hardware mapping and sample management.

---

## General

### Configuration Backup & Restore (Local ZIP)
Implement a robust configuration backup system to serialize all local user settings, canvas layouts, and custom device definitions into a single, portable file. 
* Allow to have multiple configuration profiles (add them, delete them, backup them)
* Generate a downloadable `.zip` file containing a set of JSON files representing the current state of Trackster.
* Allow users to import this `.zip` file later to completely restore their setup, preserving the offline-first, local nature of the app without needing a backend server.

**Proposed Architecture**
* **Data Sources to Serialize**: UI Store (`useUIStore`), Overview Canvas Layouts, Custom Device Definitions.
* **Export Workflow (Backup)**: User clicks "Export Backup". A utility function reads all necessary slices from Zustand and IndexedDB, converting them into JSON strings. Compress via `JSZip` into `trackster_backup_<date>.zip` and download utilizing the `Blob` API.
* **Import Workflow (Restore)**: User selects a ZIP file. Decompress via `JSZip`. Parse and validate the JSON against predefined schemas to ensure the backup file isn't corrupted. Overwrite relevant Zustand store states and IndexedDB entries, then trigger a UI re-render.
* **Dependencies**: `JSZip` (for creating/reading zip files on the client side).
* **Potential Challenges**: Handling breaking schema changes in future versions (requires a `"version"` key). Managing large custom assets (like base64 images) which might inflate the ZIP size.

### Overview Canvas Improvements
* **Automatic Optimization of Cabling**: Suggest reconnecting things in a different way via an "Optimize" button in the overview to clean up the physical routing diagram.
* **Add new gear (LLM assisted)**:
  * This feature would allow users to easily add new hardware synthesizers to the application. 
  * With one LLM we will receive a description of the device.
  * An image of the gear will be added - LLM will generate an SVG optionally, but the image can still be used.
  * LLM would also generate a set of cable routings for the new gear as a default.
  * It will be added to the catalogue of available units.

### Browser Sequencer
Your browser becomes your DAW!
* Build a full multi-track sequencer into the browser that routes MIDI directly to the connected hardware.
* Piano roll, step sequencer interfaces or ... a Circuit Tracks emulation.
* Clock synchronization to act as the master tempo for the DAWless setup.
* Translate to/from Strudel (see next feature).

### Strudel.cc Integration
Seamlessly integrate Strudel live-coding to merge your hardware setup with algorithmic music generation. This feature would include:
* **Basic Strudel.cc integration**: Add a coding canvas where we live code the music directly (no LLM aid).
* **AI-Assisted Composition**: Incorporate an LLM chat interface and the `strudel-mcp-server` to allow an AI to generate, play, and modify Strudel code on the fly via tools like "Play Music" or "Get Pattern".
* **Hardware MIDI Mapping**: Map algorithmic Strudel patterns directly to the logical MIDI channels of connected hardware (e.g., routing algorithmic drum sequences to the Circuit Tracks or generative melodies to the MiniFreak).
* **MIDI-to-Strudel Support**: Utilize scripts to convert recorded MIDI files into editable Strudel syntax for further algorithmic manipulation.
* **Layout Syncing**: Save Strudel sketches alongside your DAWless hardware routing configurations to instantly recall entire studio states.

### Generic MIDI Listening
* The ability to "listen to midi" and save the sequenced pattern on any connected MIDI device.

---

## Novation Circuit Tracks

### Enhancements in the samples similarity search
The current feature is very poor, we need to first cluster all sample types by what it is (this is usually hinted by the name). Kicks compare to kicks, Snares to snares. Now everything compares to everything.
The algorithm should be more robust, we need to do spectral analysis and transients analysis. We have too many false positives

### Live MIDI Preview Feature
The "Live Preview" module is a Web MIDI-powered interface for the "Trackster" web application. It allows users to remotely control a connected Novation Circuit Tracks via USB. The UI provides a track selector (Synth 1-2, MIDI 1-2, Drum 1-4) and a 64-pad grid. Clicking a pad automatically sends the specific MIDI protocol sequence to load that preset/sample on the hardware and immediately trigger a sound, simulating a physical pad press on the device.

### Audio Preview Features Expansion
Currently we can preview the samples on each bank, extend the ability to work with samples in general on a sample collection.
* Allow users to audition any `.wav` samples in a collection before deploying them to SD cards.
* ADSR envelope preview (applying fake envelopes to hear how it sounds truncated).

### Preview directly on the Circuit Tracks via MIDI
* **Architecture & Web MIDI Setup**: 
  * API: `navigator.requestMIDIAccess({ sysex: false })`
  * Target Output: Filter MIDI outputs for `name.includes("Circuit Tracks")`.
  * Hardware Prerequisites: The Circuit Tracks must have MIDI Rx (Receive) enabled for Notes, CC, and Program Change.
* **MIDI Protocol Mapping**:
  * Synth 1 & Synth 2: PGM `0-63` (Ch 1/2) followed by Note `60` ON.
  * Drums 1-4: CC `8`, `18`, `44`, `50` (Ch 10) followed by Notes `60`, `62`, `64`, `65`.
  * MIDI 1 & MIDI 2: PGM `0-63` (Ch 3/4) followed by Note `60` ON.

### Interactive Scales Visualizer
Enable the Scales button functionality to explore musical scales dynamically within the UI.
* **Visual Piano Keyboard**: Toggle the layout into a piano shape, highlighting which specific notes are valid within the currently selected scale (e.g., Phrygian, Dorian, etc.).
* **Scale Explanations**: Provide textual information detailing what each specific scale mode is about and what kind of musical feeling or emotion it "evokes".
* **Interactive Discovery**: Allow users to easily view different scale types and immediately see the theoretical mapping to understand how it operates.

---

## Behringer FLOW 8

### Mixer MIDI Control
The goal of this feature is to utilize WebMIDI within our browser-based web application to control the FLOW 8 completely, bypassing the need for the official native Android app. By sending standard MIDI signals over its USB connection, we can replicate the exact functionality of the mobile app—but seamlessly integrated into our web interface!

### Web App Native Android Launching (Fallback)
As a supplementary feature, if users are browsing the Trackster web app from an Android device, we can provide a Deep Link (Chrome Intent) to spin up the native Android application (FLOW Mix) directly from the browser:
* **Intent URI**: `intent://#Intent;package=com.musicgroup.xairbt;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.musicgroup.xairbt;end;`
This allows the web app to act as a hub, seamlessly transitioning the user to the native app if they prefer the BLE experience.

### Targeting the FX Engines via WebMIDI
* **MIDI Channels:** FX 1 is controlled via MIDI Channel 14, and FX 2 is controlled via MIDI Channel 15.
* **Changing Presets:** Send a standard Program Change command (values 1–16) on the respective channel to load an effect preset.
* **Tweaking Parameters:** 
  * Parameter 1: Send Control Change (CC) 1, which scales from 0% to 100%.
  * Parameter 2: Send CC 2, which acts as a toggle between two possible states (Value A and Value B).

### Global FX Commands
Global commands affecting the whole mixer use **MIDI Channel 16**:
* **Global FX Mute:** Send CC 1 with a value between 1 and 127 to instantly mute both FX sends.
* **Tap Tempo:** Send a Note On command for Note 0 (C-1). The mixer calculates tempo by measuring the time interval between repetitive note hits. Any note velocity (1-127) will trigger it.

---

## Behringer Grind

### Visual Engine Map & Interactive Patch Bay Guide
* **Patch & Layout Saving**: Save patches and physical layout parameters by a picture. I.e. Ability to take/upload a picture of the setup and document it with a custom name.
* **Visual Engine Map & Knob Guide**:
  * Interactive selector to visualize different synth engines (e.g., Wavetable, FM, Karplus-Strong) and their related controls.
  * Hovering or clicking on a knob explains its exact function and sonic behavior in the context of the selected engine.
* **Interactive Patch Bay Overlay**:
  * Visual hot-spots mapped directly on top of the physical patch bay ports in the device image.
  * Hovering over a port reveals a tooltip explaining its role (CV/Gate input, output modulation), voltage specifications, and patching tips/suggestions.

---

## Arturia MiniFreak

### Device Specific Features
* Librarian features, syncing patches directly over WebMIDI, and visualizing routing parameters.

---

## Roland S-1

### Device Specific Features
* Patch management, logical CC mapping control from the browser, and backup handling.
## Coding Guidelines for LLMs
- **HARD RULE:** There should be no direct destructive operations (like deletions or moves) executed immediately in this application. It ALWAYS goes to the pending operations state first, and then the user clicks Commit to apply them. All operations interactively performed should be a dry run in the UI state, and only when we commit are they actually applied to the filesystem.
