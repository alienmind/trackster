import React, { useState } from 'react';

export const Knob = ({ label }: { label: string }) => {
  const size = 50;
  const gradId = label.replace(/\s+/g, '');

  const [rotation, setRotation] = useState(0); // -135 to 135 degrees
  const isDragging = React.useRef(false);
  const startY = React.useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
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

  return (
    <div 
      className="flex flex-col items-center group cursor-ns-resize" 
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
          <line 
            x1="50" y1="50" x2="50" y2="18" 
            stroke="#fff" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
        </svg>
        <div 
          className="absolute -bottom-3 w-5 h-1.5 rounded-full transition-all duration-75"
          style={ledStyle}
        ></div>
      </div>
      <span className="text-[10px] text-gray-300 mt-4 font-medium tracking-wide whitespace-nowrap text-center select-none pointer-events-none">
        {label}
      </span>
    </div>
  );
};
