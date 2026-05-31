import { HardwareBlueprint } from '../stores/useOverviewStore';

export const minifreak: HardwareBlueprint = {
  brand: "Arturia", model: "MiniFreak Stellar", tagline: "POLYPHONIC SYNTH", width: 300,
  theme: { border: "border-t-zinc-500", header: "bg-zinc-950", title: "text-zinc-300", badge: "bg-zinc-800 text-zinc-400" },
  ports: [
    { id: 'audioOut', title: 'Audio Out', color: '#06b6d4', side: 'right', offset: 50 },
    { id: 'midiIn', title: 'MIDI In', color: '#10b981', side: 'left', offset: 100 },
    { id: 'midiOut', title: 'MIDI Out', color: '#3b82f6', side: 'right', offset: 100 }
  ],
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
};
