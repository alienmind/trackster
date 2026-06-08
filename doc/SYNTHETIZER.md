# Synthesizer & Sequencer Architecture

This document consolidates the software architecture, routing, and intention behind the Trackster synthesizer engine and global sequencer implementation.

## 1. Architecture Overview
Trackster features a modular synthesizer environment where users can place hardware nodes (like the Roland S1 emulator) onto a visual grid. The architecture cleanly separates **Audio Generation** (Tone.js graphs within device components), **Global Sequencing** (a centralized master step-sequencer), and **State Management** (Zustand stores for persistent parameters and UI state).

## 2. The Global Sequencer
The sequencer is designed to be the master clock and pattern generator for any connected virtual or physical MIDI device in the workspace.
- **State (`useSequencerStore.ts`)**: Manages a dynamic number of tracks. Each track contains an array of up to 64 `StepData` objects (active state and note overrides). It also maintains a `trackAssignments` dictionary mapping each track ID (e.g., `track_12345`) to a logical device channel (`nodeId:channelId`).
- **Clock**: Driven by `Tone.Transport`. A single master `Tone.Loop` fires every 16th note, calling `setCurrentStep()` to synchronize the React UI (`GlobalSequencer.tsx`) with the precise Tone.js audio context time.
- **UI (`GlobalSequencer.tsx`)**: Provides a unified view of all tracks. Users can assign tracks to specific instruments via a dropdown, toggle steps, and use the Circuit Tracks piano roll to override step notes.

## 3. The S1 Virtual Analog Synthesizer
The S1 emulator is a comprehensive virtual analog synthesizer built natively with Tone.js.
- **Audio Engine (`RolandS1.tsx`)**: Uses a complex Tone.js audio graph initialized once per device node.
  - **Oscillators**: Saw, Square, Sub, and Noise generators.
  - **Modulation**: An LFO capable of modulating oscillator pitch and filter cutoff.
  - **Envelopes**: A shared ADSR curve applied to a `Tone.AmplitudeEnvelope` (for the VCA) and a scaled `Tone.Envelope` (for the VCF).
  - **Effects**: Ping-pong delay and Reverb sends.
- **Parameter State**: Knob and fader positions are stored in `useOverviewStore` under the node's `deviceState`. This state is merged with a default fallback to ensure all parameters exist.
- **UI Interaction (`S1Controls.tsx`)**: Custom rotary knobs (`S1Knob`) use pointer lock and delta-Y math to calculate rotation. When a user turns a knob, an `onChange` callback fires, dispatching an `updateNodeState` action to the store. React then re-renders the component, applying the new value, while a `useEffect` calls `param.rampTo(val, 0.1)` on the Tone.js audio nodes for click-free parameter smoothing.

## 4. Integration & Routing
- **Audio Routing**: The S1 audio engine terminates in a `Tone.Limiter` which natively connects to `Tone.Destination`. This means the virtual synth output is automatically mixed with the global audio context (and visualizer analyser) without needing manual Web Audio API routing.
- **Sequencer Integration**: Instead of the Global Sequencer pushing notes to the synth, the synth *pulls* from the sequencer. During the S1 initialization, a local `Tone.Loop` is created. On every 16th note tick, this loop checks the global `useSequencerStore`, identifies its assigned track via its `activeNodeId`, and reads the active state of the current step. If active, it triggers its internal envelopes and sets oscillator frequencies using `Tone.js` accurate scheduling time.
- **Visual Cables vs. Audio**: Currently, the visual patching in the Overview grid (`physical`/`logical` routing) represents conceptual MIDI/Audio flows. The actual virtual analog audio is routed natively to the speakers.

---

## 5. Known Issues on this Branch

During the refactoring to decouple the sequencer from the S1 and make it global, several regressions were introduced that need to be addressed in future commits:

### A. Sequencer State Persistence
The sequences and track assignments are lost on page refresh. `useSequencerStore` holds data in memory but is not wrapped in Zustand's `persist` middleware, nor does it save its payload to `localStorage` like `useOverviewStore` does.

### B. Audio Silenced when viewing the Global Sequencer
The S1 synth sound never comes out. Irrelevant whether the active screen is the S1 or the Sequencer.
**Suspected Cause but uncofirmed**: The S1's internal `Tone.Loop` relies on evaluating `useUIStore.getState().activeNodeId` or variables captured in its closure to identify which sequence track to pull from. However, navigating to the global sequencer sets `activeNodeId` to `null`, causing the loop to fail its track lookup (`assignedTrackId` becomes undefined), resulting in silent playback. But this is uncofirmed and not sure if aligns well with the sound not coming out of the synth irrespective of the screen we are in.

### C. S1 Parameter Resets and Visual Knob Jumping
When turning programmable synth knobs (Attack, Decay, Filter, etc.) while the sequencer is running, the visual knobs repeatedly snap back to default or old positions, making the UI feel broken and "disconnected".
This only occurs when the sequence is in playing mode, when it's stopped, all knobs controls in the S1 are back to normal, storing their assignment and not lost automatically.

**Root Cause**: In `RolandS1.tsx`, the helper component `<DocLink>` is defined *inside* the main render function. Because the global sequencer updates `currentStep` 10 times a second, `RolandS1` re-renders continuously. During each re-render, React treats the inline `<DocLink>` as a brand new component type, forcing it and its children (the `<S1Knob>` components) to completely unmount and remount. This destroys the `isDragging.current` ref state inside the knobs and leaks `window.addEventListener('pointermove')` handlers containing stale closures, causing old state to continuously overwrite the user's drags. Moving `DocLink` outside the component will fix this immediately.

### D. S1 Hardware Pads Disconnected from Sequence
Clicking the physical 1-16 step pads on the S1 UI does not update the active sequence.
**Root Cause**: The `handlePadDown` function uses a hardcoded track ID: `toggleStep('s1', globalIdx)`. The Global Sequencer tracks are dynamically generated UUIDs (e.g., `track_12345`), so this modifies a non-existent track rather than the `assignedTrackId` bound to the device.

### E. S1 Delay and Reverb never worked
Despite not having currently any sound coming out of the synth, it was never confirmed that these effects were working on this branch.

