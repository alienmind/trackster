import { HardwareBlueprint } from '../stores/useOverviewStore';

export const circuit: HardwareBlueprint = {
  brand: "Novation", model: "Circuit Tracks", tagline: "GROOVEBOX", width: 280,
  theme: { border: "border-t-purple-500", header: "bg-purple-950", title: "text-purple-400", badge: "bg-purple-900 text-purple-200" },
  ports: [
    { id: 'audioIn1', title: 'Audio In 1', color: '#f97316', side: 'left', offset: 40 },
    { id: 'audioIn2', title: 'Audio In 2', color: '#f97316', side: 'left', offset: 60 },
    { id: 'audioOut', title: 'Audio Out', color: '#06b6d4', side: 'right', offset: 50 },
    { id: 'midiIn', title: 'MIDI In', color: '#10b981', side: 'left', offset: 100 },
    { id: 'midiOut', title: 'MIDI Out', color: '#3b82f6', side: 'right', offset: 100 }
  ],
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
};
