import React, { useRef, useEffect, useState } from 'react';

interface ScaleFitProps {
  children: React.ReactNode;
  baseWidth: number;
  baseHeight: number;
  maxScale?: number;
}

export default function ScaleFit({ children, baseWidth, baseHeight, maxScale = 2 }: ScaleFitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        const padding = 32; // 16px padding on each side
        const scaleX = (width - padding) / baseWidth;
        const scaleY = (height - padding) / baseHeight;
        // Don't scale up infinitely, and keep minimum scale above 0.1
        setScale(Math.max(0.1, Math.min(scaleX, scaleY, maxScale)));
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [baseWidth, baseHeight, maxScale]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} 
        className="flex-shrink-0 flex items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
}
