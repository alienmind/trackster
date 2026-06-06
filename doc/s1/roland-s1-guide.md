# Roland S-1 User Guide (Summarized Reference)
<br>
Original source: Roland S-1 Owner's Manual

## 0. Acronyms
- **ADSR**: Attack, Decay, Sustain, Release (Envelope stages)
- **BPM**: Beats Per Minute
- **CC**: Control Change (MIDI)
- **ENV**: Envelope
- **LFO**: Low-Frequency Oscillator
- **OSC**: Oscillator
- **PWM**: Pulse Width Modulation
- **VCF / FILTER**: Voltage Controlled Filter
- **VCA / AMP**: Voltage Controlled Amplifier

## 1. Introduction
<p>This guide provides a structured, control-oriented reference for the Roland S-1. It explains the functions of every button, knob, and parameter, mirroring the physical layout of the device to help you quickly find the documentation for any specific function.</p>

## 2. Command Knobs and Buttons

### <span style="color:lightblue">2.1 Transport & Global Controls</span>

### 2.1.1 [▶] (PLAY)
<a id="btn-play"></a>
<p>Plays or stops the current pattern.</p>
<ul>
<li><b>[SHIFT] + [▶]:</b> Resumes pattern playback from the exact step where it was stopped, rather than restarting from step 1.</li>
</ul>

### 2.1.2 [●] (REC)
<a id="btn-rec"></a>
<p>Switches the unit to recording standby. When playback begins, notes and knob movements (motions) are recorded to the step sequencer.</p>

### 2.1.3 [SHIFT]
<a id="btn-shift"></a>
<p>Modifier button. Hold this while pressing other buttons or turning knobs to access secondary parameters (indicated by text with a dark background on the panel).</p>

### 2.1.4 [HOLD] (MANUAL)
<a id="btn-hold"></a>
<p>Acts as a sustain for the keyboard pads, holding notes even after you release them.</p>
<ul>
<li><b>[SHIFT] + [HOLD]:</b> Enters Manual Mode. The current physical positions of all knobs are immediately applied to the sound, allowing you to design a tone from scratch without the sequencer's saved parameters overriding them.</li>
</ul>

### 2.1.5 [OCT-] / [OCT+]
<a id="btn-octave"></a>
<p>Shifts the playing range of the keyboard pads down or up by octaves (-4 to +4).</p>
<ul>
<li><b>[SHIFT] + [OCT-] + [OCT+]:</b> Resets the octave shift back to 0.</li>
</ul>

### <span style="color:lightblue">2.2 Sequencer & Mode Selectors</span>

### 2.2.1 [PATTERN] (STEP LOOP)
<a id="btn-pattern"></a>
<p>Activates Pattern Select mode. Use the 1-16 pads to choose a sequence.</p>
<ul>
<li><b>[SHIFT] + [PATTERN]:</b> Enters Step Loop mode. While a pattern is playing, hold specific step pads to loop only those steps continuously.</li>
</ul>

### 2.2.2 [STEP] (KEY TRANSPOSE)
<a id="btn-step"></a>
<p>Converts the white keyboard pads into a 16-step sequencer row for step editing.</p>
<ul>
<li><b>[SHIFT] + [STEP]:</b> Key Transpose. Shifts the tonal range of the pattern (±60 half steps).</li>
</ul>

### 2.2.3 [D-MOTION] (DESTINATION)
<a id="btn-dmotion"></a>
<p>Activates the internal motion sensor. Hold this and tilt the device to manipulate assigned parameters (like pitch or filter cutoff).</p>
<ul>
<li><b>[SHIFT] + [D-MOTION]:</b> Opens the Destination screen to assign which parameters are controlled by the tilt axes (Roll and Pitch).</li>
</ul>

### <span style="color:lightblue">2.3 Shift Parameter Pads (Top Row)</span>

### 2.3.1 [PWM DEPTH]
<a id="pad-pwm-depth"></a>
<p>Adjusts the static pulse width value, or the modulation depth if PWM is being controlled by an LFO or Envelope.</p>

### 2.3.2 [PWM SRC]
<a id="pad-pwm-src"></a>
<p>Sets the source for Pulse Width Modulation: <code>Enu</code> (Envelope), <code>MAn</code> (Manual), or <code>LFO</code>.</p>

### 2.3.3 [SUB OCT]
<a id="pad-sub-oct"></a>
<p>Selects the sub-oscillator type: <code>-2oA</code> (2 octaves down, asymmetrical), <code>-2oc</code> (2 octaves down, symmetrical), or <code>-1oc</code> (1 octave down).</p>

### 2.3.4 [ENV TRG]
<a id="pad-env-trg"></a>
<p>Sets what triggers the envelope: <code>LFO</code> (repeats with the LFO cycle), <code>GAtE</code> (triggers on new notes only), or <code>trIG</code> (retriggers on every key press, even when played legato).</p>

### 2.3.5 [AMP]
<a id="pad-amp"></a>
<p>Determines amplifier behavior: <code>GAtE</code> (sustains full volume until key release) or <code>Enu</code> (volume follows the ADSR envelope knobs).</p>

### 2.3.6 [POLY]
<a id="pad-poly"></a>
<p>Changes voice allocation: <code>Mono</code>, <code>UnI</code> (Unison), <code>PoLY</code> (Polyphonic), or <code>Chd</code> (Chord). </p>

### 2.3.7 [PORTA ON]
<a id="pad-porta-on"></a>
<p>Toggles portamento (pitch glide): <code>OFF</code>, <code>On</code>, or <code>AUtO</code> (glides only when playing legato).</p>

### 2.3.8 [PORTA TIME]
<a id="pad-porta-time"></a>
<p>Sets the speed/duration of the portamento glide (0-255).</p>

### <span style="color:lightblue">2.4 Shift Parameter Pads (Bottom Row 1-16)</span>

### 2.4.1 [1] (EXIT)
<a id="pad-1-exit"></a>
<p>Cancels an operation or exits a menu.</p>

### 2.4.2 [2] (ENTER)
<a id="pad-2-enter"></a>
<p>Confirms a value change or menu selection.</p>

### 2.4.3 [3] (SHUFFLE)
<a id="pad-3-shuffle"></a>
<p>Adjusts the swing/shuffle timing of the pattern (-90 to +90).</p>

### 2.4.4 [4] (LAST)
<a id="pad-4-last"></a>
<p>Sets the maximum step length of the current pattern (1 to 64).</p>

### 2.4.5 [5] (OSC DRAW)
<a id="pad-5-osc-draw"></a>
<p>Allows you to build a custom waveform by setting 16 individual volume steps, generating staircase or sloped waves.</p>

### 2.4.6 [6] (OSC CHOP)
<a id="pad-6-osc-chop"></a>
<p>Allows you to mute specific slices of a waveform cycle to create aggressive, metallic overtones.</p>

### 2.4.7 [7] (FILTER KYBD)
<a id="pad-7-filter-kybd"></a>
<p>Filter Keyboard Follow: Dictates how much the filter opens up as you play higher notes on the keyboard.</p>

### 2.4.8 [8] (ARPEGGIO ON)
<a id="pad-8-arp-on"></a>
<p>Toggles the arpeggiator on or off.</p>

### 2.4.9 [9] (ARPEGGIO TYPE)
<a id="pad-9-arp-type"></a>
<p>Selects the arpeggiator's sequence behavior (Up, Down, Random, 2-Octave variants).</p>

### 2.4.10 [10] (ARPEGGIO RATE)
<a id="pad-10-arp-rate"></a>
<p>Sets the note division for the arpeggiator (e.g., 1/8th notes, 1/16th notes, triplets).</p>

### 2.4.11 [11] (CLEAR NOTE)
<a id="pad-11-clear-note"></a>
<p>Erases all notes in a pattern. If a specific step is selected, it erases only the notes on that step.</p>

### 2.4.12 [12] (CLEAR MOTION)
<a id="pad-12-clear-motion"></a>
<p>Erases recorded knob automation. Can clear the whole pattern, a specific step, or just a specific knob's automation.</p>

### 2.4.13 [13] (DELAY)
<a id="pad-13-delay"></a>
<p>Accesses deep parameters for the delay effect (Sync, Time, Level, Feedback, Filters).</p>

### 2.4.14 [14] (REVERB)
<a id="pad-14-reverb"></a>
<p>Accesses deep parameters for the reverb effect (Type, Time, Level, Pre-delay, Density).</p>

### 2.4.15 [15] (MENU)
<a id="pad-15-menu"></a>
<p>Opens the system and advanced pattern configuration menu.</p>

### 2.4.16 [16] (WRITE)
<a id="pad-16-write"></a>
<p>Saves your current pattern data.</p>

### <span style="color:lightblue">2.5 Knobs and Encoders</span>

### 2.5.1 VOLUME
<a id="knob-volume"></a>
<p>Controls the main output volume of the unit.</p>

### 2.5.2 TEMPO/VALUE (Encoder)
<a id="knob-tempo"></a>
<p>Turn to adjust the pattern tempo. Press and turn for coarse tempo changes. In menu mode, turn to select parameters and press to enter.</p>

### 2.5.3 LFO RATE
<a id="knob-lfo-rate"></a>
<p>Adjusts the speed of the Low-Frequency Oscillator.</p>

### 2.5.4 LFO WAVE FORM
<a id="knob-lfo-wave"></a>
<p>Selects the LFO waveform shape: Triangle (/\), Square (⎍), Saw (N), Random (RND), or Noise.</p>

### 2.5.5 OSC RANGE
<a id="knob-osc-range"></a>
<p>Selects the base octave register for the oscillators (from 64' up to 2').</p>

### 2.5.6 OSC LFO
<a id="knob-osc-lfo"></a>
<p>Adjusts how much the LFO modulates the pitch of the oscillators (vibrato depth).</p>

### 2.5.7 OSC 1 SQUARE
<a id="knob-osc1-sqr"></a>
<p>Controls the volume level of the primary Square waveform.</p>

### 2.5.8 OSC 1 SUB
<a id="knob-osc1-sub"></a>
<p>Controls the volume level of the sub-oscillator.</p>

### 2.5.9 OSC 2 SAW
<a id="knob-osc2-saw"></a>
<p>Controls the volume level of the Sawtooth waveform.</p>

### 2.5.10 OSC 2 NOISE
<a id="knob-osc2-noise"></a>
<p>Controls the volume level of the noise generator.</p>

### 2.5.11 ENV ATTACK
<a id="knob-env-attack"></a>
<p>Sets the time it takes for the envelope to reach its maximum level after a key is pressed.</p>

### 2.5.12 ENV DECAY
<a id="knob-env-decay"></a>
<p>Sets the time it takes for the envelope to fall from its maximum level to the sustain level.</p>

### 2.5.13 ENV SUSTAIN
<a id="knob-env-sustain"></a>
<p>Sets the level at which the envelope remains while a key is held down.</p>

### 2.5.14 ENV RELEASE
<a id="knob-env-release"></a>
<p>Sets the time it takes for the envelope to fall to zero after a key is released.</p>

### 2.5.15 FILTER FREQ
<a id="knob-filter-freq"></a>
<p>Adjusts the cutoff frequency of the low-pass filter, determining how bright or dark the sound is.</p>

### 2.5.16 FILTER LFO
<a id="knob-filter-lfo"></a>
<p>Adjusts how much the LFO modulates the filter cutoff frequency.</p>

### 2.5.17 FILTER RESO
<a id="knob-filter-reso"></a>
<p>Adjusts the filter resonance, emphasizing the frequencies around the cutoff point.</p>

### 2.5.18 FILTER ENV
<a id="knob-filter-env"></a>
<p>Adjusts how much the Envelope modulates the filter cutoff frequency.</p>

### 2.5.19 EFX DELAY
<a id="knob-efx-delay"></a>
<p>Controls the mix amount (send level) of the delay effect.</p>

### 2.5.20 EFX REVERB
<a id="knob-efx-reverb"></a>
<p>Controls the mix amount (send level) of the reverb effect.</p>

## 3. S-1 Display Dictionary (Hierarchical Map)
<a id="display-dictionary"></a>
<p>Because the S-1 uses a 4-character, 7-segment display, many words are heavily abbreviated. Use this hierarchy to translate what you see on the screen.</p>

```text
S-1 Display Tree
├── Step Edit Data (Visible when holding a step pad)
│   ├── n.C 5 (Note Number: C5)
│   ├── u.100 (Velocity: 100)
│   ├── G. 80 (Gate / Note Length: 80)
│   └── P.100 (Probability: 100%)
│
├── [5] OSC DRAW Settings
│   ├── SW (Switch) -> OFF, StEP, SLPE
│   ├── Forn (Form) -> Edits wave levels per 16 steps
│   └── MULt (Multiply) -> 1.0 to 32.0
│
├── [6] OSC CHOP Settings
│   ├── outn (Overtone) -> 0 to 200
│   ├── SqrP (Square Chop Pattern)
│   ├── SAwP (Saw Chop Pattern)
│   ├── SUbP (Sub Oscillator Chop Pattern)
│   ├── noIP (Noise Chop Pattern)
│   └── CoMb (Comb) -> 1.0 to 32.0
│
├── [9] ARPEGGIO TYPES
│   ├── UP (Up)
│   ├── dobn (Down)
│   ├── UP.d (Up & Down)
│   ├── UP.2 (Up 2 Octaves)
│   ├── db.2 (Down 2 Octaves)
│   ├── Ud.2 (Up & Down 2 Octaves)
│   ├── rAnd (Random)
│   └── rnd2 (Random 2 Octaves)
│
├── [13] DELAY Settings
│   ├── d.SYn (Delay Sync) -> OFF, On
│   ├── tIME (Delay Time)
│   ├── LEU (Delay Level)
│   ├── Fdbk (Feedback Amount)
│   ├── LoCt (Low Cut Filter)
│   └── HICt (High Cut Filter)
│
├── [14] REVERB Settings
│   ├── tYPE (Reverb Type) 
│   │   └── AMb, rooM, HAL1, HAL2, PLAt, SPrn, Mod
│   ├── tIME (Reverb Time)
│   ├── LEU (Reverb Level)
│   ├── Pr.dL (Pre-Delay)
│   ├── LoCt (Low Cut Filter)
│   ├── HICt (High Cut Filter)
│   └── dEnS (Density)
│
├── D-MOTION DESTINATION (Shift + D-Motion)
│   ├── roLL (Tilting Left/Right)
│   │   └── OFF, Mod, FrEq, rESo, P.bnd, PAn, EXP, d.LEu, r.LEu
│   └── PItch (Tilting Forward/Backward)
│       └── OFF, Mod, FrEq, rESo, P.bnd, PAn, EXP, d.LEu, r.LEu
│
└── [15] MENU (Global & System Settings)
    ├── UOL (Master Volume)
    ├── Nod.d (LFO Modulation Depth)
    ├── bnd.o (Oscillator Bend Sensitivity)
    ├── bnd.F (Filter Bend Sensitivity)
    ├── nS.Md (Noise Mode) -> PInc (Pink), WHIt (White)
    ├── rS.Md (Riser Mode) -> OFF, SYnC, 900, SquP
    │   ├── rS.rS (Riser Resonance)
    │   ├── rS.Sh (Riser Shape)
    │   └── rS.Lu (Riser Level)
    ├── LFO.M (LFO Mode) -> norM (Normal), FASt (Fast)
    ├── LFO.S (LFO Sync) -> OFF, On
    ├── LFO.Y (LFO Key Trigger) -> OFF, On
    ├── Cho (Chorus Type) -> OFF, 1, 2, 3, 4
    ├── trAn (Transpose)
    ├── P.SCL (Pattern Scale)
    ├── M.Prb (Master Probability)
    ├── n.Pri (Note Priority) -> LASt, Lob
    ├── GL.d.r (Global Delay/Reverb Switch)
    ├── d.L.Md (Delay Level Mode) -> PrE, PoSt
    ├── SYnC (Sync Clock PPQN) -> 1, 2, 3, 4, 6, 8, 12, 24
    ├── CH (MIDI Channel)
    ├── SYn.C (MIDI Clock Sync Source) -> AUto, Int, MIdI, USb
    ├── thru (MIDI Thru) -> OFF, On
    ├── tX.PC (Transmit Program Change) -> OFF, On
    ├── rX.PC (Receive Program Change) -> OFF, On
    ├── PC.Ch (Program Change Channel)
    ├── UELO (Key Velocity)
    ├── tUnE (Master Tune)
    ├── U.S.b.d (USB Direct Out Volume)
    ├── ALt (AIRA Link) -> OFF, On
    ├── Cnt.I (Count In) -> OFF, 2, 3, 4
    ├── MEt.o (Metronome) -> OFF, rEC (Record), r.P.L (Rec & Play)
    │   └── MEt.L (Metronome Level)
    ├── d.M.t.P (D-Motion Latch) -> OFF, On
    ├── CoPY (Pattern Copy)
    ├── InIt (Pattern Initialize)
    └── rLod (Reload)
        ├── rL.Sd (Reload Sound Only)
        └── rL.Sq (Reload Sequence Only)