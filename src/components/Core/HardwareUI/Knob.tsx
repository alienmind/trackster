import React, { useState } from 'react';

export interface KnobProps {
  label?: string;
  subLabel?: string;
  size?: number;
  onInteract?: () => void;
  variant?: 'classic' | 'black' | 'orange' | 'blue' | 'encoder';
  hasLed?: boolean;
}

export const Knob = ({ label = '', subLabel, size = 50, onInteract, variant = 'classic', hasLed }: KnobProps) => {
  const gradId = label.replace(/\s+/g, '') + '-' + variant;

  const [rotation, setRotation] = useState(0); // -135 to 135 degrees
  const isDragging = React.useRef(false);
  const startY = React.useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
    if (onInteract) onInteract();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY;
    startY.current = e.clientY;
    setRotation((prev) => Math.min(135, Math.max(-135, prev + deltaY * 2)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const progress = Math.abs(rotation) / 135;
  let r = 156, g = 163, b = 175;

  if (rotation > 0) {
    r = Math.round(156 + (217 - 156) * progress);
    g = Math.round(163 + (70 - 163) * progress);
    b = Math.round(175 + (239 - 175) * progress);
  } else if (rotation < 0) {
    r = Math.round(156 + (59 - 156) * progress);
    g = Math.round(163 + (130 - 163) * progress);
    b = Math.round(175 + (246 - 175) * progress);
  }

  const ledStyle = {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    boxShadow: `0 0 ${8 + progress * 6}px rgb(${r}, ${g}, ${b})`,
    opacity: 0.7 + progress * 0.3
  };

  let capColor = '#16181b';
  let indicatorColor = '#fff';
  let rimColor = '#0a0a0a';

  if (variant === 'orange') {
    capColor = '#ff5500';
    indicatorColor = '#111';
    rimColor = '#cc4400';
  } else if (variant === 'blue') {
    capColor = '#1d4ed8';
    indicatorColor = '#fff';
    rimColor = '#1e3a8a';
  } else if (variant === 'encoder') {
    capColor = '#222';
    indicatorColor = 'transparent';
  }

  // By default, classic has an LED, others do not, unless explicitly passed
  const showLed = hasLed !== undefined ? hasLed : variant === 'classic';

  return (
    <div 
      className={`flex flex-col items-center group cursor-ns-resize ${variant !== 'classic' ? 'z-10 relative w-12' : ''}`}
      onPointerDown={handlePointerDown}
      onDoubleClick={() => setRotation(0)}
      style={{ touchAction: 'none' }}
    >
      <div className="relative flex justify-center items-center">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className="drop-shadow-lg transition-transform group-active:scale-95"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {variant === 'classic' ? (
            <>
              <defs>
                <radialGradient id={`grad-${gradId}`} cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="#222" />
                  <stop offset="100%" stopColor="#0a0a0a" />
                </radialGradient>
                <linearGradient id={`top-${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#333" />
                  <stop offset="100%" stopColor="#111" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill={`url(#grad-${gradId})`} stroke="#000" strokeWidth="2" />
              <circle cx="50" cy="50" r="38" fill={`url(#top-${gradId})`} stroke="#1a1a1a" strokeWidth="1" />
              <line x1="50" y1="50" x2="50" y2="18" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <defs>
                <linearGradient id="glare" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" fill="#111" stroke="#222" strokeWidth="2" />
              <circle cx="50" cy="50" r="40" fill={capColor} stroke={rimColor} strokeWidth="1" />
              <circle cx="50" cy="46" r="32" fill="url(#glare)" opacity="0.2" pointerEvents="none" />
              {variant !== 'encoder' && (
                <line 
                  x1="50" y1="50" x2="50" y2="15" 
                  stroke={indicatorColor} 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
              )}
            </>
          )}
        </svg>
        {showLed && (
          <div 
            className="absolute -bottom-3 w-5 h-1.5 rounded-full transition-all duration-75"
            style={ledStyle}
          ></div>
        )}
      </div>
      
      {variant === 'classic' ? (
        <>
          <span className="text-[10px] text-gray-300 mt-4 font-medium tracking-wide whitespace-nowrap text-center select-none pointer-events-none">
            {label}
          </span>
          {subLabel && (
            <span className="text-[8px] text-gray-500 mt-1 font-bold whitespace-pre text-center select-none pointer-events-none">
              {subLabel}
            </span>
          )}
        </>
      ) : (
        <div className="mt-1 flex flex-col items-center pointer-events-none select-none h-6">
          {label && <span className="text-[9px] text-gray-200 font-bold tracking-wide leading-none text-center whitespace-nowrap">{label}</span>}
          {subLabel && <span className="text-[9px] text-cyan-500 font-bold tracking-wide leading-tight text-center whitespace-nowrap">{subLabel}</span>}
        </div>
      )}
    </div>
  );
};
