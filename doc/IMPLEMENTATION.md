# Trackster Implementation & Architecture Guide

# Overview

# Trackster Overview Tab Proposal

The following React component is a proposed visual overview tab for Trackster. It is saved here as reference code only and is not yet wired into the application.

```tsx
/* 
 * ALIENMIND HYBRID SETUP BUILDER (v4.0)
 * -------------------------------------
 * Features & Specifications:
 * 1. Interactive Node Architecture: Drag and drop hardware nodes around the canvas.
 * 2. Dynamic Cable Routing: Cables have draggable start and end points. Drop them on a node to snap.
 * 3. Color-Coded Technical Cables: Audio TS, Audio TRS, Sidechain Pump, MIDI DIN, and MIDI USB.
 * 4. Editable Overviews & I/O: Each node has a collapsible panel to document Audio/MIDI ins and outs.
 * 5. Inline Cable Labels: Double-click any cable label floating in the middle of the wire to edit its text.
 * 6. Local Storage Persistence: Save your layout (positions, routes, text) and restore it later.
 * 7. High-Fidelity Vector Graphics: SVG/CSS accurate representations of specific hardware (Stellar, Grind, S-1, etc).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Circle, Square, ChevronDown, ChevronRight, Laptop } from 'lucide-react';

// Technical Cable Dictionary
const CABLE_TYPES = {
  audio_ts: { label: "Audio: TS (Mono)", category: "audio", color: "#f97316", stroke: 3, dash: "none", marker: "url(#arrowOrange)", filter: "url(#glowOrange)" },
  audio_trs: { label: "Audio: TRS (Stereo)", category: "audio", color: "#06b6d4", stroke: 4, dash: "none", marker: "url(#arrowCyan)", filter: "url(#glowCyan)" },
  audio_sidechain: { label: "Audio: Sidechain (Pump)", category: "audio", color: "#a855f7", stroke: 4, dash: "none", marker: "url(#arrowPurple)", filter: "url(#glowPurple)", animate: true },
  midi_din: { label: "MIDI: 5-Pin DIN", category: "midi", color: "#10b981", stroke: 3, dash: "6 4", marker: "url(#arrowEmerald)", filter: "none" },
  midi_usb: { label: "MIDI: USB Data", category: "midi", color: "#3b82f6", stroke: 3, dash: "3 3", marker: "url(#arrowBlue)", filter: "none" }
};

// Stable Visual Hardware Library
const HARDWARE_LIBRARY = {
  minifreak: {
    brand: "Arturia", model: "MiniFreak Stellar", tagline: "POLYPHONIC SYNTH", width: 300,
    theme: { border: "border-t-zinc-500", header: "bg-zinc-950", title: "text-zinc-300", badge: "bg-zinc-800 text-zinc-400" },
    visual: () => (
      <div className="w-full h-28 bg-neutral-900 rounded border border-neutral-700 flex flex-col justify-between p-2 shadow-inner pointer-events-none">
         {/* Top Section */}
         <div className="flex justify-between w-full px-1">
           {/* Mod Matrix */}
           <div className="grid grid-cols-5 gap-[2px] w-1/4">
               {[...Array(25)].map((_,i) => <div key={`mod-${i}`} className="w-1 h-1 bg-neutral-600 rounded-full"></div>)}
           </div>
           {/* Center Knobs & Screen */}
           <div className="flex flex-col items-center gap-1 w-1/2">
               <div className="flex gap-2">
                 {[...Array(4)].map((_,i) => (
                   <div key={`oknob-${i}`} className="w-4 h-4 rounded-full bg-neutral-800 border-2 border-orange-500 flex items-center justify-center relative">
                     <div className="absolute top-0 w-0.5 h-1.5 bg-white rounded-full"></div>
                   </div>
                 ))}
               </div>
               <div className="w-16 h-4 bg-cyan-950 rounded border border-cyan-800 flex items-center justify-center">
                 <span className="text-[5px] text-cyan-400 font-mono">INIT_PRESET</span>
               </div>
           </div>
           {/* Right Filter Knobs */}
           <div className="grid grid-cols-3 gap-1 w-1/4">
               {[...Array(6)].map((_,i) => <div key={`fknob-${i}`} className="w-3 h-3 rounded-full bg-neutral-700 border border-neutral-500"></div>)}
           </div>
         </div>
         {/* Orange Stripe */}
         <div className="w-full h-1 bg-orange-500 mt-auto mb-1 rounded-sm shadow-[0_0_5px_#f97316]"></div>
         {/* Stellar Dark Keys */}
         <div className="flex w-full bg-[#111] rounded h-8 border-t border-neutral-800">
            {[...Array(15)].map((_,i) => (
              <div key={`key-${i}`} className="flex-1 border-r border-neutral-800 relative bg-neutral-900">
                {/* Black Key Simulation (Stellar edition implies inverted/dark look) */}
                {[1,2,4,5,6,8,9,11,12,13].includes(i) && (
                  <div className="absolute top-0 -left-1 w-2 h-4 bg-black rounded-b-sm z-10 shadow-sm border-x border-b border-neutral-800"></div>
                )}
              </div>
            ))}
         </div>
      </div>
    )
  },
  grind: {
    brand: "Behringer", model: "Grind", tagline: "HYBRID SEMI-MODULAR", width: 340,
    theme: { border: "border-t-[#8b4513]", header: "bg-[#2a1a10]", title: "text-orange-400", badge: "bg-[#3a2010] text-orange-200" },
    visual: () => (
      <div className="w-full bg-[#222] border-x-8 border-[#8b4513] p-2 flex flex-col gap-2 relative pointer-events-none rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
        {/* Top Row: MIDI & Patchbay (2x16) */}
        <div className="flex justify-between items-start w-full relative">
            <div className="flex gap-1.5 ml-1 mt-1">
                <div className="w-7 h-7 rounded-full bg-[#111] border border-neutral-600 shadow-inner flex items-center justify-center"><Circle size={10} className="text-neutral-500"/></div>
                <div className="w-7 h-7 rounded-full bg-[#111] border border-neutral-600 shadow-inner flex items-center justify-center"><Circle size={10} className="text-neutral-500"/></div>
            </div>
            {/* 2x16 Patchbay */}
            <div className="grid grid-cols-16 grid-rows-2 gap-[3px] border border-neutral-700 p-1.5 bg-[#151515] rounded-sm relative overflow-hidden">
               {[...Array(32)].map((_,i) => (
                 <div key={`patch-${i}`} className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600 shadow-[inset_0_1px_2px_rgba(0,0,0,1)]"></div>
               ))}
               {/* Overlapping Patch Cables */}
               <svg className="absolute inset-0 w-full h-full z-10" style={{ overflow: 'visible' }}>
                  <path d="M 10 5 C 30 -10, 50 -10, 70 5" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" className="drop-shadow-md" />
                  <path d="M 120 5 C 130 20, 150 20, 160 15" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" className="drop-shadow-md" />
                  <path d="M 40 18 C 60 30, 90 30, 100 18" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" className="drop-shadow-md" />
               </svg>
            </div>
        </div>
        <div className="w-full bg-orange-500 h-[2px] rounded-full opacity-80"></div>
        
        {/* Middle Row: Knobs 2x8 */}
        <div className="grid grid-cols-8 gap-y-3 gap-x-2 w-full px-1">
            {[...Array(16)].map((_,i) => (
                <div key={`grind-knob-${i}`} className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border-[3px] border-[#111] shadow-[0_2px_3px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
                        <div className="absolute top-0 w-0.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
        <div className="w-full bg-orange-500 h-[2px] rounded-full opacity-80 mt-1"></div>
        
        {/* Bottom Row: Sequencer Keys (Red) */}
        <div className="flex justify-between items-end gap-1 mt-1 w-full px-1">
            <div className="grid grid-cols-4 gap-1">
                {[...Array(4)].map((_,i) => <div key={`seq-ctrl-${i}`} className="w-5 h-3 bg-neutral-800 rounded-sm border-b-2 border-neutral-950"></div>)}
            </div>
            <div className="flex gap-1.5">
                {[...Array(8)].map((_,i) => (
                  <div key={`seq-key-${i}`} className="w-6 h-5 bg-red-600 rounded-sm shadow-[0_0_8px_#ef4444] border-b-[3px] border-red-900 flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-white/50 rounded-full"></div>
                  </div>
                ))}
            </div>
        </div>
      </div>
    )
  },
  s1: {
    brand: "Roland", model: "S-1 Tweak Synth", tagline: "AIRA COMPACT", width: 240,
    theme: { border: "border-t-emerald-500", header: "bg-emerald-950", title: "text-emerald-400", badge: "bg-emerald-900 text-emerald-200" },
    visual: () => (
      <div className="w-full bg-[#151515] rounded border border-neutral-700 flex flex-col p-2 gap-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none">
         {/* Top Jacks */}
         <div className="flex justify-between items-center w-full">
           <span className="text-[7px] font-bold text-white tracking-widest italic ml-1">Roland <span className="font-normal text-emerald-500">S-1</span></span>
           <div className="flex gap-1.5 mr-1">
             {[...Array(5)].map((_,i) => <div key={`jack-${i}`} className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600 shadow-inner"></div>)}
           </div>
         </div>
         
         {/* Main controls (Screen + Knobs) */}
         <div className="flex gap-2 w-full mt-1">
           <div className="w-1/3 flex flex-col gap-1.5 items-center">
             <div className="w-full bg-black border border-neutral-800 rounded p-1.5 flex justify-center shadow-inner">
               <span className="text-red-500 font-mono text-[11px] font-bold tracking-widest leading-none drop-shadow-[0_0_4px_rgba(239,68,68,0.9)]">1.2.8.0</span>
             </div>
             <div className="w-6 h-6 mt-1 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md relative"><div className="absolute top-1 w-1 h-1 bg-white rounded-full"></div></div>
           </div>
           <div className="w-2/3 grid grid-cols-4 gap-y-2 gap-x-1 pl-1">
             {[...Array(12)].map((_,i) => (
               <div key={`s1knob-${i}`} className="flex flex-col items-center">
                 <div className={`w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center relative ${i%4===1 || i%4===2 ? 'border-t-teal-500/80' : 'border-t-orange-500/80'}`}>
                   <div className="absolute top-0 w-0.5 h-1.5 bg-white rounded-full"></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
         
         {/* Upper sequence buttons */}
         <div className="flex justify-between px-1 mt-1">
           {[...Array(8)].map((_,i) => <div key={`btn-u-${i}`} className="w-4 h-2.5 bg-neutral-700 rounded-sm border-b-2 border-neutral-900 shadow-sm"></div>)}
         </div>
         
         {/* Lower rubber piano buttons */}
         <div className="grid grid-cols-16 gap-[2px] w-full h-5 mt-1">
           {[1,1,0,0,1,0,1,0,1,1,1,1,1,1,0,1].map((isOrange, i) => (
             <div key={`btn-l-${i}`} className={`rounded-sm border-b-[3px] shadow-sm flex items-center justify-center
               ${isOrange ? 'bg-orange-500 border-orange-700' : 'bg-neutral-300 border-neutral-500'}`}>
                 <span className="text-[4px] font-bold text-black/50">{i+1}</span>
             </div>
           ))}
         </div>
      </div>
    )
  },
  circuit: {
    brand: "Novation", model: "Circuit Tracks", tagline: "GROOVEBOX / SEQUENCER", width: 280,
    theme: { border: "border-t-purple-500", header: "bg-purple-950", title: "text-purple-400", badge: "bg-purple-900 text-purple-200" },
    visual: () => (
      <div className="w-full bg-[#1c1c21] rounded-md border border-neutral-800 p-2 shadow-inner flex flex-col gap-2 pointer-events-none">
         {/* Knobs */}
         <div className="flex justify-between items-start mb-1 px-1">
            <div className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center shadow-md"><div className="w-0.5 h-2 bg-white rounded-full -mt-2"></div></div>
            <div className="flex flex-col gap-1 w-2/3">
                <div className="flex justify-between px-1">
                   {[...Array(4)].map((_,i) => <div key={`t-${i}`} className="w-5 h-5 rounded-full bg-neutral-800 border-2 border-purple-900/50 shadow-sm relative"><div className="absolute inset-1 rounded-full border border-purple-500/30"></div></div>)}
                </div>
                <div className="flex justify-between px-2">
                   {[...Array(4)].map((_,i) => <div key={`b-${i}`} className="w-5 h-5 rounded-full bg-neutral-800 border-2 border-purple-900/50 shadow-sm relative"><div className="absolute inset-1 rounded-full border border-purple-500/30"></div></div>)}
                </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center shadow-md"><div className="w-0.5 h-3 bg-white rounded-full -mt-2"></div></div>
         </div>
         {/* System buttons */}
         <div className="flex flex-col gap-0.5">
             <div className="flex justify-between gap-0.5">
                 {[1,1,1,1,2,1,1].map((flex, i) => <div key={`sys1-${i}`} className="h-3 bg-[#111] rounded-sm border border-[#222]" style={{flex: flex}}></div>)}
             </div>
             <div className="flex justify-between gap-0.5">
                 <div className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="flex-1 h-3 bg-purple-900/40 rounded-sm border border-[#222]"></div>
                 <div className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="flex-[4] flex gap-0.5">{[...Array(4)].map((_,i) => <div key={`sys2-${i}`} className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>)}</div>
                 <div className="flex-1 h-3 bg-[#111] rounded-sm border border-[#222]"></div>
             </div>
         </div>
         {/* 4x8 Pads Grid */}
         <div className="flex gap-1 mt-1">
             <div className="w-4 flex flex-col gap-0.5">{[...Array(4)].map((_,i) => <div key={`L-${i}`} className="w-full flex-1 bg-[#111] rounded-sm border border-[#222]"></div>)}</div>
             <div className="flex-1 grid grid-rows-4 grid-cols-8 gap-1 aspect-[2/1]">
                 {[...Array(32)].map((_,i) => (
                    <div key={`pad-${i}`} className={`rounded-sm shadow-[inset_0_0_4px_rgba(255,255,255,0.2)] ${i < 8 ? 'bg-[#00f0ff]' : i < 16 ? 'bg-[#00a2ff]' : 'bg-[#f000ff]'}`}></div>
                 ))}
             </div>
             <div className="w-4 flex flex-col gap-0.5">
                 <div className="w-full flex-1 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="w-full flex-1 bg-[#111] rounded-sm border border-[#222]"></div>
                 <div className="w-full flex-1 bg-[#111] rounded-sm border border-[#222] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div></div>
                 <div className="w-full flex-1 bg-[#111] rounded-sm border border-[#222] flex items-center justify-center"><div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[4px] border-l-green-400 border-b-[3px] border-b-transparent"></div></div>
             </div>
         </div>
      </div>
    )
  },
  flow8: {
    brand: "Behringer", model: "Flow 8", tagline: "DIGITAL MIXER", width: 250,
    theme: { border: "border-t-slate-300", header: "bg-slate-800", title: "text-white", badge: "bg-slate-700 text-slate-300" },
    visual: () => (
      <div className="w-full h-36 bg-zinc-200 rounded border-2 border-zinc-400 flex flex-col p-1.5 pointer-events-none relative overflow-hidden shadow-inner">
        <div className="absolute top-0 left-0 w-full h-10 bg-zinc-300 border-b border-zinc-400"></div>
        {/* Top XLRs */}
        <div className="flex justify-between w-full mb-3 z-10 px-1">
            <div className="flex gap-1.5">
                {[...Array(4)].map((_,i) => <div key={`xlr-${i}`} className="w-5 h-5 rounded-full bg-black border border-neutral-400 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-zinc-700"></div></div>)}
            </div>
            <div className="flex gap-1.5">
                {[...Array(2)].map((_,i) => <div key={`xlrout-${i}`} className="w-5 h-5 rounded-full bg-black border border-neutral-400 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-zinc-700"></div></div>)}
            </div>
        </div>
        {/* Faders & Screen */}
        <div className="flex w-full gap-2 z-10">
            <div className="flex-1 flex gap-1">
                {[...Array(6)].map((_,i) => (
                    <div key={`fader-${i}`} className="flex-1 flex flex-col items-center">
                        <div className="w-1.5 h-16 bg-neutral-900 rounded-full relative shadow-inner border border-neutral-700">
                           <div className={`absolute w-4 h-5 bg-neutral-800 rounded shadow-[0_2px_4px_rgba(0,0,0,0.8)] -left-[5px] border-b-2 border-neutral-600 flex items-center justify-center ${i===5 ? 'bottom-2 border-red-500' : 'bottom-4'}`}>
                               <div className="w-full h-0.5 bg-white/30"></div>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="w-1/3 flex flex-col items-center justify-end gap-1.5 pb-1">
                 <div className="w-10 h-6 bg-cyan-950 border-2 border-neutral-800 rounded flex items-center justify-center shadow-inner">
                     <span className="text-[4px] text-cyan-400">MAIN FX</span>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-neutral-900 relative flex items-center justify-center shadow-lg">
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_3px_#22c55e]"></div>
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_3px_#22c55e]"></div>
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_3px_#22c55e]"></div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    )
  },
  ableton: {
    brand: "Ableton", model: "Live 12", tagline: "DAW / MASTERING", width: 200,
    theme: { border: "border-t-neutral-100", header: "bg-neutral-800", title: "text-white", badge: "bg-neutral-700 text-neutral-300" },
    visual: () => (
      <div className="w-full flex flex-col items-center justify-center py-6 pointer-events-none bg-neutral-900 rounded shadow-inner border border-neutral-800 gap-3">
        <Laptop size={32} className="text-neutral-500" />
        <div className="flex gap-1.5 items-center">
            <div className="flex gap-1">
                {[...Array(4)].map((_,i) => <div key={`v-${i}`} className="w-1.5 h-6 bg-white rounded-sm"></div>)}
            </div>
            <div className="flex flex-col gap-1">
                {[...Array(4)].map((_,i) => <div key={`h-${i}`} className="w-6 h-1.5 bg-white rounded-sm"></div>)}
            </div>
        </div>
      </div>
    )
  }
};

const DEFAULT_NODES = {
  n_circuit: { id: 'n_circuit', type: 'circuit', x: 450, y: 500, zIndex: 10, isExpanded: true, overview: 'Brain. Sequences drums & handles sidechain ducking.', audioIn: 'S-1 / Grind (Mono)', audioOut: 'Flow8 Ch 3/4', midiIn: '-', midiOut: 'Thru chain', midiThru: '-' },
  n_grind: { id: 'n_grind', type: 'grind', x: 50, y: 400, zIndex: 11, isExpanded: true, overview: 'Aggressive bass/lead synth. Needs sidechain.', audioIn: '-', audioOut: 'Circuit In 1', midiIn: 'From MiniFreak', midiOut: '-', midiThru: 'To S-1' },
  n_s1: { id: 'n_s1', type: 's1', x: 50, y: 680, zIndex: 12, isExpanded: true, overview: 'Sub bass or portable chord stabber.', audioIn: '-', audioOut: 'Circuit In 2', midiIn: 'From Grind Thru', midiOut: '-', midiThru: '-' },
  n_minifreak: { id: 'n_minifreak', type: 'minifreak', x: 50, y: 100, zIndex: 13, isExpanded: true, overview: 'Polyphonic pads. Keeps full stereo image.', audioIn: '-', audioOut: 'Flow8 Ch 1/2', midiIn: 'From Circuit', midiOut: '-', midiThru: 'To Grind' },
  n_flow8: { id: 'n_flow8', type: 'flow8', x: 800, y: 250, zIndex: 14, isExpanded: true, overview: 'Central mixer. Maintains stereo & EQs.', audioIn: 'Synths + Circuit', audioOut: 'USB Multitrack', midiIn: '-', midiOut: '-', midiThru: '-' },
  n_ableton: { id: 'n_ableton', type: 'ableton', x: 1100, y: 300, zIndex: 15, isExpanded: true, overview: 'Final recording, FX, and mastering.', audioIn: 'USB Flow8', audioOut: 'Master', midiIn: '-', midiOut: '-', midiThru: '-' },
};

const DEFAULT_CONNECTIONS = {
  c_grind_audio: { id: 'c_grind_audio', source: 'n_grind', target: 'n_circuit', type: 'audio_ts', label: 'Audio TS', startOffset: {x:300,y:100}, endOffset: {x:20,y:20} },
  c_s1_audio: { id: 'c_s1_audio', source: 'n_s1', target: 'n_circuit', type: 'audio_ts', label: 'Audio TS', startOffset: {x:230,y:50}, endOffset: {x:20,y:50} },
  c_circuit_audio: { id: 'c_circuit_audio', source: 'n_circuit', target: 'n_flow8', type: 'audio_sidechain', label: 'Stereo (Pump)', startOffset: {x:260,y:50}, endOffset: {x:20,y:150} },
  c_mf_audio: { id: 'c_mf_audio', source: 'n_minifreak', target: 'n_flow8', type: 'audio_trs', label: 'Stereo (Clean)', startOffset: {x:280,y:100}, endOffset: {x:20,y:50} },
  c_flow_usb: { id: 'c_flow_usb', source: 'n_flow8', target: 'n_ableton', type: 'midi_usb', label: 'Multitrack', startOffset: {x:230,y:100}, endOffset: {x:20,y:50} },
  c_midi_master: { id: 'c_midi_master', source: 'n_circuit', target: 'n_minifreak', type: 'midi_din', label: 'Clock/Notes', startOffset: {x:140,y:10}, endOffset: {x:150,y:200} },
  c_midi_2: { id: 'c_midi_2', source: 'n_minifreak', target: 'n_grind', type: 'midi_din', label: 'Thru', startOffset: {x:20,y:150}, endOffset: {x:20,y:50} },
  c_midi_3: { id: 'c_midi_3', source: 'n_grind', target: 'n_s1', type: 'midi_din', label: 'Thru', startOffset: {x:40,y:200}, endOffset: {x:40,y:20} },
};

export default function AlienMindSetup() {
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [connections, setConnections] = useState(DEFAULT_CONNECTIONS);
  const [draggingNode, setDraggingNode] = useState(null);
  const [draggedCable, setDraggedCable] = useState(null);
  const [maxZIndex, setMaxZIndex] = useState(30);
  const [editingLabel, setEditingLabel] = useState(null);
  const containerRef = useRef(null);

  // Load from local storage
  useEffect(() => {
    const savedNodes = localStorage.getItem('alienmind_nodes_v4');
    const savedConns = localStorage.getItem('alienmind_connections_v4');
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e) {
        console.error("Failed to load layout");
      }
    }
  }, []);

  const saveLayout = () => {
    localStorage.setItem('alienmind_nodes_v4', JSON.stringify(nodes));
    localStorage.setItem('alienmind_connections_v4', JSON.stringify(connections));
    alert("Layout Saved successfully!");
  };

  const resetLayout = () => {
    setNodes(DEFAULT_NODES);
    setConnections(DEFAULT_CONNECTIONS);
    localStorage.removeItem('alienmind_nodes_v4');
    localStorage.removeItem('alienmind_connections_v4');
  };

  const handleNodeMouseDown = (nodeId, e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'svg', 'path', 'circle'].includes(e.target.tagName) || e.target.closest('button')) return;
    
    e.stopPropagation();
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    
    setDraggingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: nodes[nodeId].x,
      initialNodeY: nodes[nodeId].y,
    });
    setNodes(prev => ({ ...prev, [nodeId]: { ...prev[nodeId], zIndex: newZIndex } }));
  };

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setNodes(prev => ({...prev, [nodeId]: {...prev[nodeId], isExpanded: !prev[nodeId].isExpanded}}));
  };

  const handleCableDragStart = (e, connId, endpoint) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setDraggedCable({
        id: connId,
        endpoint: endpoint,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (draggingNode) {
      const dx = e.clientX - draggingNode.startX;
      const dy = e.clientY - draggingNode.startY;
      setNodes(prev => ({
        ...prev,
        [draggingNode.id]: {
          ...prev[draggingNode.id],
          x: draggingNode.initialNodeX + dx,
          y: draggingNode.initialNodeY + dy
        }
      }));
    } else if (draggedCable && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDraggedCable(prev => ({
          ...prev,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (draggedCable && containerRef.current) {
       const elements = document.elementsFromPoint(e.clientX, e.clientY);
       const hitNodeEl = elements.find(el => el.classList && el.classList.contains('hardware-node'));
       
       if (hitNodeEl) {
           const nodeId = hitNodeEl.getAttribute('data-id');
           const rect = containerRef.current.getBoundingClientRect();
           const canvasX = e.clientX - rect.left;
           const canvasY = e.clientY - rect.top;
           
           setConnections(prev => {
               const newConns = { ...prev };
               const conn = { ...newConns[draggedCable.id] };
               const targetNode = nodes[nodeId];
               
               if (draggedCable.endpoint === 'source') {
                   conn.source = nodeId;
                   conn.startOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
               } else {
                   conn.target = nodeId;
                   conn.endOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
               }
               newConns[draggedCable.id] = conn;
               return newConns;
           });
       }
       setDraggedCable(null);
    }
    setDraggingNode(null);
  };

  useEffect(() => {
    if (draggingNode || draggedCable) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('window:mouseup', handleMouseUp);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode, draggedCable]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 p-6 font-sans flex flex-col items-center selection:bg-cyan-500/30">
      
      {/* Header & Controls */}
      <header className="max-w-6xl w-full mb-6 flex justify-between items-end border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            AlienMind <span className="text-cyan-500">Setup Builder</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Interactive DAWless Routing Architecture v4.0</p>
        </div>
        <div className="flex gap-3">
            <button onClick={resetLayout} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors text-sm"><RefreshCw size={14}/> Reset Layout</button>
            <button onClick={saveLayout} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors shadow-lg text-sm"><Save size={14}/> Save to Browser</button>
        </div>
      </header>

      {/* Main Interactive Canvas */}
      <div 
        ref={containerRef}
        className="w-full max-w-[1400px] h-[900px] bg-neutral-950 rounded-xl border border-neutral-800 shadow-2xl relative overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(#262626 1px, transparent 1px), linear-gradient(90deg, #262626 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      >
        
        {/* SVG Canvas for Cables */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" preserveAspectRatio="none">
          <defs>
            {/* Reduced Marker sizes */}
            <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#06b6d4" /></marker>
            <marker id="arrowOrange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f97316" /></marker>
            <marker id="arrowPurple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a855f7" /></marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#3b82f6" /></marker>
            <marker id="arrowEmerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#10b981" /></marker>
            
            <filter id="glowCyan"><feGaussianBlur stdDeviation="2" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
            <filter id="glowOrange"><feGaussianBlur stdDeviation="2" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
            <filter id="glowPurple"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
          </defs>

          {Object.entries(connections).map(([id, conn]) => {
            const isDraggingStart = draggedCable?.id === id && draggedCable?.endpoint === 'source';
            const isDraggingEnd = draggedCable?.id === id && draggedCable?.endpoint === 'target';

            const startX = isDraggingStart ? draggedCable.x : nodes[conn.source]?.x + conn.startOffset.x;
            const startY = isDraggingStart ? draggedCable.y : nodes[conn.source]?.y + conn.startOffset.y;
            const endX = isDraggingEnd ? draggedCable.x : nodes[conn.target]?.x + conn.endOffset.x;
            const endY = isDraggingEnd ? draggedCable.y : nodes[conn.target]?.y + conn.endOffset.y;
            
            if(startX === undefined || endX === undefined) return null;

            let pathData = "";
            if (conn.type.includes('midi')) {
               const controlY = startY - 100;
               pathData = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
            } else {
               pathData = `M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`;
            }
            
            const style = CABLE_TYPES[conn.type];
            return (
              <g key={`cable-${id}`}>
                <path d={pathData} stroke={style.color} strokeWidth={style.stroke} fill="none" markerEnd={isDraggingEnd ? "" : style.marker} filter={style.filter} strokeDasharray={style.dash} className={style.animate ? "animate-pulse" : ""} />
                {/* Draggable Handles */}
                <circle cx={startX} cy={startY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onMouseDown={(e) => handleCableDragStart(e, id, 'source')} />
                <circle cx={endX} cy={endY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onMouseDown={(e) => handleCableDragStart(e, id, 'target')} />
              </g>
            );
          })}
        </svg>

        {/* Cable Labels (Editable) */}
        {Object.entries(connections).map(([id, conn]) => {
            const isDraggingStart = draggedCable?.id === id && draggedCable?.endpoint === 'source';
            const isDraggingEnd = draggedCable?.id === id && draggedCable?.endpoint === 'target';
            const startX = isDraggingStart ? draggedCable.x : nodes[conn.source]?.x + conn.startOffset.x;
            const startY = isDraggingStart ? draggedCable.y : nodes[conn.source]?.y + conn.startOffset.y;
            const endX = isDraggingEnd ? draggedCable.x : nodes[conn.target]?.x + conn.endOffset.x;
            const endY = isDraggingEnd ? draggedCable.y : nodes[conn.target]?.y + conn.endOffset.y;
            if(startX === undefined || endX === undefined) return null;

            const midX = (startX + endX) / 2;
            const midY = conn.type.includes('midi') ? Math.min(startY, endY) - 50 : (startY + endY) / 2;
            const style = CABLE_TYPES[conn.type];

            return (
              <div key={`label-${id}`} className="absolute z-20" style={{ left: midX, top: midY, transform: 'translate(-50%, -50%)' }}>
                 {editingLabel === id ? (
                   <input
                     autoFocus
                     defaultValue={conn.label}
                     className="bg-neutral-900 text-white text-xs px-2 py-1 rounded border border-neutral-500 outline-none w-28 text-center"
                     onBlur={(e) => {
                       setConnections(prev => ({...prev, [id]: {...prev[id], label: e.target.value}}));
                       setEditingLabel(null);
                     }}
                     onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                   />
                 ) : (
                   <div 
                     onDoubleClick={() => setEditingLabel(id)}
                     className="px-2 py-1 rounded border backdrop-blur-sm text-[10px] font-bold cursor-text hover:scale-110 transition-transform whitespace-nowrap"
                     style={{ color: style.color, borderColor: style.color, backgroundColor: 'rgba(20,20,20,0.8)' }}
                   >
                     {conn.label}
                   </div>
                 )}
              </div>
            );
        })}

        {/* Hardware Nodes Rendering */}
        {Object.entries(nodes).map(([nodeId, nodeState]) => {
          const blueprint = HARDWARE_LIBRARY[nodeState.type];
          if (!blueprint) return null;
          const isExpanded = nodeState.isExpanded !== false;

          return (
            <div 
              key={nodeId}
              data-id={nodeId}
              className={`hardware-node absolute bg-neutral-900 rounded-xl border-t-4 shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing hover:ring-2 ring-white/10 ${blueprint.theme.border}`}
              style={{ left: nodeState.x, top: nodeState.y, zIndex: nodeState.zIndex, width: blueprint.width }}
              onMouseDown={(e) => handleNodeMouseDown(nodeId, e)}
            >
              {/* Header */}
              <div className={`p-2 flex justify-between items-center ${blueprint.theme.header}`}>
                <div>
                  <h3 className={`font-black tracking-tight leading-none ${blueprint.theme.title}`}>{blueprint.model}</h3>
                  <span className="text-[10px] text-neutral-400">{blueprint.brand}</span>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest ${blueprint.theme.badge}`}>{blueprint.tagline}</span>
              </div>

              {/* Graphic SVG Component */}
              <div className="p-3 bg-neutral-800">
                <blueprint.visual />
              </div>

              {/* Collapsible I/O Data */}
              <div className="bg-neutral-950 flex flex-col">
                 <button 
                    onClick={(e) => toggleExpand(nodeId, e)}
                    className="w-full flex items-center justify-between p-2 px-3 text-[10px] text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors border-t border-neutral-800 focus:outline-none"
                 >
                    <span className="font-bold uppercase tracking-wider">Routing & I/O Data</span>
                    {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                 </button>
                 
                 {isExpanded && (
                     <div className="p-3 pt-1 text-xs flex flex-col gap-2">
                         <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-bold">Overview / Notes</label>
                            <textarea 
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 resize-none h-12 outline-none focus:border-neutral-500"
                                value={nodeState.overview}
                                onChange={(e) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], overview: e.target.value}}))}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-cyan-600 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio IN</label>
                                <input className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none" value={nodeState.audioIn} onChange={(e) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], audioIn: e.target.value}}))}/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-orange-500 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio OUT</label>
                                <input className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none" value={nodeState.audioOut} onChange={(e) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], audioOut: e.target.value}}))}/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-emerald-600 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI IN</label>
                                <input className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none" value={nodeState.midiIn} onChange={(e) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], midiIn: e.target.value}}))}/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-blue-500 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI OUT/THRU</label>
                                <input className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none" value={nodeState.midiOut} onChange={(e) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], midiOut: e.target.value}}))}/>
                            </div>
                         </div>
                         
                         {/* Origin Cable Managers */}
                         <div className="mt-2 pt-2 border-t border-neutral-800 flex flex-col gap-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-bold">Outgoing Cables Manager</label>
                            {Object.entries(connections).filter(([_, conn]) => conn.source === nodeId).map(([cId, conn]) => (
                                <select 
                                    key={cId}
                                    value={conn.type}
                                    onChange={(e) => setConnections(p => ({...p, [cId]: {...p[cId], type: e.target.value}}))}
                                    className="bg-neutral-900 border border-neutral-700 text-[10px] p-1 rounded text-neutral-300 outline-none w-full"
                                    style={{ color: CABLE_TYPES[conn.type].color }}
                                >
                                    {Object.entries(CABLE_TYPES).map(([typeId, typeData]) => (
                                        <option key={typeId} value={typeId}>{conn.label} ➜ {typeData.label}</option>
                                    ))}
                                </select>
                            ))}
                         </div>
                     </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Implementation Notes

When this component is wired into Trackster, consider:
- Extract equipment data into a configuration object to make it reusable
- Use `useWindowSize()` hook to responsively scale the SVG canvas
- Add click handlers to equipment cards to navigate or expand details
- Animate the SVG paths on mount with `framer-motion` for polish
- Memoize the SVG connectors as a separate component for performance


---

# Design & Architecture

# DESIGN.md - Trackster: Circuit Tracks PCM Manager

## 1. Overview

Trackster is a browser-based, offline-capable Progressive Web App (PWA) for managing, auditioning, auto-tagging, and re-sequencing local `.wav` sample files before packing them onto the **Novation Circuit Tracks** groovebox.

The app reads a local directory via the File System Access API, presents the samples in a 4-page, 2x8 grid that mirrors the hardware layout, and allows drag-and-drop reordering. It includes client-side audio analysis for duplicate detection and heuristic filename parsing for auto-arrangement.

**All operations are local.** No audio file ever leaves the user's machine.

---

## 2. Circuit Tracks Hardware Constraints

Understanding the hardware is essential - the app's entire data model derives from it.

| Constraint | Value |
|---|---|
| Total sample slots | **64** (indexed `00`–`63`) |
| Pages | **4** (16 pads each) |
| Pad grid per page | **2 rows x 8 columns** |
| Filename convention | `{NN}_{name}.wav` where `NN` is the zero-padded slot index |
| Supported format | `.wav` - **48 kHz, 16-bit, mono** preferred; stereo files are accepted but summed to mono by the hardware |
| Max sample length | ~15 seconds (hardware RAM limited) |
| Page color scheme | Page 1: Orange, Page 2: Yellow, Page 3: Purple, Page 4: Aqua |

The hardware reads the SD card's `PCM` folder and maps files exclusively by their numeric prefix. File ordering, tagging, and page assignment are therefore entirely determined by this prefix.

---

## 3. Architecture & Toolchain

### 3.1 Architectural Choice: Vite + React
**Vite + React** is the chosen architecture for this project due to:
- **Zero Server-Side Logic:** Every component uses browser-only APIs (`showDirectoryPicker`, Web Audio, drag events), making a client-only static architecture the optimal choice.
- **Faster DX:** Vite's dev server provides instant HMR.
- **Simpler Deployment:** The build output is a static `dist/` folder deployable anywhere.
- **Smaller Bundle:** No framework runtime overhead for routing or SSR.

### 3.2 Technology Stack
- **Build tool:** Vite (Fast, zero-config for React + TS)
- **UI Framework:** React 19.x
- **Language:** TypeScript 5.x (Strict mode catches index math bugs at compile time)
- **Styling:** Tailwind CSS 4.x (Utility-first, CSS custom properties for theming)
- **State management:** Zustand 5.x (Minimal API, selector-based re-renders critical for 64-pad grid performance)
- **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Waveform display:** `wavesurfer.js` 7.x
- **Audio DSP:** `Meyda` 5.x (Client-side feature extraction)
- **Icons:** `lucide-react`
- **PWA:** `vite-plugin-pwa`

---

## 4. Folder Structure

```
trackster/
├── src/
│   ├── components/
│   │   ├── Core/            # App shell, Toolbar, Modals, shared UI primitives
│   │   ├── Overview/        # Interactive DAWless routing canvas and hardware nodes
│   │   └── Circuit/         # Circuit Tracks specific (PackOrganizer, Grids, Waveform)
│   ├── stores/              # Zustand stores (useFileSystemStore, useAudioStore, useUIStore, useOverviewStore)
│   ├── hooks/               # Custom hooks (useAudioPlayback, useBrowserSupport)
│   ├── utils/               # Pure functions (fileNaming, autoTag, similarity)
│   ├── workers/             # Web Worker for Meyda feature extraction
│   └── types/               # Shared TS types and ambient declarations
└── doc/                     # Design documentation
```

---

## 5. Core Mechanics & Browser APIs

### 5.1 File System Access & Renaming Strategy
The app uses `window.showDirectoryPicker` to grant persistent, user-consented access to the local `PCM` folder. It reads file contents and writes for renaming.
- **Browser support:** Chromium-only. Unsupported browsers show a clear compatibility warning.
- **Rename Strategy:** All drag operations update in-memory state only. When the user clicks "Commit", a rename plan is generated. A batch rename executes via a two-pass approach using temporary suffixes to avoid collisions when files swap positions.

### 5.2 Audio Playback
- **Web Audio API** (`AudioContext`) handles low-latency sample audition.
- **Single-voice playback:** clicking a new pad stops the currently playing sample.
- **wavesurfer.js** renders the waveform of the currently selected/playing pad. Audio is decoded lazily upon pad selection.

### 5.3 Offline / PWA
`vite-plugin-pwa` generates a Workbox service worker caching the app shell (HTML, JS, CSS, icons). Audio files are strictly local and are never cached by the service worker.

---

## 6. Business Logic

### 6.1 Heuristic Auto-Tagging
A "Magic Sort" button scans filenames (stripping the prefix and extension) and assigns tags via case-insensitive regex matching. First match wins.
- `kick` (🔴 BD), `snare` (🟡 SD), `hihat` (🔵 HH), `cymbal` (🟣 CY), `tom` (🟠 TM), `perc` (🟤 PC), `fx` (⚪ FX), `unknown` (⬜ ??).

### 6.2 Auto-Arrangement ("Magic Sort")
Assigns tagged samples to hardware pages:
- **Page 1 (Orange):** `kick`
- **Page 2 (Yellow):** `snare`, `clap`
- **Page 3 (Purple):** `hihat`, `cymbal`
- **Page 4 (Aqua):** `tom`, `perc`, `fx`, `unknown`

*Overflow handling:* If a category has more samples than available slots on its page, overflow samples are placed in Page 4.

### 6.3 Audio Similarity / Duplicate Detection
Detects perceptually similar samples locally:
1. Loads raw PCM data.
2. Posts data to a **Web Worker** which extracts features via Meyda (RMS envelope, Spectral Centroid, MFCC).
3. Computes cosine similarity between each pair's feature vectors.
4. If similarity exceeds a threshold (~0.92), pads are flagged as "Potential Duplicate" with a warning icon and pulsing border.

---

## 7. State Management (Zustand Stores)

Using Zustand with selector-based subscriptions avoids cascading React Context re-renders across the 64-pad grid.

- **`useFileSystemStore`**: The primary store. Owns the directory handle, the 64 slots array, pending changes count, and an undo stack. Actions include `loadFiles`, `moveSlot`, `autoTag`, `autoArrange`, `commitChanges`, and `executeRenamePlan`.
- **`useAudioStore`**: Manages the `AudioContext`, cached decoded buffers, active playback state, and duplicate analysis results. Exposes actions for lazy init, playing, stopping, and scanning duplicates.
- **`useUIStore`**: Holds the active page, selected pad index, and UI states like modals and notifications.
- **`useOverviewStore`**: Manages the interactive nodes and connections for the DAWless routing setup in the Overview tab.

---

## 8. UI/UX Specification & Component Architecture

### 8.1 Overall Layout

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR                                                │
│  [📂 Select Directory] [✨ Magic Sort] [🔍 Scan Dupes] │
│                                    [↩ Undo] [💾 Commit] │
├─────────────────────────────────────────────────────────┤
│  WAVEFORM VISUALIZER                          ▶ 01:23   │
│  ▁▂▃▅▆▇█▇▆▅▃▂▁▁▂▃▅▇▇▆▅▃▂▁                             │
├─────────────────────────────────────────────────────────┤
│  PAGE TABS                                              │
│  [ Page 1 🟠 ] [ Page 2 🟡 ] [ Page 3 🟣 ] [ Page 4 🔵 ] │
├─────────────────────────────────────────────────────────┤
│  PAD GRID (2 rows x 8 columns)                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ 00 │ │ 01 │ │ 02 │ │ 03 │ │ 04 │ │ 05 │ │ 06 │ │ 07 ││
│  │Kick│ │Kick│ │Kick│ │    │ │    │ │    │ │    │ │    ││
│  │ BD │ │ BD │ │ BD │ │    │ │    │ │    │ │    │ │    ││
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ 08 │ │ 09 │ │ 10 │ │ 11 │ │ 12 │ │ 13 │ │ 14 │ │ 15 ││
│  │Kick│ │Kick│ │    │ │    │ │    │ │    │ │    │ │    ││
│  │ BD │ │ BD │ │    │ │    │ │    │ │    │ │    │ │    ││
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
├─────────────────────────────────────────────────────────┤
│  STATUS BAR    42/64 slots filled  │  3 pending changes │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Component Architecture
- **`App.tsx`**: Root layout orchestrating Toolbar and the main view switcher.
- **`Core/Toolbar/Toolbar.tsx`**: Triggers file loading, magic sort, dup scan, undo, commit, and Overview layout controls depending on the active view.
- **`Circuit/Waveform/Waveform.tsx`**: Wraps `wavesurfer.js` with a fixed height. Color matches the active page's accent.
- **`Circuit/Grid/SortableGrid.tsx`**: Wraps 16 pads per page with `@dnd-kit`'s `<DndContext>`.
- **`Circuit/Grid/SortablePad.tsx`**: Interactive square tile displaying content based on occupied status. Connects to `useSortable` for drag operations.
- **`Overview/OverviewTab.tsx`**: Interactive SVG canvas rendering hardware nodes, draggable MIDI/Audio cables, and routing configurations.

### 8.3 Pad Anatomy

```
┌──────────────┐
│ 03         ▶ │   ← Slot number (top-left), Playing indicator (top-right)
│              │
│  TR-808 Kick │   ← Clean filename, centered (prefix + extension stripped)
│              │
│          BD  │   ← Tag badge (bottom-right), color-coded
│ ⚠           │   ← Duplicate warning icon (bottom-left), if flagged
└──────────────┘
```

**Pad states:**
- **Empty:** Dashed border, muted color.
- **Occupied:** Solid border in page accent color.
- **Selected:** Elevated with a box-shadow.
- **Playing:** Pulsing glow animation on border.
- **Dragging:** Semi-transparent drag preview.
- **Drop target:** Border brightens with a scale-up micro-animation.
- **Duplicate warning:** Amber pulsing border overlay + ⚠ icon.

### 8.4 Color Theming & Styling Architecture
Styling relies on Tailwind CSS v4 using CSS Custom Properties defined in `index.css`. The active page determines the UI accent color (`--accent`), mirroring hardware LEDs:
- **Page 1:** Orange (`#ff8c00`)
- **Page 2:** Yellow (`#ffd700`)
- **Page 3:** Purple (`#9370db`)
- **Page 4:** Aqua (`#00e5ff`)

Background is a dark theme (`#0a0a0f` base) with subtle surface elevation.

### 8.5 Interactions & Keyboard Shortcuts
- **Click pad:** Load waveform & play.
- **Drag pad:** Reorder within page or drag to another page tab.
- **Commit:** Shows rename plan before executing via File System Access API.
- **Shortcuts:** `1`–`4` for page switching, `Space` for play/stop, Arrow keys for navigation, `Ctrl+Z` to undo, `Ctrl+S` to open commit dialog.

---

## 9. Validation & Error Handling

- **Browser Validation:** Fallback screen if `showDirectoryPicker` is unavailable.
- **File Validation:** Ignores non-`.wav` files. Files without a `NN_` prefix go to an unassigned tray. Duplicate prefixes trigger a block. Files >20 MB receive a warning badge.
- **Runtime Errors:** Graceful fallbacks for Web Worker crashes, corrupted `.wav` decodes, and temporary rename collision handling.

---

## 10. Web Worker (Duplicate Analysis)
To prevent UI freezes from heavy DSP computations, Meyda feature extraction runs in a dedicated Web Worker (`audioAnalyzer.worker.ts`). The main thread passes raw `ArrayBuffer` data (zero-copy transfers). The worker processes the queue and posts progress updates back to the UI, returning final feature vectors for duplicate flagging.

---

## 11. Testing & Deployment

### 11.1 Testing Strategy
- **Unit Tests (Vitest):** Tests all pure utilities (filename parsing, tagging, auto-arrange math, similarity calculations).
- **Component Tests (React Testing Library):** Validates UI interactions, dialog states, and disabled states.

### 11.2 Build & Deployment
The Vite static site output is deployed automatically via GitHub Actions to GitHub Pages, or can be hosted on Netlify or locally via any static file server.

---

## 12. Future Considerations (Out of Scope for v1)
- Waveform editing (trim, normalize, fade in/out).
- Multi-pack management and external sample import.
- Circuit Tracks sysex integration for direct USB MIDI transfer.
- Audio format conversion to preferred 48kHz/16-bit specs.
- Persisting tags to a sidecar `.json` file.


---

# Enhancements

# Trackster Enhancements Plan

This document captures the audit findings and the phased roadmap to elevate Trackster's architecture, visual design, and deploy story. Source of truth is this file; in-progress notes may live in a session memory.

---

## Part A - Assessment

### A1. Architecture: solid foundations, one god-store

**Strengths**
- Clean Vite + React 19 + TS strict + Zustand 5 stack matches `doc/AGENTS.md` guardrails.
- Three-store split (`useFileSystemStore`, `useAudioStore`, `useUIStore`) is the right partition.
- Selector-based subscriptions are used consistently. No React Context for grid state.
- Domain types (`SampleFile`, `PadSlot`, `PackSlot`, `RenamePlan`) cleanly mirror hardware.
- Audio analysis correctly offloaded to a Web Worker with transferable buffers.
- No `any`, no `@ts-ignore`, no `eslint-disable` anywhere.
- Commit-only writing with the documented two-pass `__trackster_tmp` swap is honored.

**Weaknesses**
- `useFileSystemStore` is ~1000 lines and does too much: directory IO, pack model, slot model, tag actions, undo stack, rename planning, commit orchestration.
- 30+ `console.*` calls in the store. No debug flag.
- Zero automated tests. The pure utilities `renamePlan.ts`, `fileNaming.ts`, `autoArrange.ts`, `similarity.ts` are the highest-leverage place to add tests; they are exactly the code that, if buggy, "obliterates packs" per the README warning.
- `SortablePad` and `PackPad` are not `React.memo`'d.
- `packages/llm-client/` is orphaned (zero imports from `src/`). Misleading for a fully client-side PWA.
- `AudioFeatureVector.mfcc` and `spectralCentroid` are declared but the worker only computes a trivial `[size, sum]` fingerprint. Similarity is weak.
- MIDI Live Preview (`doc/MIDI.md`) is fully unimplemented.
- No persisted-store schema version or migration; risky as schema evolves.

### A2. UI / visual design: generic shadcn dark mode, not hardware-grade

**Today**
- Flat dark surfaces, rounded corners, page accent via `--accent` CSS var.
- No gradients, no shadows beyond `shadow-sm`, no glow, no skeuomorphism.
- `App.css` still contains a leftover Vite scaffold (`.counter`, `.hero`, `#next-steps`, etc.).
- No mobile breakpoint handling; the 2x8 grid likely overflows below 768px.
- Pad anatomy is implemented but visually thin: no LED glow, no inner bezel, no luminous "lit" state distinct from "selected" beyond a ring color.

**Hardware-grade target** (mirrors Novation Circuit Tracks aesthetic)
- Pad as a 3D-feeling rubberized square: subtle inner bevel (inset shadow on top, faint highlight on bottom), matte black surface, translucent inner core that "lights up" with the page accent.
- Playing pad: pulsing radial gradient core + outer halo (`box-shadow` with the page color at ~50% alpha and 20-32px blur).
- Empty pad: dark with faint dashed border and reduced opacity, no LED.
- Page tabs as the four hardware page buttons: capsule pills with the canonical orange/gold/purple/cyan, active tab "lit", inactive dim.
- Panel chrome: gunmetal `linear-gradient(180deg, #14141a, #0a0a0f)` with a 1px top highlight `inset 0 1px 0 rgba(255,255,255,0.04)`.
- Typography: keep Geist for UI, add a tabular monospace face for slot numbers and BPM/duration to evoke the hardware LCD.
- Optional: subtle SVG noise overlay (6-8% alpha) on the app background for tactile depth.
- Include an SVG-driven "hardware overview" illustration in the app, with colored connector paths, equipment cards, and signal-flow markers to reinforce the physical setup.

### A3. GitHub Pages deploy gaps

The repo deploys to GitHub Pages but several things will break for a project repo (`user/trackster/`):
- `vite.config.ts` has `base: '/'` hardcoded. For a project repo this must be `'/<repo>/'`.
- No `public/.nojekyll`, so underscore-prefixed assets risk being stripped by Jekyll.
- No `public/404.html` SPA fallback.
- `vite-plugin-pwa` `scope` and `start_url` are not set and default to `/`, mismatching the actual `base` on a project repo. PWA install will be broken.
- Workflow exists (`.github/workflows/deploy.yml`) but does not pass a `BASE` env or detect repo type.
- File System Access API requires a secure context; `github.io` is fine but should be documented.

---

## Part B - Phased plan

### Phase 1: Ship-readiness (small, high-ROI)

- **1.1** Remove the leftover Vite scaffold in `src/App.css`.
- **1.2** Gate every `console.*` in `src/stores/useFileSystemStore.ts` behind a `DEBUG` flag via a `src/utils/logger.ts` util.
- **1.3** `React.memo` for `SortablePad` and `PackPad`.
- **1.4** Configure GitHub Pages deploy correctly:
  - `vite.config.ts` `base` reads `process.env.VITE_BASE`, defaults to `'/'`.
  - PWA manifest `scope` and `start_url` align with `base`.
  - `public/.nojekyll` and `public/404.html` (SPA fallback) emitted.
  - Workflow passes `VITE_BASE=/<repo>/` when the repo is not a user/org site.
- **1.5** Decide on `packages/llm-client/`: delete (recommended) or document.

### Phase 2: Architecture cleanup

- **2.1** Split `useFileSystemStore` into three cohesive slices via Zustand combine, keeping a single externally-visible store identity:
  - Directory slice: `rootHandle`, `packs`, `packSlots`, `activePack`, `openRootDirectory`, `rescanRootDirectory`, `loadPack`.
  - Slot/pack slice: `slots`, `unassignedFiles`, slot/file mutations.
  - Commit/history slice: `history`, `pendingChanges`, `commit`, `executeRenamePlan`, undo.
- **2.2** Extract domain logic out of the store into pure modules (testable):
  - `src/domain/renameExecutor.ts` - the two-pass swap.
  - `src/domain/packModel.ts` - pack/slot derivations.
  - `src/domain/commitPlanner.ts` - diff slots vs. on-disk to produce `RenamePlan` + move ops.
- **2.3** Add Vitest with focused suites for `domain/` and `utils/`.
- **2.4** Add Zustand persist `version` + `migrate`.
- **2.5** Introduce `useSlot(index)` and `useSelectedSample()` hooks under `src/stores/hooks/`.
- **2.6** Replace `useUIStore.notifications[]` with `sonner`.

### Phase 3: Hardware-grade visual design

- **3.1** Hardware design-token layer in `src/index.css`:
  - Surface tokens: `--surface-shell`, `--surface-panel`, `--surface-pad-off`, `--surface-pad-on`.
  - Bevel tokens: `--bevel-top-highlight`, `--bevel-bottom-shadow`, `--bezel-stroke`.
  - Glow tokens per page: `--glow-page-1..4`.
  - Tabular monospace font for numerics.
- **3.2** Redesign `SortablePad` and `PackPad`:
  - Two-layer DOM: outer rubber shell + inner LED core.
  - States: empty, occupied, selected, playing (pulse + halo), drop target (scale 1.04), duplicate warning (amber halo + pulsing glyph).
  - All states CSS-only where possible.
- **3.3** Redesign `PageTabs` as hardware page buttons.
- **3.4** Redesign panel chrome (`App.tsx` shell, `Toolbar`, `StatusBar`, `FileInspector`): gunmetal vertical gradient + 1px highlights.
- **3.5** Add full-screen SVG noise overlay at 6-8% opacity.
- **3.6** Add an "Overview" tab with a rich SVG system diagram: equipment cards, connector flows, color-coded signal paths, and Lucide icon-based status badges.
- **3.7** Responsive pass: 2x8 collapses to 4x4 below 640px; panes become tabs.
- **3.8** Compact mode verified at 1366x768.
- **3.9** Accessibility: WCAG AA contrast for text and focus rings.

### Phase 4: Feature credibility

- **4.1** Replace the trivial fingerprint with real Meyda features (RMS envelope downsampled to 32 bins, spectral centroid mean, 13-bin MFCC mean). Populate `AudioFeatureVector` for real. Tune similarity threshold against a labeled fixture.
- **4.2** Implement MIDI Live Preview (`doc/MIDI.md`):
  - `src/stores/useMidiStore.ts` for `MIDIAccess` / `MIDIOutput` filtering on `name.includes('Circuit Tracks')`.
  - `src/domain/midiRouter.ts` with `playHardwarePreview(trackId, presetIndex)`.
  - `LivePreview` page with 8-track selector and 8x8 (or 4x16) pad matrix.
- **4.3** Optional keyboard shortcuts (space, arrows, 1-4, Ctrl+Z, Ctrl+S).

---

## Relevant files

- `src/App.tsx`, `src/App.css`, `src/index.css` - shell layout and tokens.
- `src/components/Grid/SortablePad.tsx`, `src/components/PackOrganizer/PackPad.tsx` - pad redesign + memo.
- `src/components/PageTabs/PageTabs.tsx` - hardware page buttons.
- `src/components/Overview/OverviewTab.tsx` (new) - SVG-driven system diagram for the app overview.
- `src/components/Toolbar/`, `src/components/StatusBar/`, `src/components/FileInspector/` - panel chrome.
- `src/stores/useFileSystemStore.ts` - split into `src/stores/fileSystem/`.
- `src/domain/` (new) - `renameExecutor.ts`, `commitPlanner.ts`, `packModel.ts`.
- `src/workers/audioAnalyzer.worker.ts` - real Meyda features.
- `src/utils/logger.ts` (new) - debug-gated logger.
- `vite.config.ts` - env-driven `base`, PWA scope/start_url.
- `public/.nojekyll`, `public/404.html` - GH Pages SPA support.
- `.github/workflows/deploy.yml` - `VITE_BASE` derivation.
- `packages/llm-client/` - removed.
- `vitest.config.ts` + `src/**/*.test.ts` - new.

---

## Verification

1. `pnpm lint && pnpm tsc -b` clean.
2. `pnpm vitest run` green; coverage on `domain/` and `utils/`.
3. Manual: open a real PCM folder, rearrange pads across pages, verify commit produces only expected renames.
4. Manual: swap two adjacent slots and commit; verify two-pass rename occurs and no file is lost.
5. Profile drag with React DevTools; only dragged and target tiles re-render.
6. Lighthouse PWA audit >= 90 after manifest fix.
7. Deploy to a throwaway `username.github.io/trackster-test` repo; verify load, accents, PWA install, no 404 on refresh.
8. Visual review of redesigned pads against a Circuit Tracks photo.

---

## Decisions

- **In scope**: assessment, refactor plan, visual redesign, GH Pages hardening, MIDI feature, real audio similarity. Stays client-only per `AGENTS.md`.
- **Out of scope**: accounts, cloud sync, marketplace, native wrappers.
- **Recommended ordering**: Phase 1 (a single short PR), then Phase 2 (refactor without UI churn), then Phase 3 (visual lands on clean architecture), then Phase 4.


---

# Agent Rules & Coding Standards

# Trackster - AI Agent Instructions & Guardrails

Welcome to the Trackster codebase. You are an expert AI software engineer / coding agent. When writing code, generating documentation, or editing files in this repository, you must adhere strictly to the following guardrails, planning protocols, and architectural rules.

---

## 1. Critical Rules & Code Style

### No Em-Dashes (`—`)
* **Strict Prohibition:** Never use the em-dash character (`—`) in code comments, markdown documentation, commit messages, console output, or user interfaces.
* **Alternative:** Use standard hyphens (`-`), colons (`:`), or clear phrasing instead.

### No Verbose/Thinking Comments
* **Strict Prohibition:** Avoid verbose, self-explanatory, narrative, or "silly" comments that document your step-by-step thinking process or state changes (e.g., `// Now we need to set state`, `// Let's iterate over the slots because...`).
* **Guidelines:** 
  * Code comments must be clean, sparse, highly professional, and technical.
  * Only explain **why** non-obvious logic or hardware-specific constraints exist.
  * Never explain **what** the code does when it is self-evident from readable variable and function names.

### Strict TypeScript Typings
* **Strict Mode:** Always run TypeScript in strict mode.
* **No `any`:** Never use the `any` type. If a type is unknown, use `unknown` and type guards.
* **Safe Indexing:** Accessing elements in fixed-size arrays (like the 64 pad grid) must check for `undefined` if `noUncheckedIndexedAccess` is enabled.
* **Return Types:** Explicitly define return types for all store actions, hooks, and complex utility functions.

---

## 2. Tech Stack & Architectural Protocols

Trackster is a browser-based, offline-capable Progressive Web App for managing sample packs for the Novation Circuit Tracks groovebox.

### Framework & Client-Only Nature
* **Stack:** Vite + React 19 + TypeScript + Zustand + Tailwind CSS v4.
* **Strict Client-Only:** Zero server-side code, API routes, SSR, or database dependencies. Everything must execute locally using browser APIs.

### State Management: Zustand 5.x
* **Rule:** Never use React Context for the core 64-pad grid state to avoid massive re-render cascades during drag-and-drop or select operations.
* **Store Division:** Use three separate domain-focused Zustand stores:
  1. `useFileSystemStore` - Directory handle, slots array, rename plan, commit logic.
  2. `useAudioStore` - Playback state, decoded buffers cache, wavesurfer instance, similarity analysis.
  3. `useUIStore` - Active page index (0-3), selected pad index, modal states, notifications.
* **Selector Pattern:** Always subscribe to stores using strict selector-based hooks:
  ```typescript
  // CORRECT: Component only re-renders when this specific slot's sample changes
  const sample = useFileSystemStore((state) => state.slots[index]?.sample);
  ```

### Feature-Based Architecture
* **Strict Division:** Components must be isolated into feature domains under `src/components/`.
  * `Core/` - App shell, navigation, global UI primitives (modals, buttons, toolbars).
  * `Overview/` - The interactive DAWless routing canvas and hardware node elements.
  * `Circuit/` - Circuit Tracks-specific views (Pack Organizer, Sample Organizer, Grids, Waveform).
* **No Flat Structures:** Do not place domain components directly inside `src/components/`.

### File System Access API
* **Fallback Check:** This API is Chromium-only. Every entry point must verify if `showDirectoryPicker` is available in `window` and gracefully render a full-page fallback (`BrowserWarning.tsx`) otherwise.
* **Commit-Only Writing:** Never write or rename files on drag-and-drop actions. Perform all re-orderings in-memory first. Batch-write and rename files only when the user explicitly triggers a "Commit".

### Collisions & File Renaming
* **The Rename Strategy:** When executing a rename plan, files can swap places (e.g. `01_Kick.wav` swaps with `02_Snare.wav`). To prevent name collisions during the batch process, you must use a **two-pass swap strategy**:
  1. **Pass 1:** Rename all target files to a temporary name using the suffix `__trackster_tmp` (e.g. `__tmp_NN_name.wav`).
  2. **Pass 2:** Rename the temporary files to their final destination names (e.g. `NN_name.wav`).

### Audio DSP & Web Worker
* **Web Worker offloading:** Running duplicate detection/audio similarity calculations (RMS, Spectral Centroid, MFCC via Meyda) on 64 files requires heavy CPU cycles. This **must** be run inside a Web Worker (`audioAnalyzer.worker.ts`) to prevent freezing the main UI thread.
* **Playback:** Maintain a single-voice playback model. Decoded audio data (`AudioBuffer`) should be cached dynamically by slot index in `useAudioStore` to avoid re-decoding.

---

## 3. UI, UX & Styling Guidelines

* **Premium Design:** Base background should be a rich dark theme (`#0a0a0f`) with surface elevations via lightened grays.
* **Hardware-Mirrored Page Colors:** Mirror the Novation Circuit Tracks page colors strictly:
  * Page 1 (slots 00-15): Orange (`#ff8c00`)
  * Page 2 (slots 16-31): Yellow (`#ffd700`)
  * Page 3 (slots 32-47): Purple (`#9370db`)
  * Page 4 (slots 48-63): Aqua (`#00e5ff`)
* **Accents:** The active page determines the UI accent color on the root element via a CSS custom property `--accent`.
* **Micro-Animations:** Implement smooth hover states, a pulsing border for playing pads, a pulsing amber warning for duplicate pads, and subtle scale-up effects for drag targets.


---

