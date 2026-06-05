import React from 'react';
import { OverviewNode } from '../../stores/useOverviewStore';
import { HARDWARE_LIBRARY } from '../../devices';

const deviceImages = import.meta.glob('../../../devices/*/device.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface GridNodeProps {
  node: OverviewNode;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onNavigate: (e: React.MouseEvent) => void;
}

export default function GridNode({ node, isSelected, onSelect, onNavigate }: GridNodeProps) {
  const blueprint = HARDWARE_LIBRARY[node.type];
  
  // Find the matching device.png image
  const imageKey = Object.keys(deviceImages).find(k => k.includes(`/${node.type}/`));
  const imageUrl = imageKey ? deviceImages[imageKey] : undefined;

  // Some devices have a visual() React component instead of a device.png
  const hasVisual = !!blueprint?.visual;

  return (
    <div 
      className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden transition-all
        ${isSelected 
          ? 'border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02] z-10' 
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
          <div className="w-full h-full relative flex items-center justify-center">
             <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
               <div className="w-[140%] shrink-0 flex items-center justify-center">
                 {blueprint!.visual!()}
               </div>
             </div>
          </div>
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
