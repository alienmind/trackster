import React, { useState } from 'react';
import { useKnobInteraction } from '../../../hooks/useKnobInteraction';

// Raw 3.5mm Patch Jack
export const Jack = () => (
  <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#111] to-[#333] border border-[#000] p-[2px] shadow-[0_1px_2px_rgba(255,255,255,0.2)]">
    <div className="w-full h-full rounded-full bg-black border-[1.5px] border-gray-600 shadow-inner flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full bg-[#050505] shadow-[inset_0_2px_4px_rgba(0,0,0,1)]"></div>
    </div>
  </div>
);

// Interactive Knob (S1 Specific)
export const S1Knob = ({ label, subLabel, size = 36, ringColor = "transparent", variant = "standard", value, onChange }: { label?: React.ReactNode, subLabel?: string, size?: number, ringColor?: string, variant?: 'standard' | 'encoder', value?: number, onChange?: (val: number) => void }) => {
  const { rotation, handlePointerDown, resetRotation } = useKnobInteraction({
    value,
    onChange,
    sensitivity: 2.7
  });

  return (
    <div className="flex flex-col items-center group relative z-10 w-12">
      <div 
        className="relative flex justify-center items-center cursor-ns-resize"
        onPointerDown={handlePointerDown}
        onDoubleClick={resetRotation}
        style={{ touchAction: 'none' }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className="drop-shadow-md transition-transform group-active:scale-95"
          style={{ transform: variant === 'encoder' ? 'none' : `rotate(${rotation}deg)` }}
        >
          <circle cx="50" cy="50" r="48" fill="#111" stroke="#333" strokeWidth="1" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="3" opacity={ringColor === 'transparent' ? 0 : 1} />
          <circle cx="50" cy="50" r="39" fill="#1c1c1e" stroke="#000" strokeWidth="1" />
          <circle cx="50" cy="46" r="32" fill="url(#glare)" opacity="0.15" pointerEvents="none" />
          <defs>
            <linearGradient id="glare" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {variant !== 'encoder' && (
            <line x1="50" y1="50" x2="50" y2="15" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          )}
          {variant === 'encoder' && (
            <circle cx="50" cy="25" r="8" fill="#0a0a0a" stroke="#222" strokeWidth="1" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50px 50px' }} />
          )}
        </svg>
      </div>
      <div className="mt-1 flex flex-col items-center pointer-events-none select-none min-h-[16px]">
        {label && <span className="text-[8px] text-gray-200 font-bold tracking-wide leading-none text-center whitespace-nowrap flex items-center justify-center">{label}</span>}
        {subLabel && <span className="text-[7px] text-gray-400 font-bold tracking-wide leading-tight text-center whitespace-nowrap mt-0.5">{subLabel}</span>}
      </div>
    </div>
  );
};

// Simple SVG Icons for Waveforms
export const SqIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
    <path d="M3 12h5v-6h8v12h5v-6h3" />
  </svg>
);
export const SawIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4v16L20 4" />
  </svg>
);

// Range Knob Component
export const RangeKnob = ({ value, onChange }: { value?: number, onChange?: (val: number) => void }) => (
  <div className="relative w-[48px] flex justify-center items-center pt-2">
     <span className="absolute top-1 left-0 text-[8px] text-white font-bold pointer-events-none">16'</span>
     <span className="absolute top-1 right-0 text-[8px] text-white font-bold pointer-events-none">8'</span>
     <span className="absolute top-[18px] -left-3 text-[8px] text-white font-bold pointer-events-none">32'</span>
     <span className="absolute top-[18px] -right-2 text-[8px] text-white font-bold pointer-events-none">4'</span>
     <span className="absolute top-[32px] left-0 text-[8px] text-white font-bold pointer-events-none">64'</span>
     <span className="absolute top-[32px] right-0 text-[8px] text-white font-bold pointer-events-none">2'</span>
     <S1Knob size={36} subLabel="RANGE" value={value} onChange={onChange} />
  </div>
);

// Rectangular Button (For standard buttons)
export const RectButton = ({ label, topLabel, bottomLabel, active = false, ledColor = "#ff3333", className = "", width = "w-10", height = "h-6", onClick }: { label: React.ReactNode, topLabel?: string, bottomLabel?: string, active?: boolean, ledColor?: string, className?: string, width?: string, height?: string, onClick?: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-end">
      {topLabel && <span className="text-[7px] text-gray-400 font-bold mb-1 tracking-wider">{topLabel}</span>}
      <button 
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={onClick}
        className={`${width} ${height} rounded-[3px] bg-[#151515] border border-[#000] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${className} ${isPressed ? 'translate-y-[2px] shadow-[0_0px_2px_rgba(0,0,0,0.8)]' : ''}`}
      >
        <span 
          className="text-[7px] font-bold tracking-wider leading-none text-center px-1 flex justify-center items-center"
          style={{ color: active ? ledColor : '#555', textShadow: active ? `0 0 6px ${ledColor}` : 'none' }}
        >
          {label}
        </span>
      </button>
      {bottomLabel && <span className="text-[7px] text-gray-400 font-bold mt-1 tracking-wider text-center">{bottomLabel}</span>}
    </div>
  );
};

// Vertical Button (For the "Black Keys" in the piano layout)
export const VerticalBtn = ({ label, bottomLabel, active = false, ledColor = "#ef4444", onClick }: { label: string, bottomLabel?: string, active?: boolean, ledColor?: string, onClick?: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-end h-full w-full">
      <button
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={onClick}
        className={`w-[75%] h-[28px] rounded-[2px] bg-[#1a1a1a] border-t border-x border-[#333] border-b-[3px] border-b-black shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${isPressed ? 'translate-y-[2px] border-b border-b-[#111] shadow-[0_0px_2px_rgba(0,0,0,0.8)]' : ''}`}
      >
        <span
          className="text-[6px] font-bold tracking-wider leading-none text-center px-1"
          style={{ color: active ? ledColor : '#555', textShadow: active ? `0 0 6px ${ledColor}` : 'none' }}
        >
          {label}
        </span>
      </button>
      <div className="h-6 flex items-start justify-center mt-1">
         {bottomLabel && <span className="text-[5px] text-gray-400 font-bold tracking-wider text-center leading-tight whitespace-pre-wrap px-1">{bottomLabel}</span>}
      </div>
    </div>
  );
};

// TR-Style 16-Step Pad (White Keys)
export const StepPad = ({ number, label, groupLabel, isGlowing = false, onPointerDown, onPointerUp }: { number: string, label?: string, groupLabel?: string, isGlowing?: boolean, onPointerDown?: () => void, onPointerUp?: () => void }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <button 
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`w-full h-8 rounded-sm border border-[#a1a1aa] relative overflow-hidden transition-all active:translate-y-[1px]
          ${isGlowing ? 'bg-[#fbcfe8] border-[#f472b6] shadow-[0_0_8px_#ec4899]' : 'bg-[#e4e4e7] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_3px_rgba(0,0,0,0.4)]'}
        `}
      >
        {isGlowing && <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-pink-400 blur-[2px] opacity-60 rounded-full"></div>}
        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold z-10 ${isGlowing ? 'text-[#be185d]' : 'text-gray-500'}`}>{number}</span>
      </button>
      <div className="h-6 mt-1 flex flex-col items-center">
        {label && <span className="text-[6px] text-gray-300 font-bold tracking-widest uppercase text-center leading-tight whitespace-nowrap">{label}</span>}
        {groupLabel && <span className="text-[6px] text-gray-500 font-bold tracking-widest uppercase text-center leading-tight mt-[1px]">{groupLabel}</span>}
      </div>
    </div>
  );
};

// SVG Digit 8 with Dot
export const Segment8 = () => (
  <svg viewBox="0 0 30 46" className="w-[18px] h-[30px] text-red-500 fill-current drop-shadow-[0_0_3px_rgba(239,68,68,0.8)]">
     <path d="M 6 4 L 20 4 L 17 7 L 9 7 Z" /> {/* Top */}
     <path d="M 21 5 L 23 7 L 23 20 L 20 23 L 18 20 L 18 8 Z" /> {/* Top Right */}
     <path d="M 20 25 L 23 28 L 23 41 L 21 43 L 18 40 L 18 28 Z" /> {/* Bot Right */}
     <path d="M 9 41 L 17 41 L 20 44 L 6 44 Z" /> {/* Bot */}
     <path d="M 3 28 L 6 25 L 8 28 L 8 40 L 5 43 L 3 41 Z" /> {/* Bot Left */}
     <path d="M 3 7 L 5 5 L 8 8 L 8 20 L 6 23 L 3 20 Z" /> {/* Top Left */}
     <path d="M 7 24 L 9 22 L 17 22 L 19 24 L 17 26 L 9 26 Z" /> {/* Middle */}
     <rect x="25" y="40" width="4" height="4" /> {/* Dot */}
  </svg>
);

// Custom 7-Segment LED Screen
export const LedDisplay = () => (
  <div className="bg-[#110000] border-2 border-[#000] rounded p-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,1)] w-[110px] h-[40px] flex items-center justify-end gap-1 overflow-hidden">
    <Segment8 />
    <Segment8 />
    <Segment8 />
    <Segment8 />
  </div>
);
