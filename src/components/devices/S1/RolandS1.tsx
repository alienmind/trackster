import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { useSequencerStore } from '../../../stores/useSequencerStore';
import { useOverviewStore } from '../../../stores/useOverviewStore';
import { useUIStore } from '../../../stores/useUIStore';
import ScaleFit from '../../Core/ScaleFit/ScaleFit';
import DeviceHelpToggle from '../../Core/DeviceHelpToggle/DeviceHelpToggle';
import { SidebarContextPortal } from '../../Core/AppSidebar/SidebarContextPortal';
import { cn } from '../../../lib/utils';
import S1SidebarContext from './S1SidebarContext';
import OscilloscopeDrawer from '../../Core/OscilloscopeDrawer/OscilloscopeDrawer';
import {
  Jack,
  S1Knob,
  SqIcon,
  SawIcon,
  RangeKnob,
  RectButton,
  VerticalBtn,
  StepPad,
  LedDisplay
} from './S1Controls';
import s1GuideUrl from '../../../../doc/s1/roland-s1-guide.md?url';

const DocLink = ({ sectionId, children, className }: { sectionId: string, children: React.ReactNode, className?: string }) => {
  const { hoveredDocSection, setHoveredDocSection, setActiveDocSection, activeDoc, setActiveDoc, helpMode } = useUIStore();
  const isActive = hoveredDocSection === sectionId;
  const handleClick = () => {
     if (!helpMode) return;
     setActiveDocSection(sectionId);
     if (!activeDoc || activeDoc.url !== s1GuideUrl) {
       setActiveDoc({ url: s1GuideUrl, type: 'md' });
     }
  };
  return (
    <div 
      className={cn("relative transition-all duration-300 rounded-[3px]", isActive ? "ring-2 ring-cyan-500 shadow-[0_0_15px_cyan] bg-cyan-900/20" : "", className)}
      onPointerEnter={() => helpMode && setHoveredDocSection(sectionId)}
      onPointerLeave={() => helpMode && setHoveredDocSection(null)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

const globalS1Engines = new Map<string, any>();

export default function RolandS1() {
  const { isPlaying, togglePlaying, currentStep, tracks, toggleStep, patternSize } = useSequencerStore();
  const s1Pattern = tracks['s1'] || [];
  
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(patternSize / 16) - 1);
  const handlePageDown = () => setPage((p: number) => Math.max(0, p - 1));
  const handlePageUp = () => setPage((p: number) => Math.min(maxPage, p + 1));
  const activeNodeId = useUIStore(s => s.activeNodeId);
  const updateNodeState = useOverviewStore(s => s.updateNodeState);
  
  const deviceState = useOverviewStore(s => activeNodeId ? s.nodes[activeNodeId]?.deviceState : null) || {};

  const defaultState = {
    mixer: { saw: 0.5, sqr: 0.0, sub: 0.5, noise: 0.0 },
    adsr: { a: 0.1, d: 0.2, s: 0.5, r: 0.2 },
    filter: { cutoff: 0.5, reso: 0.2, env: 0.5, lfo: 0.0 },
    lfo: { rate: 0.5, wave: 0.0, osc: 0.0 },
    fx: { delay: 0.0, reverb: 0.0 },
    range: 0.5
  };

  const state = { ...defaultState, ...deviceState };
  
  const mixer = { ...defaultState.mixer, ...(deviceState.mixer || {}) };
  const adsr = { ...defaultState.adsr, ...(deviceState.adsr || {}) };
  const filter = { ...defaultState.filter, ...(deviceState.filter || {}) };
  const lfo = { ...defaultState.lfo, ...(deviceState.lfo || {}) };
  const fx = { ...defaultState.fx, ...(deviceState.fx || {}) };
  const range = state.range;

  const setMixer = (val: any) => { if(activeNodeId) updateNodeState(activeNodeId, { mixer: val }); };
  const setAdsr = (val: any) => { if(activeNodeId) updateNodeState(activeNodeId, { adsr: val }); };
  const setFilter = (val: any) => { if(activeNodeId) updateNodeState(activeNodeId, { filter: val }); };
  const setLfo = (val: any) => { if(activeNodeId) updateNodeState(activeNodeId, { lfo: val }); };
    const setRange = (val: number) => { if(activeNodeId) updateNodeState(activeNodeId, { range: val }); };

  const nodesRef = useRef<any>(null);
  const loopRef = useRef<any>(null);
  


  useEffect(() => {
    if (activeNodeId) {
      const engine = globalS1Engines.get(activeNodeId);
      if (engine) engine.range = range;
    }
  }, [range, activeNodeId]);

  const getLogFreq = (val: number) => Math.exp(Math.log(20) + val * (Math.log(10000) - Math.log(20)));

  useEffect(() => {
    if (!activeNodeId) return;

    if (!globalS1Engines.has(activeNodeId)) {
      const limiter = new Tone.Limiter(-2); 
      const delay = new Tone.PingPongDelay("8n", 0.3);
      const reverb = new Tone.Reverb(2.5);
    
    // FX Sends
    const delaySend = new Tone.Gain(0).connect(delay);
    const reverbSend = new Tone.Gain(0).connect(reverb);
    const dryNode = new Tone.Gain(1);
    
    delay.toDestination();
    reverb.toDestination();
    dryNode.connect(limiter);
    limiter.toDestination();

    const vcf = new Tone.Filter({ type: "lowpass", frequency: getLogFreq(0.5), Q: 2 });
    vcf.fan(dryNode, delaySend, reverbSend);

    const env = new Tone.AmplitudeEnvelope({ attack: 0.05, decay: 0.2, sustain: 0.5, release: 1 });
    
    // Create an envelope specifically for the filter so we can scale it
    const filterEnvScale = new Tone.ScaleExp(0, 10000, 2);
    const filterEnvNode = new Tone.Envelope({ attack: 0.05, decay: 0.2, sustain: 0.5, release: 1 });
    filterEnvNode.connect(filterEnvScale);
    filterEnvScale.connect(vcf.frequency);
    
    const lfoNode = new Tone.LFO(5, -1, 1).start();
    const lfoOscScale = new Tone.Gain(0);
    const lfoFilterScale = new Tone.Gain(0);
    lfoNode.fan(lfoOscScale, lfoFilterScale);

    const gainSaw = new Tone.Gain(0.5);
    const gainSqr = new Tone.Gain(0);
    const gainSub = new Tone.Gain(0.5);
    const gainNoise = new Tone.Gain(0);

    const oscSaw = new Tone.Oscillator({ type: "sawtooth" }).connect(gainSaw);
    const oscSqr = new Tone.Oscillator({ type: "square" }).connect(gainSqr);
    const oscSub = new Tone.Oscillator({ type: "square" }).connect(gainSub);
    const oscNoise = new Tone.Noise({ type: "white" }).connect(gainNoise);

    lfoOscScale.connect(oscSaw.detune);
    lfoOscScale.connect(oscSqr.detune);
    lfoOscScale.connect(oscSub.detune);
    
    // Convert LFO Filter Mod from -1,1 to freq range
    const lfoFilterOffset = new Tone.Scale(0, 5000);
    lfoFilterScale.connect(lfoFilterOffset);
    lfoFilterOffset.connect(vcf.frequency);

    gainSaw.connect(env); gainSqr.connect(env); gainSub.connect(env); gainNoise.connect(env);
    env.connect(vcf);
    
    oscSaw.start(); oscSqr.start(); oscSub.start(); oscNoise.start();

    nodesRef.current = { 
        oscSaw, oscSqr, oscSub, oscNoise, 
        gainSaw, gainSqr, gainSub, gainNoise, 
        env, filterEnvNode, filterEnvScale,
        vcf, lfoNode, lfoOscScale, lfoFilterScale, lfoFilterOffset,
        delaySend, reverbSend, delay, reverb, dryNode, limiter 
    };

    let step = 0;
    loopRef.current = new Tone.Loop((time) => {
      const e = globalS1Engines.get(activeNodeId);
      if (!e) return;
      
      // Get the pattern dynamically from store
      const p = useSequencerStore.getState().tracks['s1'] || [];
      const currentPatternSize = useSequencerStore.getState().patternSize || 16;
      
      const s = step % currentPatternSize;
      const isActive = p[s]?.active;
      const noteOverride = p[s]?.noteOverride;

      if (isActive) {
        const range = e.range ?? 0.5;
        const octaveOffset = Math.round((range - 0.5) * 4);
        
        // Use override if available, else default to C3
        let baseFreq;
        if (noteOverride) {
          baseFreq = Tone.Frequency(noteOverride + "3").transpose(octaveOffset * 12).toFrequency();
        } else {
          baseFreq = Tone.Frequency("C3").transpose(octaveOffset * 12).toFrequency();
        }
        
        oscSaw.frequency.setValueAtTime(baseFreq, time);
        oscSqr.frequency.setValueAtTime(baseFreq, time);
        oscSub.frequency.setValueAtTime(baseFreq / 2, time);
        env.triggerAttackRelease("16n", time);
        filterEnvNode.triggerAttackRelease("16n", time);
      }
      
      Tone.Draw.schedule(() => {
        useSequencerStore.getState().setCurrentStep(s);
      }, time);
      
      step++;
    }, "16n");
    
    loopRef.current.start(0);

    globalS1Engines.set(activeNodeId, { 
        oscSaw, oscSqr, oscSub, oscNoise, 
        gainSaw, gainSqr, gainSub, gainNoise, 
        env, filterEnvNode, filterEnvScale,
        vcf, lfoNode, lfoOscScale, lfoFilterScale, lfoFilterOffset,
        delaySend, reverbSend, delay, reverb, dryNode, limiter,
        loop: loopRef.current,
        range: 0.5
    });
    } // end if !globalS1Engines.has

    const engine = globalS1Engines.get(activeNodeId);
    nodesRef.current = engine;
    loopRef.current = engine.loop;

  }, [activeNodeId]);

  useEffect(() => {
    if (!nodesRef.current) return;
    const n = nodesRef.current;
    
    const smoothSet = (param: any, val: number) => {
      try { param.rampTo(val, 0.1); } 
      catch (e) { param.value = val; }
    };

    // Mixer
    smoothSet(n.gainSaw.gain, mixer.saw);
    smoothSet(n.gainSqr.gain, mixer.sqr);
    smoothSet(n.gainSub.gain, mixer.sub);
    smoothSet(n.gainNoise.gain, mixer.noise);
    
    // ADSR (Shared for AMP and Filter Envelope generator)
    const attack = Math.max(0.001, adsr.a * 2);
    const decay = Math.max(0.01, adsr.d * 2);
    const release = Math.max(0.01, adsr.r * 5);
    n.env.attack = attack; 
    n.env.decay = decay; 
    n.env.sustain = adsr.s; 
    n.env.release = release;
    
    n.filterEnvNode.attack = attack;
    n.filterEnvNode.decay = decay;
    n.filterEnvNode.sustain = adsr.s;
    n.filterEnvNode.release = release;
    
    // Filter
    smoothSet(n.vcf.frequency, getLogFreq(filter.cutoff));
    n.vcf.Q.value = filter.reso * 20;
    
    // Filter Env Depth
    n.filterEnvScale.max = filter.env * 10000;
    
    // LFO
    smoothSet(n.lfoNode.frequency, Math.max(0.1, lfo.rate * 20));
    let lfoType = "triangle";
    if (lfo.wave > 0.8) lfoType = "square"; // For simplicity, map Rnd/Noise to Sqr here, Tone.js LFO doesn't have noise type directly
    else if (lfo.wave > 0.6) lfoType = "sawtooth"; // Actually we should use the exact mappings
    else if (lfo.wave > 0.4) lfoType = "square";
    else if (lfo.wave > 0.2) lfoType = "sawtooth";
    n.lfoNode.type = lfoType as any;
    
    smoothSet(n.lfoOscScale.gain, lfo.osc * 1200); // detune in cents
    smoothSet(n.lfoFilterScale.gain, filter.lfo);
    
    // FX
    smoothSet(n.delaySend.gain, fx.delay);
    smoothSet(n.reverbSend.gain, fx.reverb);
    
  }, [mixer, adsr, filter, lfo, fx]);

  const handlePadDown = (idx: number) => {
    const globalIdx = page * 16 + idx;
    if (globalIdx >= patternSize) return; // Out of bounds of pattern
    
    if (isPlaying) {
      toggleStep('s1', globalIdx);
    } else {
      if (!nodesRef.current) return;
      const octaveOffset = Math.round((range - 0.5) * 4);
      const baseFreq = Tone.Frequency("C3").transpose(octaveOffset * 12 + idx).toFrequency();
      nodesRef.current.oscSaw.frequency.setValueAtTime(baseFreq, Tone.now());
      nodesRef.current.oscSqr.frequency.setValueAtTime(baseFreq, Tone.now());
      nodesRef.current.oscSub.frequency.setValueAtTime(baseFreq / 2, Tone.now());
      nodesRef.current.env.triggerAttack(Tone.now());
      nodesRef.current.filterEnvNode.triggerAttack(Tone.now());
    }
  };

  const handlePadUp = () => {
    if (!isPlaying && nodesRef.current) {
      nodesRef.current.env.triggerRelease(Tone.now());
      nodesRef.current.filterEnvNode.triggerRelease(Tone.now());
    }
  };

  const getPadGlowingState = (idx: number) => {
    const globalIdx = page * 16 + idx;
    if (globalIdx >= patternSize) return false;
    
    if (isPlaying) {
      return currentStep === globalIdx || s1Pattern[globalIdx]?.active;
    }
    return false;
  };
  const deviceContent = (
    <div className="w-[1000px] h-[500px] bg-[#292a2d] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col relative border border-[#1a1a1c] overflow-hidden select-none">
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* --- TOP HEADER ROW --- */}
      <div className="flex justify-end items-end px-8 pt-4 pb-2 relative z-10 gap-8 h-16">
        
        {/* CHARGE LED */}
        <div className="flex items-center gap-1.5 pb-[26px] mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]"></div>
          <span className="text-[7px] text-white font-bold tracking-widest">CHARGE</span>
        </div>
        
        {/* IN - SYNC - OUT */}
        <div className="flex flex-col items-center justify-end">
          <div className="flex gap-4">
            <Jack />
            <Jack />
          </div>
          <div className="mt-1 flex flex-col items-center justify-start min-h-[16px]">
            <span className="text-[7px] text-gray-300 font-bold tracking-wider">IN &ndash; SYNC &ndash; OUT</span>
          </div>
        </div>

        {/* IN - MIX - OUT */}
        <div className="flex flex-col items-center justify-end">
          <div className="flex gap-4">
            <Jack />
            <Jack />
          </div>
          <div className="mt-1 flex flex-col items-center justify-start min-h-[16px]">
            <span className="text-[7px] text-gray-300 font-bold tracking-wider">IN &ndash; MIX &ndash; OUT</span>
          </div>
        </div>

        {/* VOLUME */}
        <div className="flex flex-col items-center justify-end">
          <DocLink sectionId="knob-volume"><S1Knob size={24} label="VOLUME" /></DocLink>
        </div>

      </div>

      {/* --- MAIN INTERFACE GRID (Strict 8 Columns x 3 Rows) --- */}
      <div className="flex w-full px-8 pt-2 relative z-10">
         
         {/* Section Headers & Horizontal Line */}
         <div className="absolute top-[170px] left-[176px] right-[32px] h-px bg-[#444] z-0"></div>
         <div className="absolute top-[170px] left-[563px] -translate-x-1/2 -translate-y-1/2 bg-[#292a2d] px-2 text-[10px] text-white font-bold tracking-widest z-10">ENV</div>

         {/* Col 0: Display & Play Controls */}
         <div className="w-[160px] flex flex-col items-center relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="display-dictionary" className="flex justify-center items-center"><LedDisplay /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-tempo"><S1Knob variant="encoder" size={46} label="TEMPO/VALUE" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center gap-4 w-full">
               <DocLink sectionId="btn-play" className="flex justify-center items-center"><RectButton label="▶" width="w-10" active={isPlaying} ledColor="#4ade80" onClick={togglePlaying} /></DocLink>
               <DocLink sectionId="btn-rec" className="flex justify-center items-center"><RectButton label="●" width="w-10" /></DocLink>
            </div>
         </div>

         {/* Col 1: LFO */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest">LFO</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-lfo-rate"><S1Knob label="RATE" value={lfo.rate} onChange={(v) => setLfo({...lfo, rate: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center relative w-full">
               <DocLink sectionId="knob-lfo-wave" className="flex justify-center items-center w-full"><S1Knob label="WAVE FORM" value={lfo.wave} onChange={(v) => setLfo({...lfo, wave: v})} /></DocLink>
               <div className="absolute top-[15px] left-[10px] text-[10px] text-white font-bold">/\</div>
               <div className="absolute top-[15px] right-[10px] text-[10px] text-white font-bold">⎍</div>
               <div className="absolute top-[35px] left-[6px] text-[10px] text-white font-bold">N</div>
               <div className="absolute top-[35px] right-[2px] text-[7px] text-white font-bold">RND</div>
               <div className="absolute bottom-[8px] right-[0px] text-[6px] text-white font-bold">NOISE</div>
            </div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-pattern" className="flex justify-center items-center"><RectButton label="PATTERN" bottomLabel="STEP LOOP" width="w-[50px]" /></DocLink></div>
         </div>

         {/* Col 2: RANGE / STEP */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest left-[150%] -translate-x-1/2">OSCILLATOR</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc-range"><RangeKnob value={range} onChange={setRange} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc-lfo"><S1Knob label="LFO" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-step" className="flex justify-center items-center"><RectButton label="STEP" active ledColor="#ef4444" bottomLabel="KEY TRANSPOSE" width="w-[50px]" /></DocLink></div>
         </div>

         {/* Col 3: OSC 1 / ATTACK */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc1-sqr"><S1Knob label={<SqIcon />} ringColor="#14b8a6" value={mixer.sqr} onChange={(v) => setMixer({...mixer, sqr: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc1-sub"><S1Knob label="SUB" ringColor="#14b8a6" value={mixer.sub} onChange={(v) => setMixer({...mixer, sub: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-attack"><S1Knob label="ATTACK" value={adsr.a} onChange={(v) => setAdsr({...adsr, a: v})} /></DocLink></div>
         </div>

         {/* Col 4: OSC 2 / DECAY */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc2-saw"><S1Knob label={<SawIcon />} ringColor="#14b8a6" value={mixer.saw} onChange={(v) => setMixer({...mixer, saw: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc2-noise"><S1Knob label="NOISE" ringColor="#14b8a6" value={mixer.noise} onChange={(v) => setMixer({...mixer, noise: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-decay"><S1Knob label="DECAY" value={adsr.d} onChange={(v) => setAdsr({...adsr, d: v})} /></DocLink></div>
         </div>

         {/* Col 5: FILTER 1 / SUSTAIN */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest left-[100%] -translate-x-1/2">FILTER</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-freq"><S1Knob label="FREQ" ringColor="#f97316" value={filter.cutoff} onChange={(v) => setFilter({...filter, cutoff: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-lfo"><S1Knob label="LFO" ringColor="#e5e7eb" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-sustain"><S1Knob label="SUSTAIN" value={adsr.s} onChange={(v) => setAdsr({...adsr, s: v})} /></DocLink></div>
         </div>

         {/* Col 6: FILTER 2 / RELEASE */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-reso"><S1Knob label="RESO" ringColor="#f97316" value={filter.reso} onChange={(v) => setFilter({...filter, reso: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-env"><S1Knob label="ENV" ringColor="#f97316" value={filter.env} onChange={(v) => setFilter({...filter, env: v})} /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-release"><S1Knob label="RELEASE" value={adsr.r} onChange={(v) => setAdsr({...adsr, r: v})} /></DocLink></div>
         </div>

         {/* Col 7: EFX */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest">EFX</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-efx-delay"><S1Knob label="DELAY" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-efx-reverb"><S1Knob label="REVERB" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-dmotion" className="flex justify-center items-center"><RectButton label="D-MOTION" bottomLabel="DESTINATION" width="w-[50px]" /></DocLink></div>
         </div>

      </div>

      {/* --- BOTTOM ROW: Piano-Style Control Keys --- */}
      <div className="flex flex-col w-full px-8 mt-2 pb-6 relative z-10 border-t border-[#1a1a1a] bg-[#222] pt-4">
         
         {/* Top Row: "Black Keys" & Horizontal Shift/Hold */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '0.5rem' }} className="mb-1 items-end h-[50px]">
            {/* Col 1 */}
            <div className="flex justify-center"><DocLink sectionId="btn-shift" className="w-full flex justify-center"><VerticalBtn label="SHIFT" /></DocLink></div>
            {/* Cols 2-3 (Piano Offset: 50% shifted right across gap) */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="btn-octave" className="w-full flex justify-center"><VerticalBtn label="OCT-" bottomLabel="< PAGE" onClick={handlePageDown} /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="btn-octave" className="w-full flex justify-center"><VerticalBtn label="OCT+" bottomLabel="PAGE >" onClick={handlePageUp} /></DocLink></div>
            {/* Col 4 (Empty) */} <div />
            {/* Cols 5-7 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-pwm-depth" className="w-full flex justify-center"><VerticalBtn label="PWM" bottomLabel="DEPTH" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-pwm-src" className="w-full flex justify-center"><VerticalBtn label="PWM" bottomLabel="SRC" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-sub-oct" className="w-full flex justify-center"><VerticalBtn label="SUB" bottomLabel={`OCT\n `} /></DocLink></div>
            {/* Col 8 (Empty) */} <div />
            {/* Cols 9-10 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-env-trg" className="w-full flex justify-center"><VerticalBtn label="ENV" bottomLabel="TRG" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-amp" className="w-full flex justify-center"><VerticalBtn label="AMP" /></DocLink></div>
            {/* Col 11 (Empty) */} <div />
            {/* Cols 12-14 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-poly" className="w-full flex justify-center"><VerticalBtn label="POLY" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-porta-on" className="w-full flex justify-center"><VerticalBtn label="PORTA" bottomLabel="ON" active ledColor="#ef4444" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-porta-time" className="w-full flex justify-center"><VerticalBtn label="PORTA" bottomLabel="TIME" active ledColor="#ef4444" /></DocLink></div>
            {/* Col 15 (Hold Button offset between 15 and 16) */} 
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]">
               <DocLink sectionId="btn-hold" className="w-full flex justify-center"><VerticalBtn label="HOLD" bottomLabel="MANUAL" /></DocLink>
            </div>
            {/* Col 16 (Empty due to shift) */} <div />
         </div>

         {/* Bottom Row: "White Keys" (16-Step Pads) */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '0.5rem' }}>
            <DocLink sectionId="pad-1-exit"><StepPad number="1" label="EXIT" isGlowing={getPadGlowingState(0)} onPointerDown={() => handlePadDown(0)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-2-enter"><StepPad number="2" label="ENTER" isGlowing={getPadGlowingState(1)} onPointerDown={() => handlePadDown(1)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-3-shuffle"><StepPad number="3" label="SHUFFLE" isGlowing={getPadGlowingState(2)} onPointerDown={() => handlePadDown(2)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-4-last"><StepPad number="4" label="LAST" isGlowing={getPadGlowingState(3)} onPointerDown={() => handlePadDown(3)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-5-osc-draw"><StepPad number="5" label="DRAW" groupLabel="OSC" isGlowing={getPadGlowingState(4)} onPointerDown={() => handlePadDown(4)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-6-osc-chop"><StepPad number="6" label="CHOP" groupLabel="—" isGlowing={getPadGlowingState(5)} onPointerDown={() => handlePadDown(5)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-7-filter-kybd"><StepPad number="7" label="FILTER" groupLabel="KYBD" isGlowing={getPadGlowingState(6)} onPointerDown={() => handlePadDown(6)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-8-arp-on"><StepPad number="8" label="ON" groupLabel="—" isGlowing={getPadGlowingState(7)} onPointerDown={() => handlePadDown(7)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-9-arp-type"><StepPad number="9" label="TYPE" groupLabel="ARPEGGIO" isGlowing={getPadGlowingState(8)} onPointerDown={() => handlePadDown(8)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-10-arp-rate"><StepPad number="10" label="RATE" groupLabel="—" isGlowing={getPadGlowingState(9)} onPointerDown={() => handlePadDown(9)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-11-clear-note"><StepPad number="11" label="NOTE" groupLabel="CLEAR" isGlowing={getPadGlowingState(10)} onPointerDown={() => handlePadDown(10)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-12-clear-motion"><StepPad number="12" label="MOTION" groupLabel="—" isGlowing={getPadGlowingState(11)} onPointerDown={() => handlePadDown(11)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-13-delay"><StepPad number="13" label="DELAY" isGlowing={getPadGlowingState(12)} onPointerDown={() => handlePadDown(12)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-14-reverb"><StepPad number="14" label="REVERB" isGlowing={getPadGlowingState(13)} onPointerDown={() => handlePadDown(13)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-15-menu"><StepPad number="15" label="MENU" isGlowing={getPadGlowingState(14)} onPointerDown={() => handlePadDown(14)} onPointerUp={handlePadUp} /></DocLink>
            <DocLink sectionId="pad-16-write"><StepPad number="16" label="WRITE" isGlowing={getPadGlowingState(15)} onPointerDown={() => handlePadDown(15)} onPointerUp={handlePadUp} /></DocLink>
         </div>

         {/* Decorative Silkscreen Grouping Lines under pads */}
         <div className="absolute bottom-[14px] left-[320px] w-12 h-[1px] bg-gray-500"></div>
         <div className="absolute bottom-[14px] left-[550px] w-12 h-[1px] bg-gray-500"></div>
         <div className="absolute bottom-[14px] left-[665px] w-12 h-[1px] bg-gray-500"></div>
      </div>

    </div>
  );

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-sans select-none relative">
      <SidebarContextPortal>
        <S1SidebarContext />
      </SidebarContextPortal>

      {/* Center Panel */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden bg-background">
        <OscilloscopeDrawer />
        <DeviceHelpToggle guideUrl={s1GuideUrl} />
        <ScaleFit baseWidth={1000} baseHeight={500} maxScale={3}>
          {deviceContent}
        </ScaleFit>
      </div>
    </div>
  );
}
