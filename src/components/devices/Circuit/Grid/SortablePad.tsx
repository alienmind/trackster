import { memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import * as Icons from 'lucide-react';
import type { PadSlot } from '../../../../types';
import { useUIStore } from '../../../../stores/useUIStore';
import { TagBadge } from '../../../Core/TagBadge/TagBadge';

interface SortablePadProps {
  slot: PadSlot;
}

const SortablePad = memo(function SortablePad({ slot }: SortablePadProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `pad-${slot.index}`,
    data: { index: slot.index, type: 'pad' },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `pad-${slot.index}`,
    data: { index: slot.index, type: 'pad' },
    disabled: !slot.sample,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  const selectPad = useUIStore((s) => s.selectPad);
  const setSelectedFile = useUIStore((s) => s.setSelectedFile);
  const selectedPads = useUIStore((s) => s.selectedPads);
  const isSelected = selectedPads.includes(slot.index);
  const currentlyPlayingSlot = useCircuitTracksStore((s) => s.currentlyPlayingSlot);
  const isPlaying = currentlyPlayingSlot === slot.index;
  const togglePlayback = useCircuitTracksStore((s) => s.togglePlayback);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const ctrlKey = e.ctrlKey || e.metaKey;
    selectPad(slot.index, e.shiftKey, ctrlKey);
    
    // Playback only if single click or adding to selection, maybe skip if shift-clicking range
    if (slot.sample && !e.shiftKey) {
      togglePlayback(slot.index, slot.sample.fileHandle);
      setSelectedFile(slot.sample);
    } else {
      setSelectedFile(null);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : 1,
  };

  const tagDef = useCircuitTracksStore((s) => s.tags.find((t: any) => t.id === slot.sample?.tag));

  const isTopHalf = (slot.index % 32) < 16;
  const colorClass = slot.sample ? (isTopHalf ? 'bg-sky-200 text-black' : 'bg-fuchsia-300 text-black') : 'bg-neutral-800 border-dashed border-neutral-700/50 text-white/50 opacity-50';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-sm flex flex-col items-center justify-center
        transition-all duration-75 select-none touch-none aspect-square cursor-pointer
        ${colorClass}
        ${isOver ? 'ring-2 ring-white ring-inset scale-95' : ''}
        ${isDragging ? 'opacity-50 ring-2 ring-white scale-110 z-50' : 'hover:brightness-110'}
        ${isSelected && !isDragging ? 'ring-2 ring-white ring-inset shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}
        ${isPlaying ? 'animate-pulse brightness-150 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_2px_5px_rgba(0,0,0,0.5)]'}
      `}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${slot.sample ? 'text-black/50' : 'text-neutral-500'}`}>{slot.index}</div>
      
      {slot.sample && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              useCircuitTracksStore.getState().clearSlot(slot.index);
            }}
            className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-black/20 rounded-full hover:bg-red-500/80 text-white z-10 cursor-pointer"
          >
            <Icons.X size={10} />
          </button>
          <div className="flex h-full flex-col items-center justify-center pt-2 gap-1 pointer-events-none">
            {tagDef ? (
              <TagBadge tag={tagDef} />
            ) : (
              <div className="w-8 h-8" />
            )}
            <div className="w-full truncate text-center text-[10px] font-bold px-1 drop-shadow-sm">
              {slot.sample.displayName}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default SortablePad;
