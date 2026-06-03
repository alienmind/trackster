import React, { useRef } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { cn } from '../../../lib/utils';

export default function RightPane({ children }: { children: React.ReactNode }) {
  const rightPaneWidth = useUIStore((s) => s.rightPaneWidth);
  const setRightPaneWidth = useUIStore((s) => s.setRightPaneWidth);
  const isDeviceMinimized = useUIStore((s) => s.isDeviceMinimized);
  const setDeviceMinimized = useUIStore((s) => s.setDeviceMinimized);
  const isRightPaneCollapsed = useUIStore((s) => s.isRightPaneCollapsed);
  const activeMainView = useUIStore((s) => s.activeMainView);

  const isResizing = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = rightPaneWidth;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isResizing.current) return;
      const deltaX = startX - moveEvent.clientX;
      const maxWidth = window.innerWidth;
      const newWidth = Math.min(maxWidth, Math.max(300, startWidth + deltaX));
      setRightPaneWidth(newWidth);
      
      if (newWidth > maxWidth * 0.8) {
        setDeviceMinimized(true);
      } else {
        setDeviceMinimized(false);
      }
    };
    
    const handlePointerUp = () => {
      isResizing.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
  };

  if (isRightPaneCollapsed && activeMainView !== 'circuit') {
    return null;
  }

  return (
    <div 
      className={cn(
        "flex relative border-l border-border bg-card shrink-0 transition-[width]",
        isDeviceMinimized ? "w-full" : "h-full"
      )}
      style={{ width: isDeviceMinimized ? '100%' : `${rightPaneWidth}px` }}
    >
      {/* Resize Handle */}
      {!isDeviceMinimized && (
        <div 
          className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-50 group"
          onPointerDown={handlePointerDown}
        >
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-1 bg-border group-hover:bg-primary rounded-full transition-colors"></div>
        </div>
      )}

      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Universal Header can be optional, but we will let children define their own header,
            except maybe a global collapse button if we want. For now, the RightPane just encapsulates resize layout. */}
        {children}
      </div>
    </div>
  );
}
