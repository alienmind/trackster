import { HardwareBlueprint } from '../stores/useOverviewStore';

export const flow8: HardwareBlueprint = {
  brand: "Behringer", model: "Behringer Flow 8", tagline: "MIXER", width: 320,
  theme: { border: "border-t-yellow-500", header: "bg-yellow-950", title: "text-yellow-400", badge: "bg-yellow-900 text-yellow-200" },
  ports: [
    { id: 'usb', title: 'USB Audio', color: '#ec4899', side: 'left', offset: 50 },
    { id: 'synth1', title: 'Ch 1/2', color: '#f97316', side: 'left', offset: 100 },
    { id: 'synth2', title: 'Ch 3/4', color: '#f97316', side: 'left', offset: 150 },
    { id: 'mainOut', title: 'Main Out', color: '#06b6d4', side: 'right', offset: 100 }
  ],
  visual: () => (
    <div className="w-full bg-[#111] p-3 rounded-lg border border-neutral-700 shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none flex flex-col gap-3">
       {/* Mixer Sections */}
       <div className="flex gap-2 justify-between">
         {/* Channels */}
         {[...Array(6)].map((_,i) => (
           <div key={`ch-${i}`} className="flex flex-col items-center gap-1">
             <div className="w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md"></div>
             <div className="w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md"></div>
             <div className="w-3 h-10 bg-neutral-900 rounded-sm shadow-inner relative flex justify-center mt-2">
                <div className="w-0.5 h-full bg-black"></div>
                <div className="absolute top-[60%] w-4 h-5 bg-neutral-300 rounded shadow-md border-b-2 border-neutral-500"></div>
             </div>
           </div>
         ))}
         {/* Main Out */}
         <div className="flex flex-col items-center gap-1 border-l border-neutral-800 pl-2">
            <div className="flex gap-1">
               <div className="w-2 h-16 bg-neutral-900 rounded-full flex flex-col justify-end p-0.5 gap-0.5 shadow-inner">
                  {[...Array(10)].map((_,i) => <div key={`m1-${i}`} className={`w-full h-1 rounded-sm ${i<2?'bg-red-500':i<4?'bg-yellow-500':'bg-green-500'}`}></div>)}
               </div>
               <div className="w-2 h-16 bg-neutral-900 rounded-full flex flex-col justify-end p-0.5 gap-0.5 shadow-inner">
                  {[...Array(10)].map((_,i) => <div key={`m2-${i}`} className={`w-full h-1 rounded-sm ${i<2?'bg-red-500':i<4?'bg-yellow-500':'bg-green-500'}`}></div>)}
               </div>
            </div>
            <div className="w-4 h-12 bg-neutral-900 rounded-sm shadow-inner relative flex justify-center mt-1 border border-neutral-700">
               <div className="w-0.5 h-full bg-black"></div>
               <div className="absolute top-[20%] w-5 h-6 bg-red-600 rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] border-b-2 border-red-800"></div>
            </div>
         </div>
       </div>
    </div>
  )
};
