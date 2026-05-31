import { memo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import { useUIStore } from '../../../stores/useUIStore';
import type { PackSlot } from '../../../types';
import clsx from 'clsx';
import * as Icons from 'lucide-react';

interface PackPadProps {
  slot: PackSlot;
}

const PackPad = memo(function PackPad({ slot }: PackPadProps) {
  const { loadPack } = useFileSystemStore();
  const { setActiveMainView } = useUIStore();
  const id = `packpad-${slot.index}`;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    data: { type: 'packpad', current: slot },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    data: { type: 'packpad', current: slot },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    if (slot.pack) {
      loadPack(slot.pack.originalDirname);
      setActiveMainView('samples');
    }
  };

  return (
    <div
      ref={setDroppableRef}
      className={clsx(
        'relative aspect-square rounded-md border-2 p-2 flex flex-col items-center justify-center transition-all shadow-sm select-none',
        slot.pack
          ? 'bg-secondary border-primary/20 hover:border-primary/50'
          : 'bg-card border-dashed border-border text-muted-foreground',
        isOver && 'ring-2 ring-primary bg-primary/10 border-primary'
      )}
      onClick={handleClick}
    >
      <div className="absolute top-1 left-2 text-[10px] font-mono text-muted-foreground">
        {slot.index.toString().padStart(2, '0')}
      </div>
      
      {slot.pack ? (
        <div
          ref={setDraggableRef}
          style={style}
          {...listeners}
          {...attributes}
          className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-md p-1"
        >
          <Icons.Folder className="text-primary mb-1" size={24} />
          <span className="text-xs text-center font-medium leading-tight line-clamp-2 w-full break-words">
            {slot.pack.displayName}
          </span>
        </div>
      ) : (
        <div className="text-[10px] uppercase opacity-50 mt-2">Empty</div>
      )}
    </div>
  );
});

export default PackPad;
