import type { PadSlot, RenamePlan, RenameOperation } from '../types';
import { buildFilename } from './fileNaming';

/**
 * Compare current slot assignments to on-disk filenames.
 * Returns a RenamePlan containing only the files that need renaming.
 */
export function computeRenamePlan(slots: PadSlot[]): RenamePlan {
  const operations: RenameOperation[] = [];

  for (const slot of slots) {
    if (slot.sample && slot.sample.originalSlotIndex !== slot.index) {
      const from = slot.sample.originalFilename;
      const extension = from.split('.').pop() || 'wav';
      const to = buildFilename(slot.index, slot.sample.displayName, extension);
      
      operations.push({
        from,
        to,
        fileHandle: slot.sample.fileHandle,
      });
    }
  }

  return { operations, createdAt: new Date() };
}
