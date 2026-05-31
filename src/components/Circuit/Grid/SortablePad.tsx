import { memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import * as Icons from 'lucide-react';
import type { PadSlot } from '../../../types';
import { useAudioStore } from '../../../stores/useAudioStore';
import { useUIStore } from '../../../stores/useUIStore';
import { TagBadge } from '../../Core/TagBadge/TagBadge';

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
  const activePad = useUIStore((s) => s.selectedPadIndex);
  const isSelected = activePad === slot.index;
  const currentlyPlayingSlot = useAudioStore((s) => s.currentlyPlayingSlot);
  const isPlaying = currentlyPlayingSlot === slot.index;
  const togglePlayback = useAudioStore((s) => s.togglePlayback);

  const handleClick = () => {
    if (isDragging) return;
    
    selectPad(slot.index);
    if (slot.sample) {
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

  const tagDef = useFileSystemStore((s) => s.tags.find((t: any) => t.id === slot.sample?.tag));

  const isTopHalf = (slot.index % 32) < 16;
  const colorClass = slot.sample ? (isTopHalf ? 'bg-sky-200 text-black' : 'bg-fuchsia-300 text-black') : 'bg-neutral-800 border-dashed border-neutral-700/50 text-white/50 opacity-50';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        relative w-full aspect-square rounded-sm transition-all duration-75 cursor-pointer touch-none outline-none focus:outline-none group
        ${colorClass}
        ${slot.sample ? 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] active:translate-y-[2px] hover:brightness-110' : ''}
        ${isDragging ? 'opacity-30' : ''}
        ${isOver ? 'ring-2 ring-white scale-105 z-20' : ''}
        ${isSelected ? 'brightness-125 shadow-[0_0_15px_rgba(255,255,255,0.6),inset_0_0_10px_rgba(255,255,255,0.6)] z-10 border-2 border-white' : (slot.sample ? 'border border-black/20' : 'border')}
        ${isPlaying && isSelected ? 'animate-pulse' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${slot.sample ? 'text-black/50' : 'text-neutral-500'}`}>{slot.index}</div>
      
      {slot.sample && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              useFileSystemStore.getState().clearSlot(slot.index);
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
