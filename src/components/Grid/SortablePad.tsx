import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import * as Icons from 'lucide-react';
import type { PadSlot } from '../../types';
import { useAudioStore } from '../../stores/useAudioStore';
import { useUIStore } from '../../stores/useUIStore';
import { TagBadge } from '../TagBadge/TagBadge';

interface SortablePadProps {
  slot: PadSlot;
}

export default function SortablePad({ slot }: SortablePadProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        relative h-24 w-full rounded-md border p-2 transition-all overflow-hidden group touch-none outline-none focus:outline-none
        ${slot.sample ? 'bg-muted cursor-pointer hover:border-border' : 'bg-card border-dashed border-border opacity-50'}
        ${isDragging ? 'opacity-30' : ''}
        ${isOver ? 'ring-2 ring-primary bg-primary/20 scale-105 z-20' : ''}
        ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md shadow-primary/20 scale-[1.02] z-10' : 'border-border'}
        ${isPlaying && isSelected ? 'animate-pulse' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="absolute left-2 top-2 text-xs text-muted-foreground font-mono">{slot.index}</div>
      
      {slot.sample && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              useFileSystemStore.getState().clearSlot(slot.index);
            }}
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-secondary rounded-full hover:bg-red-500/80 text-white z-10 cursor-pointer"
          >
            <Icons.X size={12} />
          </button>
          <div className="flex h-full flex-col items-center justify-center pt-3 gap-1 pointer-events-none">
            {tagDef ? (
              <TagBadge tag={tagDef} />
            ) : (
              <div className="w-8 h-8" />
            )}
            <div className="w-full truncate text-center text-xs font-medium text-foreground px-1">
              {slot.sample.displayName}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
