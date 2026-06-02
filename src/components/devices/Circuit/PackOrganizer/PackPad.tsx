import { memo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import type { PackSlot } from '../../../../types';
import * as Icons from 'lucide-react';

interface PackPadProps {
  slot: PackSlot;
  onSelect?: () => void;
}

const PackPad = memo(function PackPad({ slot, onSelect }: PackPadProps) {
  const { loadPack, activePack } = useCircuitTracksStore();
  const id = `packpad-${slot.index}`;

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id,
    data: { type: 'packpad', current: slot },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    data: { type: 'packpad', current: slot },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
  };

  const handleClick = () => {
    if (isDragging) return;
    if (slot.pack) {
      loadPack(slot.pack.originalDirname);
      onSelect?.();
    }
  };

  const isSelected = activePack === slot.pack?.originalDirname;
  const isTopHalf = (slot.index % 32) < 16;
  const colorClass = slot.pack ? (isTopHalf ? 'bg-amber-400 text-black' : 'bg-orange-400 text-black') : 'bg-neutral-800 border-dashed border-neutral-700/50 text-white/50 opacity-50';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        relative w-full aspect-square rounded-sm transition-all duration-75 cursor-pointer touch-none outline-none focus:outline-none group
        ${colorClass}
        ${slot.pack ? 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] active:translate-y-[2px] hover:brightness-110' : ''}
        ${isDragging ? 'opacity-30' : ''}
        ${isOver ? 'ring-2 ring-white scale-105 z-20' : ''}
        ${isSelected ? 'brightness-125 shadow-[0_0_15px_rgba(255,255,255,0.6),inset_0_0_10px_rgba(255,255,255,0.6)] z-10 border-2 border-white' : (slot.pack ? 'border border-black/20' : 'border')}
      `}
      {...attributes}
      {...listeners}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${slot.pack ? 'text-black/50' : 'text-neutral-500'}`}>
        {slot.index.toString().padStart(2, '0')}
      </div>
      
      {slot.pack && (
        <div className="flex h-full flex-col items-center justify-center pt-2 gap-1 pointer-events-none">
          <Icons.Folder className="text-black/70 mb-0.5" size={20} />
          <div className="w-full truncate text-center text-[10px] font-bold px-1 drop-shadow-sm">
            {slot.pack.displayName}
          </div>
        </div>
      )}
      {!slot.pack && (
        <div className="flex h-full flex-col items-center justify-center pointer-events-none">
           <div className="text-[10px] uppercase opacity-50 mt-2">Empty</div>
        </div>
      )}
    </div>
  );
});

export default PackPad;
