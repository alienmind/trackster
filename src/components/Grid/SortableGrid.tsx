import { useEffect } from 'react';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useUIStore } from '../../stores/useUIStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { PAGES } from '../../utils/constants';
import type { PageIndex } from '../../types';
import SortablePad from './SortablePad';

export default function SortableGrid() {
  const slots = useFileSystemStore((s) => s.slots);
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const selectedPadIndex = useUIStore((s) => s.selectedPadIndex);
  const selectPad = useUIStore((s) => s.selectPad);
  const setSelectedFile = useUIStore((s) => s.setSelectedFile);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const currentIdx = selectedPadIndex ?? -1;
      let newIndex = currentIdx;
      
      if (e.key === 'ArrowRight') {
        newIndex = currentIdx === -1 ? 0 : currentIdx + 1;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        newIndex = currentIdx === -1 ? 0 : currentIdx - 1;
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        newIndex = currentIdx === -1 ? 0 : currentIdx + 8;
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        newIndex = currentIdx === -1 ? 0 : currentIdx - 8;
        e.preventDefault();
      } else {
        return;
      }

      if (newIndex >= 0 && newIndex < 64) {
        selectPad(newIndex);
        const newPage = Math.floor(newIndex / 16) as PageIndex;
        if (newPage !== activePage) {
          setActivePage(newPage);
        }

        const slot = useFileSystemStore.getState().slots[newIndex];
        if (slot && slot.sample) {
          // Play the sound
          useAudioStore.getState().playSlot(newIndex, slot.sample.fileHandle);
          setSelectedFile(slot.sample);
        } else {
          setSelectedFile(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPadIndex, activePage, selectPad, setActivePage, setSelectedFile]);

  const pageConfig = PAGES.find((p) => p.index === activePage);
  if (!pageConfig) return null;

  const [start, end] = pageConfig.slotRange;
  const activePageSlots = slots.slice(start, end);

  return (
    <div className="w-full mx-auto flex-1">
      <div className="grid grid-cols-8 gap-3">
        {activePageSlots.map((slot) => (
          <SortablePad key={slot.index} slot={slot} />
        ))}
      </div>
    </div>
  );
}
