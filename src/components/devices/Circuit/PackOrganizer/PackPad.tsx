import { memo, useState, useRef, useEffect } from 'react';
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
  const { loadPack, activePack, clearPackSlot, duplicatePack, renamePack, circuitToolMode, setCircuitToolMode } = useCircuitTracksStore();
  const id = `packpad-${slot.index}`;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(slot.pack?.displayName || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(slot.pack?.displayName || '');
  }, [slot.pack?.displayName]);

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id,
    data: { type: 'packpad', current: slot },
    disabled: isEditing,
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

  const handleClear = () => {
    if (window.confirm(`Are you sure you want to completely remove "${slot.pack?.displayName || slot.pack?.originalDirname}" from your SD Card?\n\nThis cannot be undone.`)) {
      clearPackSlot(slot.index);
    }
  };

  const handleClick = () => {
    if (isDragging || isEditing) return;
    if (slot.pack) {
      if (circuitToolMode === 'duplicate') {
        duplicatePack(slot.index);
        setCircuitToolMode(null);
      } else if (circuitToolMode === 'clear') {
        handleClear();
        setCircuitToolMode(null);
      } else {
        loadPack(slot.pack.originalDirname);
        onSelect?.();
      }
    }
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    setIsEditing(true);
  };

  const handleTouchStart = () => {
    if (isDragging) return;
    longPressTimer.current = setTimeout(() => {
      setIsEditing(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleNameChangeSubmit = () => {
    if (editValue.trim() !== '' && editValue !== slot.pack?.displayName) {
      renamePack(slot.index, editValue.trim());
    } else {
      setEditValue(slot.pack?.displayName || '');
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameChangeSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(slot.pack?.displayName || '');
      setIsEditing(false);
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
        ${slot.pack && !isEditing ? 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] active:translate-y-[2px] hover:brightness-110' : ''}
        ${isDragging ? 'opacity-30' : ''}
        ${isOver ? 'ring-2 ring-white scale-105 z-20' : ''}
        ${isSelected ? 'brightness-125 shadow-[0_0_15px_rgba(255,255,255,0.6),inset_0_0_10px_rgba(255,255,255,0.6)] z-10 border-2 border-white' : (slot.pack ? 'border border-black/20' : 'border')}
      `}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${slot.pack ? 'text-black/50' : 'text-neutral-500'}`}>
        {slot.index.toString().padStart(2, '0')}
      </div>
      
      {slot.pack && !isEditing && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              duplicatePack(slot.index);
            }}
            title="Duplicate pack"
            className="absolute right-[22px] top-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-black/20 rounded-full hover:bg-blue-500/80 text-white z-10 cursor-pointer"
          >
            <Icons.Copy size={10} />
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            title="Remove pack"
            className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-black/20 rounded-full hover:bg-red-500/80 text-white z-10 cursor-pointer"
          >
            <Icons.X size={10} />
          </button>
        </>
      )}

      {slot.pack && (
        <div className="flex h-full flex-col items-center justify-center pt-2 gap-1 pointer-events-none">
          <Icons.Folder className="text-black/70 mb-0.5" size={20} />
          
          {isEditing ? (
            <div className="w-full px-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleNameChangeSubmit}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/90 text-black text-[10px] font-bold text-center rounded outline-none border border-black/50 focus:border-black py-0.5"
              />
            </div>
          ) : (
            <div 
              className="w-full truncate text-center text-[10px] font-bold px-1 drop-shadow-sm pointer-events-auto cursor-text hover:bg-black/10 rounded"
              onClick={handleNameClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              title="Click to rename"
            >
              {slot.pack.displayName}
            </div>
          )}
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
