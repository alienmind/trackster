import { HardwareBlueprint } from '../stores/useOverviewStore';

import data from '../../devices/s1.json';

export const s1: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
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
};
