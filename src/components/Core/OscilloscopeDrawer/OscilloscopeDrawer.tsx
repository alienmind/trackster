import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import Oscilloscope from '../Oscilloscope/Oscilloscope';
import * as Icons from 'lucide-react';

export default function OscilloscopeDrawer() {
  const isOscilloscopeOpen = useUIStore(s => s.isOscilloscopeOpen);
  const setOscilloscopeOpen = useUIStore(s => s.setOscilloscopeOpen);
  
  // Height starts at 200px or 30% of window height
  const [height, setHeight] = useState(250);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      // Calculate new height based on mouse Y position
      // Ensure minimum height of 100px and maximum of 80% screen height
      const newHeight = Math.max(100, Math.min(e.clientY, window.innerHeight * 0.8));
      setHeight(newHeight);
    };

    const handleGlobalPointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    if (isOscilloscopeOpen) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isOscilloscopeOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  if (!isOscilloscopeOpen) return null;

  return (
    <div 
      className="w-full flex flex-col border-b border-border bg-background relative z-10"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icons.Activity className="w-4 h-4" />
          Global Oscilloscope
        </div>
        <button 
          onClick={() => setOscilloscopeOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 min-h-0 p-4">
        <Oscilloscope />
      </div>

      {/* Resize Handle */}
      <div 
        className="h-2 w-full absolute bottom-0 left-0 cursor-row-resize hover:bg-primary/20 flex items-center justify-center -mb-1 z-20 group"
        onPointerDown={handlePointerDown}
      >
        <div className="w-8 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
    </div>
  );
}
