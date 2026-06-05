# Circuit Tracks User Guide (Summarized Reference)
<br>
Original source: Novation Circuit Tracks User Guide v3

## 0. Acronyms
- **BPM**: Beats Per Minute (Tempo)
- **CC**: Continuous Controller (MIDI)
- **FX**: Effects (Delay, Reverb, Compressor)
- **PGM**: Program Change (MIDI)
- **PPQN**: Pulses Per Quarter Note (Sync)
- **TS / TRS**: Tip-Sleeve / Tip-Ring-Sleeve (Audio cables)

## 1. Introduction
<p>This guide provides a structured, control-oriented reference for the Novation Circuit Tracks. It explains the functions of every knob, button, and connection, mirroring the physical layout of the device to help you quickly find the documentation for any specific parameter.</p>

## 2. Command Knobs and Buttons

### <span style="color:lightblue">2.1 Master Controls</span>

### 2.1.1 Master Volume
<a id="211-master-volume"></a>
<p>Controls the overall output level of Circuit Tracks' audio outputs.</p>

### 2.1.2 Master Filter
<a id="212-master-filter"></a>
<p>A global DJ-style filter applied to the entire mix (all tracks and audio inputs). It features a centre detent. Turning anti-clockwise from the centre applies a Low-Pass filter; turning clockwise applies a High-Pass filter.</p>

### <span style="color:lightblue">2.2 Macro Controls</span>

### 2.2.1 Macros 1 - 8
<a id="221-macros"></a>
<p>Eight multi-functional rotary encoders with RGB LEDs indicating values. Their function varies depending on the selected View:</p>
<ul>
<li><b>Synth Note View:</b> Tweaks assigned patch parameters (e.g., Oscillator, Envelope, Filter).</li>
<li><b>Drum Note View:</b> Tweaks sample parameters (Pitch, Decay, Distortion, EQ) using only the <i>even-numbered</i> Macros (2, 4, 6, 8).</li>
<li><b>Mixer View:</b> Controls the volume levels of the 8 tracks. When the Pan function is toggled, they control track panning.</li>
<li><b>FX View:</b> Controls Reverb or Delay send levels for the tracks, depending on which effect preset type was last selected.</li>
</ul>
<p><em>Automation:</em> Movements can be recorded in real-time by entering Record mode while the sequence is playing.</p>

### <span style="color:lightblue">2.3 Track Selection Buttons</span>

### 2.3.1 Synth 1 & Synth 2
<a id="231-synth-tracks"></a>
<p>Selects the internal polyphonic synthesizer tracks. Pressing these opens Note View for the respective synth, allowing you to play the synth and sequence notes.</p>

### 2.3.2 MIDI 1 & MIDI 2
<a id="232-midi-tracks"></a>
<p>Selects the dedicated external MIDI tracks. These function similarly to the Synth tracks but send MIDI Note and CC data to external hardware instead of triggering internal sounds. They also control the Mixer/FX send levels for the two external Audio Inputs.</p>

### 2.3.3 Drum 1 to Drum 4
<a id="233-drum-tracks"></a>
<p>Selects the four sample-based drum tracks. Opens Note View where the top two rows represent the 16-step sequence, and the bottom two rows allow sample auditioning and selection.</p>

### <span style="color:lightblue">2.4 Step Editing & Views</span>

### 2.4.1 Note
<a id="241-note"></a>
<p>Opens the primary playing and sequencing interface for the currently selected track. The top two rows display the pattern steps, and the bottom two rows display a playable keyboard or drum sample pads.</p>

### 2.4.1.1 Note extra functions (Expand)
<p><b>SHIFT + NOTE (Expand):</b> Doubles the area of the performance pads. For Synths, it expands the keyboard to four octaves. For Drums, it maps all four drum tracks to the grid simultaneously for live finger-drumming.</p>

### 2.4.2 Velocity
<a id="242-velocity"></a>
<p>Opens Velocity View to adjust how hard a sequenced note is played (0-127). The bottom two rows act as a 16-segment fader to define the velocity level of a selected step.</p>

### 2.4.2.1 Velocity extra functions (Fixed)
<p><b>SHIFT + VELOCITY (Fixed):</b> Toggles velocity sensitivity for the performance pads. When enabled, all played notes trigger at a fixed velocity of 96, disabling the natural velocity response of the pads.</p>

### 2.4.3 Gate
<a id="243-gate"></a>
<p>Opens Gate View to determine the duration (length) of a sequenced note. Gate length is measured in steps and fractions of a step.</p>

### 2.4.3.1 Gate extra functions (Micro Step / Ties)
<p><b>SHIFT + GATE (Micro Step):</b> Allows notes to be delayed "off the grid" by 1 to 5 ticks (each tick is 1/6th of a step). Essential for un-quantized feels, strums, and ratchets.<br>
<i>Tied Notes:</i> In Gate View, accessing Micro Step mode allows toggling "tie-forward" (Pad 24) to tie adjacent notes together for drones and sustained chords.</p>

### 2.4.4 Pattern Settings
<a id="244-pattern-settings"></a>
<p>Opens a view to alter the start and end points of a pattern (allowing custom pattern lengths like 7 or 12 steps), change the play direction (Forwards, Reverse, Ping-Pong, Random), and adjust the sync rate relative to the master BPM (e.g., 1/4, 1/8, 1/16, triplets).</p>

### 2.4.4.1 Pattern Settings extra functions (Probability)
<p><b>SHIFT + PATTERN SETTINGS (Probability):</b> Assigns a percentage chance (from 12.5% to 100%) that a programmed step will actually trigger during playback, introducing generative variations to sequences.</p>

### <span style="color:lightblue">2.5 Global & Routing Views</span>

### 2.5.1 Scales
<a id="251-scales"></a>
<p>Selects the musical scale and root note applied to the Synth and MIDI tracks. The bottom two rows select from 16 scales (Major, Minor, Dorian, Chromatic, etc.), while the top rows choose the Root Note.</p>

### 2.5.2 Patterns
<a id="252-patterns"></a>
<p>Opens Patterns View. Each track has 8 patterns. Selecting patterns here queues them for playback. You can chain patterns together by holding the first desired pattern pad and pressing the last.</p>

### 2.5.2.1 Patterns extra functions (View Lock)
<p><b>SHIFT + PATTERNS (View Lock):</b> Freezes the grid display to the currently viewed pattern, allowing you to edit it even if the sequencer progresses to a different pattern in the chain.</p>

### 2.5.3 Mixer
<a id="253-mixer"></a>
<p>Opens Mixer View. The top row of lit pads acts as Track Mutes. The Macros control the volume levels for all 8 tracks.</p>

### 2.5.3.1 Mixer extra functions (Pan & Scenes)
<p><b>SHIFT + MIXER (Pan):</b> (Using the Octave Down button when in Mixer view toggles to Pan) Allows Macros to pan tracks left/right.<br>
<b>SHIFT + SCENE PADS (Bottom two rows):</b> Allows saving the currently queued/playing combination of Pattern Chains into a "Scene". Scenes can be triggered or chained to build complete song structures.</p>

### 2.5.4 FX
<a id="254-fx"></a>
<p>Opens the Effects View. Select from 16 Delay presets (top two rows) and 8 Reverb presets (third row). The Macros act as per-track send levels to the active delay or reverb.</p>

### 2.5.4.1 FX extra functions (Side Chain)
<p><b>SHIFT + FX (Side Chain):</b> Opens Side Chain View. Allows you to "duck" the volume of Synth or Audio Input tracks based on triggers from the Drum tracks (e.g., ducking the bass synth whenever the kick drum hits). Features 7 ducking envelope presets.</p>

### 2.5.5 Preset
<a id="255-preset"></a>
<p>Opens the library to select patches/sounds for the active track. Synths have 128 patches, Drums have 64 samples, and MIDI tracks have 8 templates.</p>

### <span style="color:lightblue">2.6 Navigation and Utility</span>

### 2.6.1 Up / Down Arrows (Octave / Page)
<a id="261-up-down"></a>
<p>In Note View, these shift the keyboard pitch up or down by octaves. In Views with multiple pages (Preset, Patterns, Projects), they navigate between pages.</p>

### 2.6.2 1-16 / 17-32 (Step Page)
<a id="262-step-page"></a>
<p>Extends a track's pattern from 16 steps to 32 steps. The button turns orange to indicate you are viewing steps 17-32. Pressing it toggles between the two halves of the pattern.</p>

### 2.6.3 Tempo / Swing
<a id="263-tempo-swing"></a>
<p>Displays the BPM across the grid. Macro 1 adjusts the Tempo (40 - 240 BPM). Macro 2 adjusts the Swing percentage (20% - 80%).</p>

### 2.6.3.1 Tempo extra functions (Tap / Click)
<p><b>SHIFT + TEMPO (Tap):</b> Tap this button to the beat of external music to manually set the BPM.<br>
<b>SHIFT + CLEAR (Click):</b> Toggles the internal metronome/click track on or off.</p>

### 2.6.4 Clear
<a id="264-clear"></a>
<p>Used to delete data. Hold Clear and press a step to delete notes. Hold Clear and twist a Macro to delete automation. In Patterns/Projects views, hold Clear and press a pad to delete the pattern/project.</p>

### 2.6.5 Duplicate
<a id="265-duplicate"></a>
<p>Used for copy-pasting. Hold Duplicate, press the source step/pattern/scene, then press the destination pad.</p>

### 2.6.5.1 Duplicate extra functions (Mutate)
<p><b>SHIFT + DUPLICATE (Mutate):</b> Randomly shuffles the position of notes/hits within the current pattern to generate new rhythmic variations.</p>

### 2.6.6 Save
<a id="266-save"></a>
<p>Saves the current Project. Press once to arm (button flashes), press again to confirm and overwrite. To save to a new slot, arm Save, then open Projects view and select an empty pad.</p>

### 2.6.7 Projects
<a id="267-projects"></a>
<p>Opens Projects View to load or save to one of 64 project memory slots. The currently loaded project is lit white.</p>

### 2.6.7.1 Projects extra functions (Packs)
<p><b>SHIFT + PROJECTS (Packs):</b> Opens Packs View (requires microSD card). Allows loading a completely new Pack (which contains 64 projects, 128 synth patches, and 64 samples) from the SD card into the device's active memory.</p>

### 2.6.8 Shift
<a id="268-shift"></a>
<p>Modifier button used to access secondary functions printed below the primary button names. Can be made "sticky" via Setup View.</p>

### <span style="color:lightblue">2.7 Transport Controls</span>

### 2.7.1 Play
<a id="271-play"></a>
<p>Starts and stops the sequencer. <b>SHIFT + PLAY</b> resumes playback from the exact step where it was stopped, rather than restarting from step 1.</p>

### 2.7.2 Record
<a id="272-record"></a>
<p>Toggles Record Mode. When active (red), playing pads records notes into the pattern, and tweaking Macros records automation data.</p>

### 2.7.2.1 Record extra functions (Rec Quantise)
<p><b>SHIFT + RECORD (Rec Quantise):</b> Toggles between quantized and unquantized live recording. When disabled, live playing is recorded to micro-steps (off-grid) instead of snapping to the nearest 16th note.</p>


## 3. Rear Panel Connections

### 3.1 Outputs (L/Mono & R)
<p>Main stereo audio output via two 1/4" TS jack sockets. If only L/Mono is connected, it outputs a summed mono mix.</p>

### 3.2 Sync Out
<p>3.5mm TRS jack supplying an analog clock signal (5V pulse) to synchronize external analog gear. Rate is adjustable (default 2 PPQN).</p>

### 3.3 Headphones
<p>3.5mm stereo output for headphone monitoring. Main outputs remain active when headphones are connected.</p>

### 3.4 MIDI (In, Out, Thru)
<p>Standard 5-pin DIN sockets for MIDI communication. MIDI Thru can be internally reconfigured as a duplicated MIDI Out via Advanced Setup View.</p>

### 3.5 Inputs (1 & 2)
<p>Two 1/4" TS jack sockets for external mono audio signals. These route through the internal Mixer, FX, Side Chain, and Master Filter sections.</p>

### 3.6 USB-C
<p>Provides DC power/charging and acts as a class-compliant USB MIDI interface. Used to connect to Novation Components via computer. (Does not transmit audio over USB).</p>

### 3.7 microSD Slot
<p>For inserting a microSD card to save, store, and load up to 31 additional Packs.</p>

### 3.8 Power Button
<p>Soft on/off switch. Requires a long press (~1 second) to prevent accidental power cycles. LED glows green when the internal battery is charging.</p>
