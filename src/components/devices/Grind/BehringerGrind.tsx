import React, { useState, useRef } from 'react';
import ScaleFit from '../../Core/ui/ScaleFit';
import ResponsiveDrawer from '../../Core/ui/ResponsiveDrawer';
import ManualsList from '../../Core/ManualsList/ManualsList';

import { useGrindStore } from '../../../stores/useGrindStore';
import { cn } from '../../../lib/utils';

// --- ICONS & SVGS ---

const Screw = () => (
  <svg width="12" height="12" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#333" stroke="#111" strokeWidth="1" />
    <circle cx="12" cy="12" r="8" fill="#444" />
    <line x1="6" y1="12" x2="18" y2="12" stroke="#222" strokeWidth="2" transform="rotate(45 12 12)" />
  </svg>
);

const MidiPort = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-12 h-12 rounded-full bg-[#111] border-2 border-[#333] shadow-inner flex items-center justify-center relative">
      <div className="w-8 h-8 rounded-full border border-[#222] relative">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute top-3 left-1 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute top-3 right-1 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-black rounded-full" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-black rounded-full" />
        {/* Notch */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111]" />
      </div>
    </div>
  </div>
);

// --- COMPONENTS ---

// Analog style knob with metallic cap
const Knob = ({ label, subLabel, size = 50, markerColor = "#fff", sectionId, onInteract }: any) => {
  const [rotation, setRotation] = useState(0); // -135 to 135 degrees
  const { hoveredDocSection, setHoveredDocSection } = useGrindStore();
  const isDragging = useRef(false);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY;
    startY.current = e.clientY;
    setRotation((prev) => Math.min(135, Math.max(-135, prev + deltaY * 2)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointerup', handlePointerUp);
    if (onInteract) onInteract();
  };

  return (
    <div 
      className="flex flex-col items-center group relative"
      onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
      onPointerLeave={() => sectionId && setHoveredDocSection(null)}
    >
      {label && <span className="text-[9px] text-white font-bold tracking-wider mb-1.5 z-10 text-center uppercase">{label}</span>}
      <div 
        className="relative flex justify-center items-center cursor-ns-resize"
        onPointerDown={handlePointerDown}
        onDoubleClick={() => { setRotation(0); if (onInteract) onInteract(); }}
        style={{ touchAction: 'none' }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className="drop-shadow-xl transition-transform group-active:scale-95"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <defs>
            <linearGradient id="knob-edge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#444" />
              <stop offset="50%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <radialGradient id="metal-cap" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="40%" stopColor="#888" />
              <stop offset="100%" stopColor="#333" />
            </radialGradient>
          </defs>
          {/* Base */}
          <circle cx="50" cy="50" r="48" fill="url(#knob-edge)" stroke="#000" strokeWidth="2" />
          {/* Metal Cap */}
          <circle cx="50" cy="50" r="32" fill="url(#metal-cap)" stroke="#111" strokeWidth="1" />
          {/* Indicator */}
          <line 
            x1="50" y1="50" x2="50" y2="12" 
            stroke={markerColor} 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          {/* Base shadow ring */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="4" />
        </svg>
        <div className={cn(
          "absolute inset-0 rounded-full pointer-events-none transition-all duration-300", 
          sectionId ? "group-hover:ring-2 group-hover:ring-cyan-500 group-hover:shadow-[0_0_15px_cyan]" : "",
          hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : ''
        )} />
      </div>
      {subLabel && <span className="text-[8px] text-gray-400 font-bold tracking-wide mt-1 text-center uppercase">{subLabel}</span>}
    </div>
  );
};

// 3.5mm Patch Jack
const PatchJack = ({ label, sectionId, onInteract }: any) => {
  const { hoveredDocSection, setHoveredDocSection } = useGrindStore();
  
  return (
    <div 
      className="flex flex-col items-center relative"
      onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
      onPointerLeave={() => sectionId && setHoveredDocSection(null)}
      onClick={() => onInteract && onInteract()}
    >
      <span className="text-[7px] text-white font-bold tracking-widest mb-1 whitespace-nowrap cursor-pointer">{label}</span>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 via-gray-500 to-gray-700 p-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-gray-900">
        <div className="w-full h-full rounded-full bg-black border border-gray-600 shadow-inner flex items-center justify-center cursor-pointer">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0a] shadow-[inset_0_2px_4px_rgba(0,0,0,1)]"></div>
        </div>
        <div className={cn("absolute inset-0 top-4 rounded-full pointer-events-none transition-all duration-300", hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
      </div>
    </div>
  );
};

// Metal Toggle Switch
const ToggleSwitch = ({ label, topLabel, bottomLabel, threeWay = false, sectionId, onInteract }: any) => {
  const [pos, setPos] = useState(0); // -1 (bottom), 0 (middle), 1 (top)
  const { hoveredDocSection, setHoveredDocSection } = useGrindStore();

  const toggle = () => {
    if (threeWay) {
      setPos(p => p === 1 ? 0 : (p === 0 ? -1 : 1));
    } else {
      setPos(p => p === 1 ? -1 : 1);
    }
    if (onInteract) onInteract();
  };

  const translateY = pos === 1 ? '-4px' : pos === -1 ? '4px' : '0px';
  const rotateX = pos === 1 ? '30deg' : pos === -1 ? '-30deg' : '0deg';

  return (
    <div 
      className="flex flex-col items-center justify-center cursor-pointer select-none relative" 
      onClick={toggle}
      onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
      onPointerLeave={() => sectionId && setHoveredDocSection(null)}
    >
      {label && <span className="text-[8px] text-white font-bold tracking-wider mb-1 text-center">{label}</span>}
      
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] text-gray-300 font-bold">{topLabel}</span>
        
        <div className="w-4 h-8 bg-[#111] rounded-sm relative flex justify-center items-center border border-[#333] shadow-inner">
          <div className="w-3 h-5 bg-black rounded-sm absolute" />
          <div 
            className="w-2 h-5 bg-gradient-to-b from-gray-200 via-gray-400 to-gray-500 rounded-sm shadow-[0_2px_3px_rgba(0,0,0,0.8)] transition-all duration-150 border border-gray-600"
            style={{ transform: `translateY(${translateY}) perspective(50px) rotateX(${rotateX})` }}
          />
          <div className={cn("absolute -inset-1 rounded-sm pointer-events-none transition-all duration-300", hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
        </div>

        <span className="text-[7px] text-gray-300 font-bold">{bottomLabel}</span>
      </div>
    </div>
  );
};

// Small Sequencer Function Button
const FuncButton = ({ label, subLabel, isDark = true, sectionId, onInteract }: any) => {
  const [active, setActive] = useState(false);
  const { hoveredDocSection, setHoveredDocSection } = useGrindStore();
  
  return (
    <div 
      className="flex flex-col items-center relative"
      onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
      onPointerLeave={() => sectionId && setHoveredDocSection(null)}
    >
      <button 
        onMouseDown={() => { setActive(true); if (onInteract) onInteract(); }}
        onMouseUp={() => setActive(false)}
        onMouseLeave={() => setActive(false)}
        className={`w-10 h-6 rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-all duration-75 
          ${isDark ? 'bg-[#222] border-b-2 border-[#0a0a0a]' : 'bg-[#fff] border-b-2 border-[#ccc]'}
          ${active ? 'translate-y-[2px] border-b-0 shadow-none' : ''}
        `}
      />
      <div className={cn("absolute top-0 w-10 h-6 pointer-events-none rounded-sm transition-all duration-300", hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
      <div className="mt-1 flex flex-col items-center">
        {label && <span className="text-[7px] text-white font-bold leading-tight">{label}</span>}
        {subLabel && <span className="text-[7px] text-white font-bold leading-tight">{subLabel}</span>}
      </div>
    </div>
  );
};

// Red Sequencer Step Button
const StepButton = ({ num }: any) => {
  const [active, setActive] = useState(false);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={() => setActive(!active)}
        className={`w-10 h-7 rounded-[3px] border border-black shadow-[0_2px_5px_rgba(0,0,0,0.8)] transition-all duration-100 relative overflow-hidden
          ${active 
            ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8),inset_0_2px_5px_rgba(255,255,255,0.4)] translate-y-[1px]' 
            : 'bg-red-900 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]'
          }
        `}
      >
        <div className={`absolute top-0 w-full h-1/2 bg-white opacity-10 rounded-t-[3px] ${active ? 'opacity-20' : ''}`} />
      </button>
      <span className="text-[8px] text-gray-400 font-bold">{num}</span>
    </div>
  );
};

// --- LAYOUT WRAPPERS ---

const Section = ({ title, children, className = "" }: any) => (
  <div className={`border border-[#e65c00] flex flex-col relative ${className}`}>
    <div className="bg-[#e65c00] text-white text-[9px] font-bold px-2 py-0.5 tracking-wider absolute top-0 left-0 w-full">
      {title}
    </div>
    <div className="pt-6 pb-2 px-3 h-full flex flex-col justify-center">
      {children}
    </div>
  </div>
);

// --- MODEL ICONS (A & B Rows) ---

const IconsA = [
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M 3 14 L 9 14 L 9 6 L 15 6 L 15 14 L 21 14 M 3 18 L 21 18" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M 3 12 Q 7 2 12 12 T 21 12" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="4" y="6" width="6" height="6"/><rect x="14" y="12" width="6" height="6"/><path d="M 10 9 L 14 9 M 10 15 L 14 15 M 10 12 L 14 12" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22 V2 M12 6 Q8 4 10 10 M12 10 Q16 8 14 14 M12 14 Q8 12 10 18 M12 18 Q16 16 14 22" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...props}><path d="M 2 9 L 5 4 L 8 9 L 11 4 L 14 9 L 17 4 L 20 9 M 4 18 L 7 13 L 10 18 L 13 13 L 16 18 L 19 13" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="12" cy="5" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="19" r="2.5"/></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 4 C6.48 4 2 7.58 2 12 C2 14.54 3.46 16.81 5.8 18.27 L5 21 L8.36 19.86 C9.5 20.3 10.72 20.5 12 20.5 C17.52 20.5 22 16.92 22 12 C22 7.58 17.52 4 12 4 Z" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M 6 12 C 2 12 2 6 6 6 C 10 6 14 18 18 18 C 22 18 22 12 18 12 C 14 12 10 6 6 6 Z" /><path d="M 2 12 L 22 12" strokeDasharray="2 2" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}><path d="M 2 18 L 8 6 L 12 16 L 16 8 L 22 18" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><rect x="4" y="4" width="4" height="4"/><rect x="10" y="4" width="4" height="4"/><rect x="16" y="4" width="4" height="4"/><rect x="4" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="16" y="10" width="4" height="4"/><rect x="4" y="16" width="4" height="4"/><rect x="10" y="16" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/></svg>,
];

const IconsB = [
  (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" {...props}><circle cx="6" cy="18" r="1.5"/><path d="M6 18 L6 12"/><circle cx="12" cy="14" r="1.5"/><path d="M12 14 L12 8"/><circle cx="18" cy="20" r="1.5"/><path d="M18 20 L18 14"/></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}><path d="M 2 12 L 5 4 L 9 20 L 13 6 L 16 16 L 19 8 L 22 12" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><circle cx="6" cy="6" r="1.5"/><circle cx="18" cy="8" r="1"/><circle cx="12" cy="12" r="2"/><circle cx="8" cy="18" r="1"/><circle cx="16" cy="16" r="1.5"/><circle cx="10" cy="8" r="1"/><circle cx="14" cy="5" r="1.5"/><circle cx="20" cy="14" r="1"/></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M2 5 L22 5 M2 9 L22 9 M2 13 L22 13 M2 17 L22 17 M2 21 L22 21" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}><path d="M 2 12 L 4 4 L 8 20 L 12 4 L 16 20 L 20 4 L 22 12" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M6 16 L18 8" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M 3 12 Q 12 6 21 12 M 12 12 L 12 18 M 8 18 L 16 18" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}><path d="M 9 4 L 15 4 L 18 16 L 6 16 Z M 10 16 L 10 20 L 14 20 L 14 16" /></svg>,
  (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="4" y="10" width="6" height="6" rx="1"/><rect x="14" y="10" width="6" height="6" rx="1"/><path d="M 7 10 L 17 10 M 7 16 L 7 20 M 17 16 L 17 20" /></svg>,
];


// --- MAIN APP ---

export default function BehringerGrind() {
  const topPatchLabels = ['OSC TIMBRE', 'OSC HAR', 'OSC FM', 'OSC MORPH', 'VCF IN', 'VCF CUTOFF', 'VCF RES', 'MIX 1', 'MIX 2', 'VC MIX', 'VC MIX', 'LFO TRI', 'OSC OUT 1', 'OSC OUT 2', 'ENV', 'VCA/LINE', 'PHONES'];
  const bottomPatchLabels = ['OSC MODEL', 'OSC V/OCT', 'OSC LEVEL', 'OSC TRIG', 'TEMPO', 'PLAY/STOP', 'RESET', 'HOLD', 'ENV GATE', 'VCA CV', 'LFO RATE', 'LFO SQU', 'NOISE', 'ASSIGN', 'KB CV', 'GATE', 'VCF'];

  // State for Bank (0: Red, 1: Green, 2: Yellow) and Model Grid position (0-9)
  const [bank, setBank] = useState(0); 
  const [model, setModel] = useState(0);
  const { setActiveDocSection, hoveredDocSection, setHoveredDocSection } = useGrindStore();

  const handleBankClick = () => {
    setActiveDocSection('213-bank-button');
    setBank((prev) => {
      const nextBank = (prev + 1) % 3;
      // When switching to Bank C (Yellow), restrict models to 1-4 (indexes 0-3)
      if (nextBank === 2 && model > 3) {
        setModel(0);
      }
      return nextBank;
    });
  };

  const handleModelIncrement = () => {
    setActiveDocSection('214-model-button');
    setModel((prev) => {
      const max = bank === 2 ? 4 : 10;
      return (prev + 1) % max;
    });
  };

  const handleModelDecrement = () => {
    setActiveDocSection('214-model-button');
    setModel((prev) => {
      const max = bank === 2 ? 4 : 10;
      return (prev - 1 + max) % max;
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 overflow-hidden">
      <div className="flex flex-1 min-h-0">
        
        {/* Left Panel */}
        <ResponsiveDrawer className="bg-card border-r border-border">
          <div className="mt-2 px-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Actions</h3>
              <div className="text-xs text-neutral-400 p-2 border border-neutral-800 rounded bg-neutral-900/50">
                Sequencer and patch management for Behringer Grind will appear here.
              </div>
            </div>
            <ManualsList devicePrefix="behringer-grind" />
          </div>
        </ResponsiveDrawer>

        {/* Center Panel */}
        <div className="flex-1 min-h-full h-full w-full bg-[#111] font-sans select-none overflow-hidden relative">
          <ScaleFit baseWidth={1150} baseHeight={700} maxScale={4}>
            {/* Synth Chassis with Wood Panels */}
            <div className="flex shadow-2xl relative shrink-0 origin-center transition-transform">
          
          {/* Left Wood Panel */}
        <div className="w-4 rounded-l-md border-r border-[#3a1f10] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)]" 
             style={{ background: 'linear-gradient(to right, #6d3a1c, #8b4a24)' }}></div>
        
        {/* Main Aluminum Panel */}
        <div className="w-[1050px] bg-[#242424] p-4 flex flex-col gap-4 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-y-2 border-[#1a1a1a]">
          
          {/* Screws */}
          <div className="absolute top-2 left-2"><Screw /></div>
          <div className="absolute top-2 right-2"><Screw /></div>
          <div className="absolute bottom-2 left-2"><Screw /></div>
          <div className="absolute bottom-2 right-2"><Screw /></div>

          {/* TOP ROW: PATCH BAY & MIDI */}
          <div className="flex w-full mt-4 pl-4 pr-2">
            {/* MIDI Ports */}
            <div className="flex gap-4 pr-6 border-r border-gray-700 mr-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-white font-bold mb-2">MIDI IN</span>
                <MidiPort />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-white font-bold mb-2">MIDI OUT/THRU</span>
                <MidiPort />
              </div>
            </div>

            {/* Patch Matrix */}
            <div className="flex-1 flex flex-col gap-3 relative">
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col text-[8px] text-white font-bold gap-4">
                <span>IN</span>
                <span>OUT</span>
              </div>
              
              <div className="flex justify-between w-full pr-4">
                {topPatchLabels.map((lbl, i) => <PatchJack key={`top-${i}`} label={lbl} />)}
              </div>
              <div className="flex justify-between w-full pr-4">
                {bottomPatchLabels.map((lbl, i) => <PatchJack key={`bot-${i}`} label={lbl} />)}
              </div>
            </div>
          </div>

          {/* MIDDLE ROWS: SYNTHESIS SECTIONS */}
          <div className="flex flex-col gap-[1px] bg-[#e65c00] border-2 border-[#e65c00]">
            
            {/* ROW 1: Osc, Filter, VCA */}
            <div className="grid grid-cols-10 gap-[1px] bg-[#e65c00]">
              
              {/* OSCILLATOR */}
              <Section title="OSCILLATOR" className="col-span-5 bg-[#242424]">
                <div className="flex justify-around items-start">
                  <Knob label="TIMBRE" sectionId="211-timbre" onInteract={() => setActiveDocSection('211-timbre')} />
                  <Knob label="HARMONICS" sectionId="215-harmonics" onInteract={() => setActiveDocSection('215-harmonics')} />
                  <div className="flex flex-col items-center pt-6 px-2 group relative cursor-pointer" onPointerDown={() => setActiveDocSection('216-fm-knob')} onPointerEnter={() => setHoveredDocSection('216-fm-knob')} onPointerLeave={() => setHoveredDocSection(null)}>
                    <span className="text-[8px] text-white font-bold mb-1">FM</span>
                    <div className="relative">
                      <Knob size={24} sectionId="216-fm-knob" />
                    </div>
                    <span className="text-[8px] text-white font-bold mt-1">-      +</span>
                    <div className={cn("absolute inset-0 rounded-lg pointer-events-none transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-500 group-hover:shadow-[0_0_15px_cyan]", hoveredDocSection === '216-fm-knob' ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
                  </div>
                  <Knob label="FREQUENCY" sectionId="217-frequency-knob" onInteract={() => setActiveDocSection('217-frequency-knob')} />
                  <Knob label="MORPH" sectionId="218-morph-knob" onInteract={() => setActiveDocSection('218-morph-knob')} />
                </div>
                
                <div className="flex justify-around items-end mt-4 px-4">
                  <div className="flex gap-4 items-center">
                    
                    {/* Bank Controls */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] text-white font-bold">BANK</span>
                      <button 
                        onClick={handleBankClick}
                        className={`w-6 h-6 rounded-sm active:translate-y-[1px] transition-colors ${
                          bank === 0 ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)]' :
                          bank === 1 ? 'bg-green-600 shadow-[0_0_8px_rgba(34,197,94,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)]' :
                          'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)]'
                        }`}
                      ></button>
                    </div>
                    
                    {/* Beautiful New Model LED Grid */}
                    <div className="flex gap-3 bg-[#111] p-2.5 rounded-md border-2 border-[#2a2a2a] shadow-inner items-center">
                      
                      {/* Labels A & B */}
                      <div className="flex flex-col justify-between h-[68px] font-bold text-[14px]">
                        <span className={`leading-none transition-colors ${bank === 0 ? 'text-white' : 'text-gray-500'}`}>A</span>
                        <span className={`leading-none transition-colors ${bank === 1 ? 'text-white' : 'text-gray-500'}`}>B</span>
                      </div>

                      {/* Grid Container */}
                      <div className="flex flex-col gap-2">
                        
                        {/* ROW A ICONS (White outlines on Dark) */}
                        <div className="flex gap-1.5">
                          {IconsA.map((Icon, i) => {
                            const sectionId = `51${i + 1}-${i === 0 ? 'virtual-analog' : i === 1 ? 'waveshaping' : i === 2 ? 'fm-2-operators' : i === 3 ? 'grains' : i === 4 ? 'additive' : i === 5 ? 'chords' : i === 6 ? 'speech' : i === 7 ? 'karplus-strong' : i === 8 ? 'supersaw' : 'wavetable-oscillator'}`;
                            return (
                              <div 
                                key={`a-${i}`} 
                                className={cn(
                                  "w-6 h-6 rounded-[3px] border-[1.5px] border-gray-300 flex items-center justify-center bg-transparent text-gray-200 cursor-pointer transition-all duration-300",
                                  hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : ''
                                )}
                                onClick={() => setActiveDocSection(sectionId)}
                                onPointerEnter={() => setHoveredDocSection(sectionId)}
                                onPointerLeave={() => setHoveredDocSection(null)}
                              >
                                 <Icon className="w-4 h-4 pointer-events-none" />
                              </div>
                            );
                          })}
                        </div>

                        {/* CENTER LEDS */}
                        <div className="flex gap-1.5 justify-around">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                            const isActive = i === model;
                            const isInvalid = bank === 2 && i > 3; // Bank C (Yellow) only uses first 4
                            let colorClass = 'bg-[#333] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'; // Off state
                            let sectionId = '';
                            
                            if (bank === 0) {
                              sectionId = `51${i + 1}-${i === 0 ? 'virtual-analog' : i === 1 ? 'waveshaping' : i === 2 ? 'fm-2-operators' : i === 3 ? 'grains' : i === 4 ? 'additive' : i === 5 ? 'chords' : i === 6 ? 'speech' : i === 7 ? 'karplus-strong' : i === 8 ? 'supersaw' : 'wavetable-oscillator'}`;
                            } else if (bank === 1) {
                              sectionId = `52${i + 1}-${i === 0 ? 'rain' : i === 1 ? 'noise' : i === 2 ? 'dust' : i === 3 ? 'modal-strings' : i === 4 ? 'fm-drum' : i === 5 ? 'bass-drum' : i === 6 ? 'snare-drum' : i === 7 ? 'hi-hat' : i === 8 ? 'cowbell' : 'toms'}`;
                            } else if (bank === 2 && i <= 3) {
                              sectionId = `53${i + 1}-${i === 0 ? 'bx7' : i === 1 ? 'bassline' : i === 2 ? 'wave-generator' : 'vox'}`;
                            }
                            
                            if (isActive) {
                               if (bank === 0) colorClass = 'bg-red-500 shadow-[0_0_8px_#f00]';
                               else if (bank === 1) colorClass = 'bg-green-500 shadow-[0_0_8px_#0f0]';
                               else if (bank === 2) colorClass = 'bg-yellow-400 shadow-[0_0_8px_#fbbf24]';
                            }

                            return (
                              <div 
                                key={`led-${i}`} 
                                className="w-6 flex justify-center cursor-pointer relative"
                                onClick={() => sectionId && setActiveDocSection(sectionId)}
                                onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
                                onPointerLeave={() => sectionId && setHoveredDocSection(null)}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${colorClass} ${isActive ? 'animate-pulse' : ''} ${isInvalid ? 'opacity-30' : ''}`} />
                                <div className={cn("absolute -inset-1 rounded-full pointer-events-none transition-all duration-300", hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
                              </div>
                            );
                          })}
                        </div>

                        {/* ROW B ICONS (Dark on Solid White) */}
                        <div className="flex gap-1.5">
                          {IconsB.map((Icon, i) => {
                            const sectionId = `52${i + 1}-${i === 0 ? 'rain' : i === 1 ? 'noise' : i === 2 ? 'dust' : i === 3 ? 'modal-strings' : i === 4 ? 'fm-drum' : i === 5 ? 'bass-drum' : i === 6 ? 'snare-drum' : i === 7 ? 'hi-hat' : i === 8 ? 'cowbell' : 'toms'}`;
                            return (
                              <div 
                                key={`b-${i}`} 
                                className={cn(
                                  "w-6 h-6 rounded-[3px] bg-gray-200 flex items-center justify-center text-black cursor-pointer transition-all duration-300",
                                  hoveredDocSection === sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : ''
                                )}
                                onClick={() => setActiveDocSection(sectionId)}
                                onPointerEnter={() => setHoveredDocSection(sectionId)}
                                onPointerLeave={() => setHoveredDocSection(null)}
                              >
                                 <Icon className="w-4 h-4 pointer-events-none" />
                              </div>
                            );
                          })}
                        </div>
                        
                      </div>
                    </div>

                    {/* Model Controls */}
                    <div className="flex flex-col items-center gap-1 ml-2">
                      <span className="text-[8px] text-white font-bold">MODEL</span>
                      <button 
                        onClick={handleModelIncrement}
                        className="w-6 h-6 bg-gray-900 border border-black rounded-sm shadow-[0_2px_2px_rgba(0,0,0,0.5)] active:translate-y-[1px]"
                      ></button>
                      <div className="text-[8px] text-white font-bold w-full flex justify-between px-1">
                        <span className="cursor-pointer active:text-gray-400 select-none px-1" onClick={handleModelDecrement}>-</span>
                        <span className="cursor-pointer active:text-gray-400 select-none px-1" onClick={handleModelIncrement}>+</span>
                      </div>
                    </div>

                  </div>
                </div>
              </Section>

              {/* FILTER */}
              <Section title="FILTER (VCF)" className="col-span-3 bg-[#242424]">
                <div className="flex justify-around items-start">
                  <Knob label="CUTOFF" sectionId="221-cutoff" onInteract={() => setActiveDocSection('221-cutoff')} />
                  <Knob label="RESONANCE" sectionId="223-resonance" onInteract={() => setActiveDocSection('223-resonance')} />
                  <Knob label="VCF MOD" sectionId="225-vcf-mod" onInteract={() => setActiveDocSection('225-vcf-mod')} />
                </div>
                <div className="flex justify-around items-start mt-6">
                  <ToggleSwitch label="MODE" topLabel="LO" bottomLabel="HI" sectionId="222-mode" onInteract={() => setActiveDocSection('222-mode')} />
                  <ToggleSwitch label="MOD SOURCE" topLabel="ENV" bottomLabel="LFO" sectionId="224-mod-source" onInteract={() => setActiveDocSection('224-mod-source')} />
                  <ToggleSwitch label="MOD POLARITY" topLabel="POS" bottomLabel="NEG" sectionId="226-mod-polarity" onInteract={() => setActiveDocSection('226-mod-polarity')} />
                </div>
              </Section>

              {/* OUTPUT */}
              <Section title="OUTPUT (VCA)" className="col-span-2 bg-[#242424]">
                <div className="flex flex-col items-center h-full justify-between pb-2">
                  <Knob label="VOLUME" sectionId="271-volume" onInteract={() => setActiveDocSection('271-volume')} />
                  <div className="mt-4 relative group cursor-pointer" onPointerEnter={() => setHoveredDocSection('272-vca-mode')} onPointerLeave={() => setHoveredDocSection(null)}>
                    <ToggleSwitch label="VCA MODE" topLabel="ENV" bottomLabel="ON" threeWay sectionId="272-vca-mode" onInteract={() => setActiveDocSection('272-vca-mode')} />
                    <span className="block text-[8px] text-gray-400 text-center -mt-3">LPG</span>
                    <div className={cn("absolute inset-0 -m-2 rounded-sm pointer-events-none transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-500 group-hover:shadow-[0_0_15px_cyan]", hoveredDocSection === '272-vca-mode' ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : '')} />
                  </div>
                </div>
              </Section>
            </div>

            {/* ROW 2: Env, Vib, Mod, Utility */}
            <div className="grid grid-cols-10 gap-[1px] bg-[#e65c00]">
              <Section title="ENVELOPE" className="col-span-4 bg-[#242424]">
                <div className="flex justify-around">
                  <Knob label="ATTACK" sectionId="23-envelope" onInteract={() => setActiveDocSection('23-envelope')} />
                  <Knob label="DECAY" sectionId="23-envelope" onInteract={() => setActiveDocSection('23-envelope')} />
                  <Knob label="SUSTAIN" sectionId="23-envelope" onInteract={() => setActiveDocSection('23-envelope')} />
                </div>
              </Section>

              <Section title="VIBRATO" className="col-span-2 bg-[#242424]">
                <div className="flex justify-center">
                  <Knob label="OSC MOD" sectionId="24-vibrato" onInteract={() => setActiveDocSection('24-vibrato')} />
                </div>
              </Section>

              <Section title="MODULATION" className="col-span-2 bg-[#242424]">
                <div className="flex justify-around items-end pb-2">
                  <div className="relative">
                    <Knob label="LFO RATE" sectionId="25-modulation" onInteract={() => setActiveDocSection('25-modulation')} />
                    <div className="absolute top-4 -right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#f00]"></div>
                  </div>
                  <ToggleSwitch label="SHAPE" topLabel="SQR" bottomLabel="TRI" sectionId="25-modulation" onInteract={() => setActiveDocSection('25-modulation')} />
                </div>
              </Section>

              <Section title="UTILITY" className="col-span-2 bg-[#242424]">
                <div className="flex justify-around">
                  <Knob label="GLIDE" sectionId="261-glide" onInteract={() => setActiveDocSection('261-glide')} />
                  <Knob label="VC MIX" subLabel="LO / MIX 1        HI / MIX 2" sectionId="262-vc-mix" onInteract={() => setActiveDocSection('262-vc-mix')} />
                </div>
              </Section>
            </div>
          </div>

          {/* BOTTOM ROW: SEQUENCER */}
          <div className="border-t-4 border-[#e65c00] mt-2 pt-4 flex gap-8 items-end relative">
            <span className="absolute top-0 left-2 text-[#e65c00] text-[9px] font-bold px-1 bg-[#242424] -translate-y-1/2">SEQUENCER</span>

            {/* Tempo */}
            <div className="pl-4 pb-2">
              <Knob label="TEMPO / GATE LENGTH" subLabel="SWING" sectionId="31-tempogate-length" onInteract={() => setActiveDocSection('31-tempogate-length')} />
            </div>

            {/* Command Buttons */}
            <div className="flex flex-col gap-3 pb-2">
              <div className="flex gap-2">
              </div>
              <div className="flex gap-2">
                <FuncButton label="SHIFT" isDark={false} />
                <FuncButton label="PAGE" />
                <FuncButton label="PLAY/STOP" />
                <FuncButton label="REC" />
              </div>
            </div>

            {/* Location & Navigation */}
            <div className="flex flex-col items-center gap-4 pb-2 px-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-white font-bold mb-1">OCTAVE / LOCATION</span>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${i===1 ? 'bg-green-500 shadow-[0_0_6px_#0f0]' : i===4 ? 'bg-red-500 shadow-[0_0_6px_#f00]' : 'bg-gray-600'}`}></div>
                      <span className="text-[7px] text-gray-400 font-bold">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-6 h-4 bg-[#222] border-b border-[#111] text-white flex justify-center items-center rounded-sm text-[10px] active:translate-y-[1px]">◄</button>
                <FuncButton label="KYBD" />
                <FuncButton label="STEP" />
                <button className="w-6 h-4 bg-[#222] border-b border-[#111] text-white flex justify-center items-center rounded-sm text-[10px] active:translate-y-[1px]">►</button>
              </div>
            </div>

            {/* Branding & Steps */}
            <div className="flex-1 flex flex-col items-end gap-2 pb-2 pr-4">
              <div className="flex gap-8 items-center pr-2 mb-2">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] text-white font-bold">POWER</span>
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#fbbf24]"></div>
                </div>
              </div>
              
              <div className="flex gap-1.5 w-full justify-between">
                {[1,2,3,4,5,6,7,8].map(i => <StepButton key={i} num={i} />)}
              </div>
            </div>

          </div>

        </div>

        {/* Right Wood Panel */}
        <div className="w-4 rounded-r-md border-l border-[#3a1f10] shadow-[inset_2px_0_4px_rgba(0,0,0,0.5)]" 
             style={{ background: 'linear-gradient(to left, #6d3a1c, #8b4a24)' }}></div>
      
          </div>
            </ScaleFit>
        </div>

      </div>
    </div>
  );
}
