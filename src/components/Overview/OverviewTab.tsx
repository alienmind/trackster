
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
import { Circle, Square, ChevronDown, ChevronRight, Laptop } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useOverviewStore, OverviewNode, OverviewConnection, DEFAULT_NODES, DEFAULT_CONNECTIONS } from '../../stores/useOverviewStore';

// Technical Cable Dictionary
const CABLE_TYPES: Record<string, any> = {
  audio_ts: { label: "Audio: TS (Mono)", category: "audio", color: "#f97316", stroke: 3, dash: "none", marker: "url(#arrowOrange)", filter: "url(#glowOrange)" },
  audio_trs: { label: "Audio: TRS (Stereo)", category: "audio", color: "#06b6d4", stroke: 4, dash: "none", marker: "url(#arrowCyan)", filter: "url(#glowCyan)" },
  audio_sidechain: { label: "Audio: Sidechain (Pump)", category: "audio", color: "#a855f7", stroke: 4, dash: "none", marker: "url(#arrowPurple)", filter: "url(#glowPurple)", animate: true },
  midi_din: { label: "MIDI: 5-Pin DIN", category: "midi", color: "#10b981", stroke: 3, dash: "6 4", marker: "url(#arrowEmerald)", filter: "none" },
  midi_usb: { label: "MIDI: USB Data", category: "midi", color: "#3b82f6", stroke: 3, dash: "3 3", marker: "url(#arrowBlue)", filter: "none" }
};

// Stable Visual Hardware Library
const HARDWARE_LIBRARY: Record<string, any> = {
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
                {[...Array(4)].map((_,i) => <div key={`v-${i}`} className="w-1.5 h-9 bg-white rounded-sm"></div>)}
            </div>
            <div className="flex flex-col gap-1">
                {[...Array(4)].map((_,i) => <div key={`h-${i}`} className="w-6 h-1.5 bg-white rounded-sm"></div>)}
            </div>
        </div>
      </div>
    )
  }
};

// Defaults moved to useOverviewStore.ts

export default function AlienMindSetup() {

  useEffect(() => {
    // Initialize if empty
    const savedNodes = localStorage.getItem('alienmind_nodes_v4');
    const savedConnections = localStorage.getItem('alienmind_connections_v4');
    if (Object.keys(nodes).length === 0) {
       if (savedNodes) setNodes(() => JSON.parse(savedNodes));
       else setNodes(() => DEFAULT_NODES);
       if (savedConnections) setConnections(() => JSON.parse(savedConnections));
       else setConnections(() => DEFAULT_CONNECTIONS);
    }
  }, []);

  const { setActiveMainView } = useUIStore();
  const nodes = useOverviewStore((s) => s.nodes);
  const connections = useOverviewStore((s) => s.connections);
  const setNodes = useOverviewStore((s) => s.setNodes);
  const setConnections = useOverviewStore((s) => s.setConnections);
  const [draggingNode, setDraggingNode] = useState<any>(null);
  const [draggedCable, setDraggedCable] = useState<any>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<any>(null);
  const [pan, setPan] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<any>(null);
  const [maxZIndex, setMaxZIndex] = useState(30);
  const [editingLabel, setEditingLabel] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const savedNodes = localStorage.getItem('alienmind_nodes_v4');
    const savedConns = localStorage.getItem('alienmind_connections_v4');
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e: any) {
        console.error("Failed to load layout");
      }
    }
  }, []);

  const getConnectedNode = (nodeId: string, portType: string) => {
     const conns = Object.values(connections);
     if (portType === 'audioIn') {
        const c = conns.find(c => c.target === nodeId && c.type.includes('audio'));
        return c ? c.source : "";
     }
     if (portType === 'audioOut') {
        const c = conns.find(c => c.source === nodeId && c.type.includes('audio'));
        return c ? c.target : "";
     }
     if (portType === 'midiIn') {
        const c = conns.find(c => c.target === nodeId && c.type.includes('midi'));
        return c ? c.source : "";
     }
     if (portType === 'midiOut') {
        const c = conns.find(c => c.source === nodeId && c.type.includes('midi'));
        return c ? c.target : "";
     }
     return "";
  };

  const handlePortSelect = (nodeId: string, portType: string, selectedNodeId: string) => {
    setConnections(prev => {
      const newConns = { ...prev };
      
      let existingId = null;
      for (const [id, c] of Object.entries(newConns)) {
         if (portType === 'audioIn' && c.target === nodeId && c.type.includes('audio')) { existingId = id; break; }
         if (portType === 'audioOut' && c.source === nodeId && c.type.includes('audio')) { existingId = id; break; }
         if (portType === 'midiIn' && c.target === nodeId && c.type.includes('midi')) { existingId = id; break; }
         if (portType === 'midiOut' && c.source === nodeId && c.type.includes('midi')) { existingId = id; break; }
      }

      if (!selectedNodeId) {
         if (existingId) delete newConns[existingId];
      } else {
         if (existingId) {
            if (portType.includes('In')) newConns[existingId]!.source = selectedNodeId;
            if (portType.includes('Out')) newConns[existingId]!.target = selectedNodeId;
         } else {
            const newId = `c_auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const isAudio = portType.includes('audio');
            newConns[newId] = {
               id: newId,
               source: portType.includes('In') ? selectedNodeId : nodeId,
               target: portType.includes('In') ? nodeId : selectedNodeId,
               type: isAudio ? 'audio_ts' : 'midi_din',
               label: isAudio ? 'Audio' : 'MIDI',
               startOffset: { x: 50, y: 50 },
               endOffset: { x: 50, y: 50 }
            };
         }
      }
      return newConns;
    });
  };
  const handleNodeMouseDown = (nodeId: string, e: React.PointerEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'svg', 'path', 'circle'].includes((e.target as Element).tagName) || (e.target as Element).closest('button')) return;
    
    e.stopPropagation();
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    
    setDraggingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: nodes[nodeId]!.x,
      initialNodeY: nodes[nodeId]!.y,
    });
    setNodes(prev => ({ ...prev, [nodeId]: { ...prev[nodeId]! as OverviewNode, zIndex: newZIndex } }));
  };

  const handleNodeDoubleClick = (nodeId: string, e: React.MouseEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'svg', 'path', 'circle'].includes((e.target as Element).tagName) || (e.target as Element).closest('button')) return;
    
    e.stopPropagation();
    const nodeState = nodes[nodeId]!;
    if (nodeState.type === 'circuit') {
       setActiveMainView('packs');
    } else {
       alert(`The configuration panel for the ${HARDWARE_LIBRARY[nodeState.type].model} is not yet implemented.`);
    }
  };

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => ({...prev, [nodeId]: {...prev[nodeId]! as OverviewNode, isExpanded: !prev[nodeId]!.isExpanded}}));
  };

  const toggleHardwareExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => ({...prev, [nodeId]: {...prev[nodeId]! as OverviewNode, isHardwareExpanded: prev[nodeId]!.isHardwareExpanded === false ? true : false}}));
  };

  const handleCableDragStart = (e: React.PointerEvent, connId: string, endpoint: string) => {
    e.stopPropagation();
    const rect = containerRef.current!.getBoundingClientRect();
    setDraggedCable({
        id: connId,
        endpoint: endpoint,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: any) => {
    if (isPanning && panStart) {
       setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
       });
       return;
    }

    if (draggingNode) {
      setNodes(prev => ({
        ...prev,
        [draggingNode.id]: {
          ...prev[draggingNode.id],
          x: draggingNode.initialNodeX + (e.clientX - draggingNode.startX),
          y: draggingNode.initialNodeY + (e.clientY - draggingNode.startY)
        }
      }));
    } else if (draggedCable && containerRef.current) {
      const rect = containerRef.current!.getBoundingClientRect();
      setDraggedCable((prev: any) => ({
          ...prev,
          x: e.clientX - rect.left - pan.x,
          y: e.clientY - rect.top - pan.y
      }));

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const hitNodeEl = elements.find(el => el.classList && el.classList.contains('hardware-node'));
      if (hitNodeEl) {
         setHoveredNodeId(hitNodeEl.getAttribute('data-id'));
      } else {
         setHoveredNodeId(null);
      }
    }
  };

  const handleMouseUp = (e: any) => {
    if (isPanning) {
       setIsPanning(false);
       setPanStart(null);
       return;
    }
    
    if (draggedCable && containerRef.current) {
       const elements = document.elementsFromPoint(e.clientX, e.clientY);
       const hitNodeEl = elements.find(el => el.classList && el.classList.contains('hardware-node'));
       
       if (hitNodeEl) {
           const nodeId = hitNodeEl.getAttribute('data-id');
           if (!nodeId) return;
           const rect = containerRef.current!.getBoundingClientRect();
           const canvasX = e.clientX - rect.left - pan.x;
           const canvasY = e.clientY - rect.top - pan.y;
           
           setConnections(prev => {
               const newConns = { ...prev };
               const conn = { ...newConns[draggedCable.id] };
               const targetNode = nodes[nodeId]!;
               
               if (draggedCable.endpoint === 'source') {
                   conn.source = nodeId!;
                   conn.startOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
               } else {
                   conn.target = nodeId!;
                   conn.endOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
               }
               newConns[draggedCable.id] = conn as OverviewConnection;
               return newConns;
           });
       }
       setDraggedCable(null);
    }
    setHoveredNodeId(null);
    setDraggingNode(null);
  };

  useEffect(() => {
    if (draggingNode || draggedCable || isPanning) {
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handleMouseMove);
      window.addEventListener('pointerup', handleMouseUp);
      window.addEventListener('pointercancel', handleMouseUp);
    } else {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointercancel', handleMouseUp);
    }
    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointercancel', handleMouseUp);
    };
  }, [draggingNode, draggedCable, isPanning, panStart]);

  const handleCanvasMouseDown = (e: any) => {
    if ((e.target as Element).closest('.hardware-node') || (e.target as Element).closest('header') || (e.target as Element).closest('button')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  return (
    <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 p-6 font-sans flex flex-col items-center selection:bg-cyan-500/30">
      
      {/* Header & Controls have been moved to Toolbar */}

      {/* Main Interactive Canvas */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full bg-white/50 dark:bg-neutral-950/50 rounded-xl border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden touch-none text-black/5 dark:text-white/5"
        onPointerDown={handleCanvasMouseDown}
        style={{
          backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: '20px 20px',
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
      >
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
        
        {/* SVG Canvas for Cables */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
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

            const startX = isDraggingStart ? draggedCable.x : nodes[conn.source]!.x + conn.startOffset.x;
            const startY = isDraggingStart ? draggedCable.y : nodes[conn.source]!.y + conn.startOffset.y;
            const endX = isDraggingEnd ? draggedCable.x : nodes[conn.target]!.x + conn.endOffset.x;
            const endY = isDraggingEnd ? draggedCable.y : nodes[conn.target]!.y + conn.endOffset.y;
            
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
                <circle cx={startX} cy={startY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onPointerDown={(e: any) => handleCableDragStart(e, id, 'source')} />
                <circle cx={endX} cy={endY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onPointerDown={(e: any) => handleCableDragStart(e, id, 'target')} />
              </g>
            );
          })}
          {draggedCable && (
             <circle cx={draggedCable.x} cy={draggedCable.y} r="5" fill="#06b6d4" />
          )}
        </svg>

        {/* Cable Labels (Editable) */}
        {Object.entries(connections).map(([id, conn]) => {
            const isDraggingStart = draggedCable?.id === id && draggedCable?.endpoint === 'source';
            const isDraggingEnd = draggedCable?.id === id && draggedCable?.endpoint === 'target';
            const startX = isDraggingStart ? draggedCable.x : nodes[conn.source]!.x + conn.startOffset.x;
            const startY = isDraggingStart ? draggedCable.y : nodes[conn.source]!.y + conn.startOffset.y;
            const endX = isDraggingEnd ? draggedCable.x : nodes[conn.target]!.x + conn.endOffset.x;
            const endY = isDraggingEnd ? draggedCable.y : nodes[conn.target]!.y + conn.endOffset.y;
            if(startX === undefined || endX === undefined) return null;

            const getBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
               const mt = 1 - t;
               return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
            };

            let midX, midY;
            if (conn.type.includes('midi')) {
               const controlY = startY - 100;
               midX = getBezier(0.5, startX, startX, endX, endX);
               midY = getBezier(0.5, startY, controlY, controlY, endY);
            } else {
               midX = getBezier(0.5, startX, startX + 100, endX - 100, endX);
               midY = getBezier(0.5, startY, startY, endY, endY);
            }
            
            const style = CABLE_TYPES[conn.type];

            return (
              <div key={`label-${id}`} className="absolute z-20 pointer-events-none" style={{ left: midX, top: midY, transform: 'translate(-50%, -50%)' }}>
                 {editingLabel === id ? (
                   <input
                     autoFocus
                     defaultValue={conn.label}
                     className="bg-neutral-900 text-white text-xs px-2 py-1 rounded border border-neutral-500 outline-none w-28 text-center pointer-events-auto"
                     onBlur={(e: any) => {
                       setConnections(prev => ({...prev, [id]: {...prev[id]! as OverviewConnection, label: e.target.value}}));
                       setEditingLabel(null);
                     }}
                     onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
                   />
                 ) : (
                   <div 
                     onDoubleClick={() => setEditingLabel(id)}
                     className="px-2 py-1 rounded border backdrop-blur-sm text-[10px] font-bold cursor-text hover:scale-110 transition-transform whitespace-nowrap pointer-events-auto"
                     style={{ color: style.color, borderColor: style.color, backgroundColor: 'rgba(20,20,20,0.8)' }}
                   >
                     {conn.label}
                   </div>
                 )}
              </div>
            );
        })}

        {/* Hardware Nodes Rendering */}
        {Object.keys(nodes).map(nodeId => {
          const nodeState = nodes[nodeId]!;
          const blueprint = HARDWARE_LIBRARY[nodeState.type];
          if (!blueprint) return null;
          const isExpanded = nodeState.isExpanded !== false;
          const isHardwareExpanded = nodeState.isHardwareExpanded !== false;

          return (
            <div 
              key={nodeId}
              data-id={nodeId}
              className={`hardware-node pointer-events-auto absolute bg-neutral-900 rounded-xl border-t-4 shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition-transform duration-200 ${hoveredNodeId === nodeId ? 'ring-4 ring-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.6)] scale-[1.02] z-[100]' : 'hover:ring-2 ring-white/10'} ${blueprint.theme.border}`}
              style={{ left: nodeState.x, top: nodeState.y, zIndex: hoveredNodeId === nodeId ? 100 : nodeState.zIndex, width: blueprint.width }}
              onPointerDown={(e: any) => handleNodeMouseDown(nodeId, e)}
              onDoubleClick={(e: any) => handleNodeDoubleClick(nodeId, e)}
            >
              {/* Header */}
              <div className={`p-2 flex justify-between items-center ${blueprint.theme.header}`}>
                <div>
                  <h3 className={`font-black tracking-tight leading-none ${blueprint.theme.title}`}>{blueprint.model}</h3>
                  <span className="text-[10px] text-neutral-400">{blueprint.brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest ${blueprint.theme.badge}`}>{blueprint.tagline}</span>
                  <button onClick={(e: any) => toggleHardwareExpand(nodeId, e)} className="text-neutral-400 hover:text-white transition-colors focus:outline-none ml-1">
                    {isHardwareExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                  </button>
                </div>
              </div>

              {/* Graphic SVG Component */}
              {isHardwareExpanded && (
                <div className="p-3 bg-neutral-800">
                  <blueprint.visual />
                </div>
              )}

              {/* Collapsible I/O Data */}
              <div className="bg-neutral-950 flex flex-col">
                 <button 
                    onClick={(e: any) => toggleExpand(nodeId, e)}
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
                                onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId]! as OverviewNode, overview: e.target.value}}))}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-cyan-600 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio IN</label>
                                <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'audioIn')} onChange={(e: any) => handlePortSelect(nodeId, 'audioIn', e.target.value)}>
                                   <option value="">- None -</option>
                                   {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type].model}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-orange-500 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio OUT</label>
                                <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'audioOut')} onChange={(e: any) => handlePortSelect(nodeId, 'audioOut', e.target.value)}>
                                   <option value="">- None -</option>
                                   {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type].model}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-emerald-600 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI IN</label>
                                <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'midiIn')} onChange={(e: any) => handlePortSelect(nodeId, 'midiIn', e.target.value)}>
                                   <option value="">- None -</option>
                                   {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type].model}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-blue-500 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI OUT/THRU</label>
                                <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'midiOut')} onChange={(e: any) => handlePortSelect(nodeId, 'midiOut', e.target.value)}>
                                   <option value="">- None -</option>
                                   {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type].model}</option>)}
                                </select>
                             </div>
                         </div>
                         
                         {/* Logical Routing */}
                         <div className="flex flex-col gap-1 mt-1 border-t border-neutral-800 pt-2">
                            <label className="text-[9px] text-yellow-500 uppercase font-bold">Logical MIDI Routing (Channels)</label>
                            <textarea 
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 resize-none h-12 outline-none focus:border-neutral-500 leading-tight text-[10px]"
                                value={nodeState.midiChannels || ''}
                                placeholder="e.g. Expects Input Ch 3"
                                onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId]! as OverviewNode, midiChannels: e.target.value}}))}
                            />
                         </div>
                         
                         {/* Origin Cable Managers */}
                         <div className="mt-2 pt-2 border-t border-neutral-800 flex flex-col gap-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-bold">Outgoing Cables Manager</label>
                            {Object.entries(connections).filter(([_, conn]) => conn.source === nodeId).map(([cId, conn]) => (
                                <select 
                                    key={cId}
                                    value={conn.type}
                                    onChange={(e: any) => setConnections(p => ({...p, [cId]: {...p[cId]! as OverviewConnection, type: e.target.value}}))}
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
    </div>
  );
}