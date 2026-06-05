import React, { useLayoutEffect, useRef, useState } from 'react';
import { OverviewNode } from '../../stores/useOverviewStore';
import { HARDWARE_LIBRARY } from '../../devices';

// Fixed intrinsic size for visual()-rendered devices. We render the visual at
// these dimensions, then scale it down with a CSS transform to fit the cell.
const VIRTUAL_W = 320;
const VIRTUAL_H = 220;

function ScaledVisual({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const parent = el.parentElement as HTMLElement;
    const fit = () => {
      const r = parent.getBoundingClientRect();
      const PAD = 8;
      const availW = Math.max(20, r.width - PAD * 2);
      const availH = Math.max(20, r.height - PAD * 2);
      const s = Math.min(availW / VIRTUAL_W, availH / VIRTUAL_H);
      setScale(Math.max(0.05, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        width: VIRTUAL_W,
        height: VIRTUAL_H,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        flexShrink: 0,
      }}
      className="flex items-center justify-center"
    >
      <div style={{ width: VIRTUAL_W, height: VIRTUAL_H }} className="flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const deviceImages = import.meta.glob('../../../devices/*/device.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface GridNodeProps {
  node: OverviewNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onNavigate: (e: React.MouseEvent) => void;
}

export default function GridNode({ node, isSelected, onSelect, onNavigate }: GridNodeProps) {
  const blueprint = HARDWARE_LIBRARY[node.type];
  
  // Find the matching device.png image. Use the blueprint's optional assetFolder
  // override when the on-disk folder name differs from the node type (e.g. 'circuit' -> 'circuittracks').
  const assetFolder = blueprint?.assetFolder || node.type;
  const imageKey = Object.keys(deviceImages).find(k => k.includes(`/${assetFolder}/`));
  const imageUrl = imageKey ? deviceImages[imageKey] : undefined;

  // Some devices have a visual() React component instead of a device.png
  const hasVisual = !!blueprint?.visual;

  return (
    <div 
      className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden transition-all
        ${isSelected 
          ? 'border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.55)] scale-[1.04] z-10 ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-neutral-950' 
          : 'border border-neutral-700/60 hover:border-neutral-500/80 hover:shadow-lg'
        }
        bg-neutral-900`}
      style={{ borderTopWidth: '3px', borderTopColor: blueprint?.theme?.border ? undefined : '#525252' }}
    >
      {/* Header - Click to select/properties */}
      <div 
        className="p-2 px-3 flex justify-between items-center bg-neutral-950/80 border-b border-neutral-800/50 flex-shrink-0 cursor-pointer hover:bg-neutral-800 transition-colors"
        onClick={onSelect}
      >
        <div className="flex flex-col overflow-hidden min-w-0">
          <h3 className={`font-black tracking-tight leading-none text-sm truncate ${blueprint?.theme?.title || 'text-white'}`}>
            {blueprint?.model || node.type}
          </h3>
          <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider truncate mt-0.5">
            {blueprint?.brand || ''}
          </span>
        </div>
        <div className="flex-shrink-0 ml-2">
          <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold tracking-widest whitespace-nowrap ${blueprint?.theme?.badge || 'bg-neutral-800 text-neutral-500'}`}>
            {blueprint?.tagline || 'DEVICE'}
          </span>
        </div>
      </div>

      {/* Visual / Image - Click to navigate */}
      <div 
        className="flex-1 relative overflow-hidden bg-gradient-to-b from-neutral-800/10 to-neutral-900/30 flex items-center justify-center p-2 cursor-pointer group"
        onClick={onNavigate}
      >
        {/* Subtle hover overlay to indicate it's clickable */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors z-10 pointer-events-none" />
        
        {hasVisual ? (
          <ScaledVisual>{blueprint!.visual!()}</ScaledVisual>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={blueprint?.model} 
            className="max-w-[90%] max-h-[90%] object-contain drop-shadow-lg" 
          />
        ) : (
          <div className="text-neutral-600 text-xs font-medium uppercase tracking-widest opacity-50">
            {blueprint?.model || node.type}
          </div>
        )}
      </div>
    </div>
  );
}
