import type { PadSlot, PackSlot, RenamePlan, RenameOperation } from '../types';
import { buildFilename } from './fileNaming';

/**
 * Compare current slot assignments to on-disk filenames across all packs and pack folders.
 * Returns a RenamePlan containing only the files and folders that need renaming.
 */
export async function computeRenamePlan(slotsByPack: Record<string, PadSlot[]>, packSlots: PackSlot[], tracksHandle: FileSystemDirectoryHandle, applyTagsToFilenames: boolean): Promise<RenamePlan> {
  const operations: RenameOperation[] = [];

  for (const packName in slotsByPack) {
    const slots = slotsByPack[packName];
    if (!slots) continue;
    for (const slot of slots) {
      if (slot.sample && typeof slot.index === 'number') {
        const from = slot.sample.originalFilename;
        const extension = from.split('.').pop() || 'wav';
        const shouldApplyTag = applyTagsToFilenames || slot.sample.hasOriginalTagPrefix || slot.index !== slot.sample.originalSlotIndex;
        const to = buildFilename(slot.index, slot.sample.displayName, shouldApplyTag ? slot.sample.tag : undefined, extension);
        
        if (from !== to) {
          operations.push({
            type: 'file',
            from,
            to,
            handle: slot.sample.fileHandle,
            parentDirHandle: slot.sample.parentDirHandle,
          });
        }
      }
    }
  }

  // Handle pack renaming
  for (const slot of packSlots) {
    if (slot.pack) {
      const to = `${slot.index.toString().padStart(2, '0')}_${slot.pack.displayName}`;
      if (slot.pack.originalDirname !== to) {
        operations.push({
          type: 'pack',
          from: slot.pack.originalDirname,
          to,
          handle: slot.pack.dirHandle,
          parentDirHandle: tracksHandle,
        });
      }
    }
  }

  return { operations, createdAt: new Date() };
}
