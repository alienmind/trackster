# Behringer GRIND user guide
<br>
Original author: **g-no**, [social and music](https://push.fm/fl/condensa), available in https://www.reddit.com/r/Behringer/comments/1qjwdsq/grind_user_guide/

Other contributions by me

## 0. Acronyms
- VCA: voltage controlled amplifier
- VCO: voltage controlled oscillator
- VCF: voltage controlled filter
- LPG: low pass gate
- CV: control voltage
- FM: Frequency Modulation
- LFO: low frequency oscillator

## 1. Introduction
<p> A short and hopefully comprehensible guide to all the different features and operations available on the Behringer GRIND. This guide is a merge of the GRIND and BRAINS 'quick start' guides with personal comments and tips I'm learning through practice.</p>

## 2. Command Knobs and Buttons

### <span style="color:lightblue">2.1 VCO Section</span>

### 2.1.1 Timbre
<p> Function varies depending on the model selected, see the 'Oscillators' section for detailed info.</p>

### 2.1.2 Timbre CV Level
<p> Attenuates the voltage received at the Timbre CV input. If the CV input is not patched, and a signal is received at the Trig input, this knob will instead control the amount of modulation from the internal envelope generator. </p>

### 2.1.3 Bank button
<p> Toggles between banks. When pressed for longer it can be used to regulate LPG output envelope.</p>

### 2.1.3.1 Extra functions LPG output envelope
<p> When pressing the bank button for a longer time and move the timbre or morph knob the model LEDs will turn yellow and allows you set the LPG envelope:<br>

- **BANK+TIMBRE**: from true LPG (TIMBRE=0, 0 yellow LED in the first section) to true VCA (TIMBRE = max, 4 yellow LEDs in the first section).<br>
- **BANK+MORPH**: regulate LPG ring time and decay of internal envelope from short (MORPH=0, 0 yellow LED in the second section) to true VCA (MORPH = max, 4 yellow LEDs in the second section)</p>

### 2.1.4 Model button
<p> Toggles between models of a bank. More details later in the guide. When pressed for longer it can be used to regulate the frequency knob range.</p>

### 2.1.4.1 Extra functions frequency range
<p> When pressing the model button for a longer time and move the harmonics or morph knob the model LEDs will turn yellow and let you set the frequency knob range:
<p> **MODEL+HARMONICS** knob:

 - **HARMONICS=0**: all the LEDs are lit. Full range +/- 4 octave from C0 (with frequency at 12 o'clock)

 - **0 < HARMONICS < max**:
	- 1st LED lit: C0 at 12 o'clock +/- 7 semitones
	- 2nd LED lit: C1 at 12 o'clock +/- 7 semitones
	- ...
	- 7th LED lit: C8 at 12 o'clock +/- 7 semitones
 - **HARMONICS=max**: all the LEDs are lit. Full range +/- 4 octave from C8 (with frequency at 12 o'clock)</p>
 
### 2.1.5 Harmonics
<p> Function varies depending on the model selected, see the 'Oscillators' section for detailed info.</p>

### 2.1.6 FM knob
<p> Modulates the frequency of the oscillator. The modulation depends on the LFO rate, the Vibrato Osc Mod knob and the FM knob position. This modulation happens IF:

 - the FM knob is NOT at 12 o'clock
 - the osc mod is NOT at 0

The LFO can't be deactivated so if you don't want the modulation to happen set the said knobs in the position above.</p>

### 2.1.7 Frequency knob
<p> Changes the base frequency of the played note, the range can be set as explained in 2.1.3.1.</p>

### 2.1.8 Morph knob
<p> Function varies depending on the model selected, see the 'Oscillators' section for detailed info.</p>

### 2.1.9 Morph CV level knob
<p> Attenuates the voltage received at the Morph CV input. If the CV input is not patched, and a signal is received at the Trig input, this knob will instead control the amount of modulation from the internal envelope generator.</p>

### <span style="color:lightblue">2.2 VCF Section</span>

<p>The default VCF input is Output 1 from the VCO.</p>

### 2.2.1 Cutoff
<p>Cutoff frequency of the filter.</p>

### 2.2.2 Mode
<p>Select if the filter is high pass or low pass.</p>

### 2.2.3 Resonance
<p>Adjust the amount of enhancement given to the signals at the cutoff frequency.</p>

### 2.2.4 Mod source
<p>Choose wether the filter is modulated by the envelope or the LFO.</p>

### 2.2.5 VCF mod
<p>Choose the depth of the modulation of the filter.</p>

### 2.2.6 Mod polarity
<p>Select the polarity of the filter modulation.</p>

### <span style="color:lightblue"> 2.3 Envelope</span>
<p> Normal envelope interface with attack, decay and sustain knob.</p>

### <span style="color:lightblue"> 2.4 Vibrato</span>
<p>Control the frequency modulation of the oscillator based on the LFO rate. More info in 2.1.5.</p>

### <span style="color:lightblue"> 2.5 Modulation</span>
<p>Normal LFO interface, the knob sets the frequency, the lever selects the lfo shape. Both the LFO shapes are available in the out bay.</p>

### <span style="color:lightblue"> 2.6 Utility</span>

### 2.6.1 Glide
<p>Glide knob to set the amount of glide between the notes played by the sequencer. It has some extra functions to create ratchets and glide between sequencer notes.</p>

### 2.6.1.2 Glide extra functions
<p> The glide knob can be used to create ratchets when pressed together with the shift button in the sequencer section.</p>

- **SHIFT+GLIDE** while sequencer playing: creates a ratchet at the current sequencer step, the amount of turn give to the glide knob fix the number of ratchets.
- **SHIFT+GLIDE** while programming a sequence: programs ratcheting at the current sequencer step, the amount of turn given to the glide knob fix the number of ratchets.
- **TURN GLIDE** while programming a sequence: programs gliding between the current and the next sequencer step.

### 2.6.2 VC mix
<p>Mixer external to the synth circuit, it can be connected through the patch bay. It can be used to adjust a signal and/or to mix two signals.
Adjusting a signals example:

1. Connect the cables <code> from 'lfo tri' out **TO** 'VC mix' in </code> and <code>'VC mix' out **TO** 'VCF cutoff'</code>
2. The VC mix know adjust the amount of LFO acting on the cutoff</p>

Mix two signals example:
1. Connect the cables <code> from 'osc out 1' out **TO** 'mix 1' in </code> and <code> 'LFO tri' out **TO** 'mix 2'</code>
1. Connect the cables <code> from 'vc mix' out **TO** 'vca cv' in </code>
1. Now turning the vc mix will mix between the osc 1 out with the knob to zero, and the LFO signal with the knob to max</p>

### <span style="color:lightblue"> 2.7 Output VCA</span>

### 2.7.1 Volume
<p>It's the volume.</p>

### 2.7.2 VCA mode
<p>You can select the type of VCA mode:

- **ENV**: The VCA is modulated by the envelope.
- **LPG**: The output is subjected to a low pass gate which parameters are set as explained in 2.1.2.1.
- **ON**: The output is always the last played note, basically infinite decay.</p>

## 3. Sequencer

### <span style="color:lightblue"> 3.1 Tempo/Gate Length</span>
<p> Adjust the play tempo of the sequencer and of the arpeggiator. It has some extra functions:

- While playing: **SHIFT+TEMPO** adjust the level of 'swing', from the minimum (knob to zero, 1 green LED in the octave location) to the max (knob to max, 8 LEDs)
- While programming a sequence: **TEMPO** adjust the length of the step note. When the note has max length (8 red LEDs in the octave location) if the next note is the same it will played as a 2-step-long note. Turn sustain to max, otherwise it might still sound as two separate notes.</p>

### <span style="color:lightblue"> 3.2 Sequencer keys</span>

### 3.2.1 Hold/rest
While playing: hold the current sequencer note.
While programming: add a rest, i.e. an empty step.

### 3.2.2 Shift
When played with other keys trigger different actions.

### 3.2.3 Reset/accent

While playing: put an accent on the current sequencer step, use it to highligth a note o create a rythmic pattern live. <br>
While programming: programs an accent on the current sequencer step, use it to highlight a note or create a rythmic pattern.<br>
**SHIFT+RESET+PATTERN** reset the current pattern in memory OR being played. The pattern will be reset to a simple C-only pattern.

### 3.2.4 Page
<p>The page button is used to select the sequencer step page in any operation of editing of the pattern. While playing the page number is highlited by a blinking green LED in the octave locator.</p>
More on operations in the 'Sequencing operations' section.

### 3.2.5 Arp
<p>Press Arp to enter arpeggiator mode. Now you can arpeggiate the notes you play on the keyboard.</br>
To hold the arpeggio after pressing the notes press the **HOLD** button after **ARP**, now the pressed keys will keep playing. You can set the **ARP** tempo by turning the **TEMPO** knob.</br>
You can change the **ARP** play style by pressing **SHIFT** and the keyboard keys:

1. UP 1
2. DOWN 1
3. DOWN and UP
4. RANDOM
5. UP (+ 1 Oct)
6. DOWN (+1 Oct)
7. UP (- 1 Oct)
8. DOWN (- 1 Oct)

You can also set the arpeggiator gate length by pressing **SHIFT+TEMPO**.</br>

Pressing **SHIFT+ARP** enable **SET END** that is used in sequencer operations.</p>

### 3.2.6 Play/stop

Stop and plays the sequenced pattern.

### 3.2.7 Pattern/bank

Pressing **PATTERN** and the keys below the octave locator allows to navigate in the saved pattern library of the user. **SHIFT**+**PATTERN** allows to navigate in the banks. You have 8 banks and 8 pattern per bank.</br>
While playing you can change bank and pattern and the newly selected pattern will start to play.
Saving the pattern is explained in the Sequencer operation section.

### 3.2.8 KYBD/STEP

These two buttons are below the octave locator and can be used to change the octave of the keyboard, navigate between bank, pattern and pages.</br>
**SHIFT+KYBD**: switch to keyboard mode, the default one.
**SHIFT+STEP**: switch to step mode, useful to edit the pattern live or before playing (you can also edit in the keyboard mode).

### 3.2.9 Keyboard

Notes of the keyboard, these buttons also have extra functions to set general parameters - more later - or the **ARP** playing pattern.

### <span style="color:lightblue"> 3.3 Sequencer operations</span>

### 3.3.1 Create a pattern
To create a pattern in **KYBD** mode follow these steps:

- press **SHIFT+RESET+PATTERN** to initialise the pattern
- press **REC**
- press the keyboard buttons in the desired order
- press **SHIFT+TEMPO** to edit the step current note length
- press **SHIFT+GLIDE** to add a ratchet in the current step
- press **ACCENT** to add an accent in the current step
- press **HOLD/REST** to add a rest at the current step

To create a pattern in **STEP** mode follow these steps:

- **SHIFT+STEP** to activate step mode
- press **SHIFT+RESET+PATTERN** to initialise the pattern
- press **PAGE** to go to the desired ending page, then press **SHIFT+ARP** (SET END) and a keyboard key to choose the end point of the pattern. The keyboard LEDs will lit according to the pattern end.
- to edit a step press **SHIFT+THE STEP** to edit, the light of the step will flash
- press the desired keyboard
- press **SHIFT+TEMPO** to edit the step current note length
- press **SHIFT+GLIDE** to add a ratchet in the current step
- press **ACCENT** to add an accent in the current step
- press **HOLD/REST** to add a rest at the current step
- press **SHIFT+THE KEY** to finish the key edit
- repeat this for each step
- at any stage press **PLAY** to play the pattern

### 3.3.2 Save a pattern
To save a pattern in **KYBD** and **STEP** mode follow these steps:

- hold **SHIFT+PLAY/STOP** for 2 seconds, a green LED will start to flash slowly, that's the current pattern number.
- select the desired pattern by using **PATTERN** and the navigation buttons below the octave locator
- select the desired bank by using **SHIFT+PATTERN** and the navigation buttons below the octave locator
- press **SHIFT+REC** to save the pattern in the location of choice

To exit without saving press **REC**

### 3.3.3 Recall a saved pattern
To recall a pattern in **KYBD** and **STEP** mode follow these steps, even while playing:

- check the current pattern and bank by pressing **PATTERN** and **SHIFT+PATTERN** respectively
- while pressing **PATTERN** or **SHIFT+PATTERN** use the navigation buttons to change the current pattern/bank
- **If you are playing** the new pattern will start to play, if you switch bank the pattern of the new bank will play (i.e., I'm playing pattern 2 bank 1, I switch to 2, pattern 2 bank 2 will play)

### 3.3.4 Edit a pattern
To edit a pattern in **KYBD** mode follow these steps:

- press **REC**, keyboard LEDs will turn on
- choose the desired page by pressing **PAGE**, a green LED is showing you the current page
- If the **PAGE** button is lit the page is locked, press **SHIFT+PAGE** to unlock.
- Press **SHIFT** and the step on the keyboard you want to edit.
- press a rest or a new note to substitute the current step.
- press **REC** to exit edit mode
- play the modified pattern and choose if save it as point 3.3.2,

To edit a pattern in **STEP** mode follow these steps:

- **SHIFT+STEP** to activate step mode
- follow the steps used to normally edit keys in this mode.

### 3.3.5 Live performance
While playing a pattern you can do different things, all the edits are not saved, they are just performed at the current step:

- **SHIFT+GLIDE** perform a ratchet at the current step
- **HOLD** hold the current step
- **SHIFT+TEMPO** change the swing
- **SHIFT+HOLD** mute the pattern
- **RESET** restart the pattern
- **SHIFT+RESET** put an accent in the current step
- **KEYBOARD KEYS** change the root note and octave of the pattern
- **STEP MODE** press the key to mute a step in a pattern, press it again to restore, the turned off keys will turn black.

## 4 Patch bay

### <span style="color:lightblue"> 4.1 Input</span>

A list of the input ports:

- **OSC TIMBRE CV**: Control the Timbre
- **OSC HAR CV**: Control the Harmonics
- **OSC FM**: Control the FM 
- **OSC MORPH CV**: Control the Morph
- **OVCF IN**: External audio input to the VCF.
- **OVCF RES**: VCF Resonance CV.
- **OMIX 1**: Mix 1 CV in, connected internally to OVC MIX. 
- **OMIX 2**: Mix 2 CV in, connected internally to OVC MIX. 
- **VC MIX**: VC mix control CV in
- **OSC MODEL CV**: Allows model selection
- **OSC OCT**: Oscillator pitch CV, at 1 V/octave.
- **OSC LEVEL**: Opens the internal low-pass gate on the output signal, controlling both output level and brightness. Also triggers an accent when the physical or percussive models are active.
- **OSC TRIG**: Performs several functions:
	- Triggers the internal envelope generator.
	- Excites the physical and percussive models.
	- Strikes the internal low-pass gate.
	- Samples and holds the value of the Model CV input.
- **TEMPO**: Sequencer tempo.
- **PLAY/STOP**: Sequencer play/stop.
- **RESET**: Sequencer reset.
- **HOLD**: Sequencer hold.
- **ENV GATE**: Envelope gate.
- **VCA CV**: VCA CV.
- **LFO RATE**: LFO frequency rate

### <span style="color:lightblue"> 4.2 Output</span>

List of the output ports:

- **VC MIX**: VC mix output connected internally
to VC MIX.
- **LFO TRI**: LFO triangular waveform output.
- **OSC OUT 1**: Sends the main processed signal
- **OSC OUT 2**: Sends an alternate or variant of the Out 1 signal, see Oscillators for more details
- **ENV**: Envelope output.
- **VCA/LINE**: audio out
- **PHONES**: headphones out
- **LFO SQU**: LFO square waveform output.
- **NOISE**: noise output.
- **ASSIGN**: assign output, see general parameters for more info.
- **KB CV**: keyboard CV output.
- **GATE**: gate output.
- **VCF**: VCF output

## 5 Oscillators
In the following table the bank 1 (red) standard oscillator types are described:

|Model|Name|Timbre|Harmonics|Morph|Out 2|
| :-------------: |:-------------:|:---------------|:-------------|:-------------|:-------------|
| 1      		  | Virtual Analog|Square wave:narrow pulse,full square,hardsync formant| Detuning between waves|Saw: triangle to wide notch saw|Sum of two hardsynced waveforms|
| 2      		  | Waveshaping|Wavefolder amount| Waveshaper waveform|Waveform symmetry|Variant with another waveform curve|
| 3      		  | FM 2 operators|Modulation mix| Frequency ratio|>12 operator 2 modulates own phase; <12 operator 2 modulates operator 1 phase|Sub-oscillator|
| 4      		  |Grains|Formant frequency|Frequency between formant 1 and 2|Formant width and shape|Simulation of filtered waveforms – Harmonics selects filter type (peaking, LP, BP, HP)|
| 5      		  |Additive|Most prominent harmonic|Number of bumps in spectrum|Bump shape - flat and wide to peaked and narrow|Variant that includes harmonics from Hammond organ drawbars|
| 6      		  |Chords|Chord inversion and transposition|Chord type|Waveform|Chord root note|
| 7      		  |Speech|Vocal timber deep to high|Formant types, SAM, and LPC vowels/words|Word segment selection|Unfiltered vocal signal|
| 8      		  |Karplus strong|Brightness and dust noise sensitivity|String stiffness|Decay time|Same as out 1|
| 9      		  |Supersaw|Number of waveforms|harmonic content|Sub-oscillator level|Same as out 1|
| 10      		  |Wavetable oscillator|Rotates between waves|Select between 4 interpolated banks follow by the same not interpolated banks in reverse order|column index|Bit reduced version of out 1|

In the following table the bank 2 (green) standard oscillator types are described:

|Model|Name|Timbre|Harmonics|Morph|Out 2|
| :-------------: |:-------------:|:---------------|:-------------|:-------------|:-------------|
| 1      		  | Rain|Rain density|Amount of pitch randomization|Droplet duration overlap, up to stack of 8 randomly frequency modulated waveforms|Variant with sine wave oscillators|
| 2      		  |Noise|Clock frequency|Filter response to LP to BP to HP|Filter resonance|Result of two BP filters controlled by harmonic knob|
|3      		  |Dust|Particle density|Frequency randomization|From reverberating all pass filters to resonant BP filter|raw dust noise|
|4      		  |Modal Strings|Excitation brightness and dust density|Amount of harmonic coloration|Decay time|Raw exciter signal|
| 5      		  |FM drum|LP filter cutoff|Blend between harmonic content|Decay time|Alternate FM drum model|
|6      		  |Bass drum|Attack brightness and overdrive|Frequency|Decay time|Alternate bass drum model|
| 7      		  |Snare drum|Balance between modes of the drum|Blend between harmonic and noisy component|Decay time|Alternate snare drum model|
|8      		  |Hi-hat|HP filter cutoff|Blend between metallic and filtered noise|Decay time|Alternate hi-hat model|
| 9      		  |Cowbell|Tone|Resonance|Decay time|Alternate cowbell model|
|0      		  |Toms|Tone|Resonance|Decay time|Alternate tom models|

In the following table the bank 3 (yellow) standard oscillator types are described:

|Model|Name|Timbre|Harmonics|Morph|Out 2|
| :-------------: |:-------------:|:---------------|:-------------|:-------------|:-------------|
| 1      		  |BX7|Vibrato|Preset selection|Tremolo|Same as Out 1|
| 2      		  |Bassline|Cutoff|Resonance+distortion|Env mod + Decay|Same as Out 1|
| 3      		  |Wave generator|Waveform|Bit crush|Sample rate|Same as Out 1|
| 4      		  |Vox|Formant shift|Reso|Blend Vowels|Same as Out 1|

### 5.1.1 Virtual Analog
*(Placeholder for Virtual Analog synth engine details)*

### 5.1.2 Waveshaping
*(Placeholder for Waveshaping synth engine details)*

### 5.1.3 FM 2 operators
*(Placeholder for FM 2 operators synth engine details)*

### 5.1.4 Grains
*(Placeholder for Grains synth engine details)*

### 5.1.5 Additive
*(Placeholder for Additive synth engine details)*

### 5.1.6 Chords
*(Placeholder for Chords synth engine details)*

### 5.1.7 Speech
*(Placeholder for Speech synth engine details)*

### 5.1.8 Karplus strong
*(Placeholder for Karplus strong synth engine details)*

### 5.1.9 Supersaw
*(Placeholder for Supersaw synth engine details)*

### 5.1.10 Wavetable oscillator
*(Placeholder for Wavetable oscillator synth engine details)*

### 5.2.1 Rain
*(Placeholder for Rain synth engine details)*

### 5.2.2 Noise
*(Placeholder for Noise synth engine details)*

### 5.2.3 Dust
*(Placeholder for Dust synth engine details)*

### 5.2.4 Modal Strings
*(Placeholder for Modal Strings synth engine details)*

### 5.2.5 FM drum
*(Placeholder for FM drum synth engine details)*

### 5.2.6 Bass drum
*(Placeholder for Bass drum synth engine details)*

### 5.2.7 Snare drum
*(Placeholder for Snare drum synth engine details)*

### 5.2.8 Hi-hat
*(Placeholder for Hi-hat synth engine details)*

### 5.2.9 Cowbell
*(Placeholder for Cowbell synth engine details)*

### 5.2.10 Toms
*(Placeholder for Toms synth engine details)*

### 5.3.1 BX7
*(Placeholder for BX7 synth engine details)*

### 5.3.2 Bassline
*(Placeholder for Bassline synth engine details)*

### 5.3.3 Wave generator
*(Placeholder for Wave generator synth engine details)*

### 5.3.4 Vox
*(Placeholder for Vox synth engine details)*


## 6 General parameters

Press **SHIFT+HOLD+KEY 8** to enter the setting mode. The flashing yellow LED in the octave locator will indicate the page you are editing, the green light indicates the current option. Use the same key combination to exit.</br> 
<em>To select numbers higher than 8 use **SHIFT+KEY**, e.g. **SHIFT+2** = 10. The location will be shown by a red light</em>.

### <span style="color:lightblue"> 6.1 Page 1: Tempo Mode</span>

Tempo mode options:

1. 1PPS: 1 pulse per second
2. 2PPQN: 2 pulses per quarter note
3. 24PPQN: 24 pulses per quarter note
4. 48PPQN: 48 pulses per quarter note
5. CV: Control Voltage

### <span style="color:lightblue">6.2 Page 2: Assign Output Mode</span>

Modes assignable to the **ASSIGN** output in the patch bay:

1. Sequencer Accent
2. Sequencer Clock
3. Sequencer Clock/2
4. Sequencer Clock/4
5. Sequencer Step Ramp
6. Sequencer Step Saw
7. Sequencer Step Triangle
8. Sequencer Step Random
9. Sequencer Step 1 Trigger Output
10. MIDI Velocity
11. MIDI Channel Pressure
12. MIDI Pitch Bend
13. MIDI CC1
14. MIDI CC2
15. MIDI CC4
16. MIDI CC7

### <span style="color:lightblue"> 6.3 Page 3: Clock Type Mode</span>

Clock mode options:

1. INTERNAL
2. MIDI DIN
3. MIDI USB
4. EXTERNAL TRIGGER
5. AUTO (clock priority: TRIG > MIDI USB > MIDI
DIN > INTERNAL)

### <span style="color:lightblue"> 6.4 Page 4: Clock Edge Mode</span>

Clock edge mode options:

1. Fall
2. Rise