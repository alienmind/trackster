

import React, { useState, useRef } from 'react';

// --- SVGS & SILKSCREEN GRAPHICS ---
export const SpaceGraphics = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 z-0">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Osc Orange Wavy Lines wrapping around the 4 orange knobs */}
      <path d="M 500 55 Q 530 20 560 55 T 620 55 T 680 55 T 740 55" fill="none" stroke="#ff5500" strokeWidth="1.5" />
      <path d="M 480 65 Q 540 100 600 65 T 690 65 T 750 65" fill="none" stroke="#ff5500" strokeWidth="0.75" />
      
      {/* Constellations and Stars */}
      <circle cx="780" cy="40" r="1.5" fill="#fff" />
      <circle cx="820" cy="25" r="1" fill="#fff" />
      <circle cx="800" cy="70" r="2" fill="#fff" />
      <path d="M 790 60 L 810 80 M 810 60 L 790 80" stroke="#fff" strokeWidth="0.0" className="hidden" />
      <path d="M 850 90 L 870 70 L 900 80 L 920 50" fill="none" stroke="#fff" strokeWidth="0.0" className="hidden" />
      <circle cx="850" cy="90" r="1.5" fill="#fff" />
      <circle cx="870" cy="70" r="1.5" fill="#fff" />
      <circle cx="900" cy="80" r="1.5" fill="#fff" />
      <circle cx="920" cy="50" r="1.5" fill="#fff" />
      
      {/* Mini Planet */}
      <circle cx="880" cy="120" r="6" fill="none" stroke="#fff" strokeWidth="1" />
      <path d="M 870 125 Q 880 115 892 118" fill="none" stroke="#fff" strokeWidth="1" />
    </svg>
  </div>
);

export const ShiftRing = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" className="absolute top-[-5px] left-1/2 -translate-x-1/2 pointer-events-none">
    {[...Array(12)].map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x = 20 + 16 * Math.cos(angle);
      const y = 20 + 16 * Math.sin(angle);
      return <circle key={i} cx={x} cy={y} r="1.5" fill="#22d3ee" />;
    })}
  </svg>
);

export const ChevronPattern = ({ isPitch = false }: { isPitch?: boolean }) => {
  const downPath = "M 6 10 L 20 20 L 34 10 M 6 16 L 20 26 L 34 16 M 6 22 L 20 32 L 34 22";
  const upPath   = "M 6 32 L 20 22 L 34 32 M 6 26 L 20 16 L 34 26 M 6 20 L 20 10 L 34 20";

  if (isPitch) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 40 200" preserveAspectRatio="none" className="opacity-40">
        <line x1="6" y1="105" x2="34" y2="105" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        
        {/* Top half: points upwards */}
        {[10, 34, 58].map((yOff, i) => (
          <g key={`up-${i}`} transform={`translate(0, ${yOff})`}>
            <path d={upPath} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        ))}
        
        {/* Bottom half: points downwards */}
        {[110, 134, 158].map((yOff, i) => (
          <g key={`down-${i}`} transform={`translate(0, ${yOff})`}>
            <path d={downPath} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 40 200" preserveAspectRatio="none" className="opacity-40">
      {[...Array(7)].map((_, i) => (
        <g key={i} transform={`translate(0, ${i * 24 + 10})`}>
          <path d={upPath} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
};

// --- COMPONENTS ---

export const WhiteBtn = ({ label, subLabel, isShift = false, hasLed = false, ledActive = false, noLabelSpace = false }: { label?: string, subLabel?: string, isShift?: boolean, hasLed?: boolean, ledActive?: boolean, noLabelSpace?: boolean }) => (
  <div className="flex flex-col items-center relative">
    {isShift && <ShiftRing />}
    <button className="w-[20px] h-[20px] rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)] active:translate-y-[1px] active:shadow-none z-10 transition-all flex items-center justify-center relative overflow-hidden">
      {hasLed && (
        <div className={`absolute w-1.5 h-1.5 rounded-full top-[3px] left-1/2 -translate-x-1/2 ${ledActive ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-[#111]'}`} />
      )}
    </button>
    {!noLabelSpace && (
      <div className="mt-1 flex flex-col items-center h-6 z-10">
        {label && <span className="text-[8px] text-gray-300 font-bold leading-none text-center">{label}</span>}
        {subLabel && <span className="text-[8px] text-cyan-500 font-bold leading-tight text-center">{subLabel}</span>}
      </div>
    )}
  </div>
);

export const Selector = ({ title, titleColor = "text-gray-500", labels, activeIdx = 0, titlePosition = "top" }: { title: string, titleColor?: string, labels: string[], activeIdx?: number, titlePosition?: "top" | "bottom" }) => (
  <div className="flex flex-col items-center mr-2">
    {titlePosition === 'top' && (
      <span className={`text-[8px] ${titleColor} font-bold uppercase tracking-widest mb-1`}>{title}</span>
    )}
    <div className="flex items-center gap-1.5">
      <div className="relative flex flex-col items-center">
        <WhiteBtn noLabelSpace={true} />
        {titlePosition === 'bottom' && (
          <div className="absolute top-[24px] left-1/2 -translate-x-1/2 flex justify-center pointer-events-none whitespace-nowrap">
            <span className={`text-[8px] ${titleColor} font-bold uppercase tracking-widest`}>{title}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 justify-center">
        {labels.map((lbl, i) => (
          <div key={lbl} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${i === activeIdx ? 'bg-orange-500 shadow-[0_0_6px_#ff5500]' : 'bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]'}`} />
            <span className="text-[7px] text-gray-400 font-bold tracking-wider leading-none">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ModMatrix = () => {
  const rows = ['CycEnv', 'Envelope', 'LFO 1', 'LFO 2', 'Vel/AT', 'Wheel', 'Keyboard'];
  const cols = ['Pitch 1+2', 'Wave 1', 'Timbre 1', 'Cutoff', 'Assign 1', 'Assign 2', 'Assign 3'];

  return (
    <div className="flex bg-[#1a1b1e] p-2 rounded border border-[#2a2d33] shadow-inner font-sans relative z-10">
      
      {/* Y Axis Labels */}
      <div className="flex flex-col justify-between pr-2 text-[8px] font-semibold text-gray-400 text-right leading-[11px]">
        {rows.map(r => <span key={r}>{r}</span>)}
      </div>
      
      <div className="flex flex-col">
        {/* X Axis Labels */}
        <div className="flex justify-between pl-1 pb-1 text-[7px] font-semibold text-gray-400">
          {cols.map((c) => (
             <div key={c} className="w-[11px] h-10 relative">
               <span className="absolute bottom-0 left-0 origin-bottom-left -rotate-60 whitespace-nowrap">{c}</span>
             </div>
          ))}
        </div>
        
        {/* Grid Dots */}
        <div className="grid grid-cols-7 gap-[5px] p-1 bg-[#111] rounded border border-[#222]">
          {[...Array(49)].map((_, i) => (
            <div key={i} className="w-[5px] h-[5px] rounded-full bg-[#2a2d33] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
              {i === 24 && <div className="w-full h-full rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>}
              {i === 3 && <div className="w-full h-full rounded-full bg-white shadow-[0_0_4px_#fff]"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Page Button & LED next to grid */}
      <div className="flex flex-col items-center justify-start ml-2 pt-1.5 gap-1.5">
         <span className="text-[7px] text-cyan-500 font-bold">Page</span>
         <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
         <button className="w-4 h-4 rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:translate-y-[1px]" />
      </div>

    </div>
  );
};

const InteractiveTouchStrip = ({ ledSide, isPitch = false }: { ledSide: 'left' | 'right', isPitch?: boolean }) => {
  const [value, setValue] = useState(isPitch ? 7 : 14);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let y = e.clientY - rect.top;
    if (y < 0) y = 0;
    if (y > rect.height) y = rect.height;
    
    const step = Math.round((y / rect.height) * 14);
    setValue(step);
  };

  const handlePointerUp = () => {
    if (isPitch) {
      setValue(7);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0) {
      handlePointer(e);
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2 relative h-full">
      {ledSide === 'left' && (
        <div className="flex flex-col gap-1 justify-between h-full py-2">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`w-[3px] h-[3px] rounded-full ${i >= value ? 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]' : 'bg-[#222]'}`} />
          ))}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-8 h-full bg-[#111] rounded border border-[#000] shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden cursor-ns-resize"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          handlePointerUp();
        }}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <ChevronPattern isPitch={isPitch} />
      </div>

      {ledSide === 'right' && (
        <div className="flex flex-col gap-1 justify-between h-full py-2">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`w-[3px] h-[3px] rounded-full ${i >= value ? 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]' : 'bg-[#222]'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TouchStrips = () => (
  <div className="flex gap-4 px-5 py-4 bg-[#1a1b1e] rounded border border-[#2a2d33] shadow-inner h-48 relative z-10">
    <InteractiveTouchStrip ledSide="left" isPitch={true} />
    <InteractiveTouchStrip ledSide="right" isPitch={false} />
  </div>
);

export const Keyboard = () => {
  const octaves = 3;
  const pattern = [
    { type: 'w', note: 'C' }, { type: 'b', note: 'C#' }, { type: 'w', note: 'D' }, { type: 'b', note: 'D#' },
    { type: 'w', note: 'E' }, { type: 'w', note: 'F' }, { type: 'b', note: 'F#' }, { type: 'w', note: 'G' },
    { type: 'b', note: 'G#' }, { type: 'w', note: 'A' }, { type: 'b', note: 'A#' }, { type: 'w', note: 'B' }
  ];
  let keys: any[] = [];
  for (let i = 0; i < octaves; i++) { keys = keys.concat(pattern); }
  keys.push({ type: 'w', note: 'C' });

  let whiteKeyCount = 0;
  const mappedKeys = keys.map((key) => {
    if (key.type === 'w') {
      const pos = whiteKeyCount;
      whiteKeyCount++;
      return { ...key, pos };
    } else {
      return { ...key, pos: whiteKeyCount - 1 };
    }
  });

  return (
    <div className="relative h-44 w-full bg-[#111] border-t-[6px] border-[#ff5500] rounded-b-md p-1 pl-2">
      <div className="relative h-full flex w-full">
        {mappedKeys.filter(k => k.type === 'w').map((_k, i) => (
          <div 
            key={`w-${i}`} 
            className="h-full bg-gradient-to-b from-[#2a2d33] to-[#1a1b1e] border-x border-b border-[#0a0a0a] rounded-b-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_2px_rgba(0,0,0,0.5)] active:bg-[#111] flex-1 z-0 transition-colors"
          />
        ))}
        {mappedKeys.filter(k => k.type === 'b').map((k, i) => (
          <div 
            key={`b-${i}`} 
            className="absolute h-2/3 bg-gradient-to-b from-[#1a1a1a] to-[#000] border-x border-b border-[#000] rounded-b-sm shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] active:bg-[#000] z-10 transition-colors"
            style={{ 
              width: `${100 / 22 * 0.6}%`,
              left: `${(k.pos + 0.7) * (100 / 22)}%` 
            }}
          />
        ))}
      </div>
    </div>
  );
};
