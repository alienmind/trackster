# DESIGN.md: Trackster - Live MIDI Preview Feature

## 1. Overview
The "Live Preview" module is a Web MIDI-powered interface for the "Trackster" web application. It allows users to remotely control a connected Novation Circuit Tracks via USB. The UI provides a track selector (Synth 1-2, MIDI 1-2, Drum 1-4) and a 64-pad grid. Clicking a pad automatically sends the specific MIDI protocol sequence to load that preset/sample on the hardware and immediately trigger a sound, simulating a physical pad press on the device.

## 2. Architecture & Web MIDI Setup
* **API:** `navigator.requestMIDIAccess({ sysex: false })` (SysEx is not required for standard CC/PGM/Note messages).
* **Target Output:** Filter MIDI outputs for `name.includes("Circuit Tracks")`.
* **Hardware Prerequisites:** The Circuit Tracks must have MIDI Rx (Receive) enabled for Notes, CC, and Program Change (These are ON by default in the device's Setup View).

## 3. UI Layout Specification
### 3.1 Track Selector (Top Navigation)
A horizontal row of 8 toggle buttons representing the hardware tracks:
* `[ Synth 1 ]` `[ Synth 2 ]` `[ MIDI 1 ]` `[ MIDI 2 ]` `[ Drum 1 ]` `[ Drum 2 ]` `[ Drum 3 ]` `[ Drum 4 ]`

### 3.2 The Preset Grid
* **Layout:** A grid displaying up to 64 pads (e.g., an 8x8 matrix or four 2x8 pages matching the hardware layout).
* **State:** The grid updates dynamically based on the selected Track.
* **Interaction:** `onMouseDown` triggers the preset change and Note On; `onMouseUp` (or a fixed timeout) triggers Note Off.

## 4. MIDI Protocol Mapping (The "Driver")
The Novation Circuit Tracks expects distinctly different MIDI messages for Synths/MIDI tracks versus Drum tracks. 

*Note: All channels are 0-indexed in code (e.g., Channel 1 = `0x00`), so the hex prefix for Note On (`0x90`), CC (`0xB0`), and PGM (`0xC0`) must have the channel (0-15) appended.*

### 4.1 Synths (Synth 1 & Synth 2)
Synths require a **Program Change (PGM)** to select the patch, followed by a **Note On/Off** to trigger the sound.
* **Synth 1 Channel:** 1 (`0x00`)
* **Synth 2 Channel:** 2 (`0x01`)
* **Patch Selection:** PGM message with value `0` to `63`.
* **Trigger Note:** Note `60` (Middle C), Velocity `100`.

### 4.2 Drums (Drum 1, 2, 3, 4)
All drum tracks share **Channel 10**. They require a **Control Change (CC)** to select the sample, followed by a specific **Note On/Off** mapped to the individual drum track.
* **Global Drum Channel:** 10 (`0x09`)
* **Drum 1:** * Sample Select: CC `8` (Value `0` to `63`)
  * Trigger Note: `60`
* **Drum 2:**
  * Sample Select: CC `18` (Value `0` to `63`)
  * Trigger Note: `62`
* **Drum 3:**
  * Sample Select: CC `44` (Value `0` to `63`)
  * Trigger Note: `64`
* **Drum 4:**
  * Sample Select: CC `50` (Value `0` to `63`)
  * Trigger Note: `65`

### 4.3 MIDI Tracks (MIDI 1 & MIDI 2)
MIDI tracks control external gear. Selecting a preset sends a Program Change out of the Circuit's MIDI OUT port to external synths.
* **MIDI 1 Channel:** 3 (`0x02`)
* **MIDI 2 Channel:** 4 (`0x03`)
* **Patch Selection:** PGM message with value `0` to `63`.
* **Trigger Note:** Note `60` (Middle C), Velocity `100`.

## 5. Implementation Logic (The "Click" Sequence)
When a user clicks Pad index `X` (where `X` is `0` to `63`), the app executes the following sequence:

### Drum Example (Clicking Pad 42 on Drum 2)
1. **Send CC (Change Sample):** `output.send([0xB9, 18, 42])` 
   *(0xB9 = CC on Ch 10 | 18 = Drum 2 Patch CC | 42 = Sample Index)*
2. **Send Note On:** `output.send([0x99, 62, 100])` 
   *(0x99 = Note On Ch 10 | 62 = Drum 2 Trigger Note | 100 = Velocity)*
3. **Wait 150ms**
4. **Send Note Off:** `output.send([0x89, 62, 0])` 
   *(0x89 = Note Off Ch 10)*

### Synth Example (Clicking Pad 15 on Synth 1)
1. **Send PGM (Change Patch):** `output.send([0xC0, 15])` 
   *(0xC0 = PGM on Ch 1 | 15 = Patch Index)*
2. **Wait 10ms** *(Allows hardware DSP to load the patch from flash memory)*
3. **Send Note On:** `output.send([0x90, 60, 100])` 
   *(0x90 = Note On Ch 1 | 60 = Middle C | 100 = Velocity)*
4. **Wait 500ms**
5. **Send Note Off:** `output.send([0x80, 60, 0])` 
   *(0x80 = Note Off Ch 1)*

## 6. Development Checklist for Coding Agent
1. **MIDI Context:** Create a React Context or Zustand store that handles `navigator.requestMIDIAccess()` on mount and stores the `MIDIOutput` reference.
2. **Routing Function:** Build a `playHardwarePreview(trackId, presetIndex)` function containing the switch-case logic mapping the `trackId` to the correct Channels, CCs, and Notes defined in Section 4.
3. **Delay/Timeout Handling:** Ensure a small delay (`~10ms`) is implemented between a Program Change (PGM) and Note On for the Synth tracks, as the hardware requires a fraction of a second to load the patch from flash memory.
4. **UI Styling:** Map the active track to the UI color themes established previously (e.g., Synth 1 = Violet, Synth 2 = Pale Green, Drum 1 = Orange, etc.) to mirror the hardware.