import { HardwareBlueprint } from '../stores/useOverviewStore';
import { Circle } from 'lucide-react';

import data from '../../devices/grind.json';

export const grind: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
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
};
