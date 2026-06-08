import type { PadSlot, PackSlot, RenamePlan, RenameOperation, SampleFile } from '../types';
import { buildFilename } from './fileNaming';

/**
 * Compare current slot assignments to on-disk filenames across all packs and pack folders.
 * Returns a RenamePlan containing only the files and folders that need renaming.
 */
export async function computeRenamePlan(slotsByPack: Record<string, PadSlot[]>, packSlots: PackSlot[], originalPacks: string[], tracksHandle: FileSystemDirectoryHandle, applyTagsToFilenames: boolean, pendingDeletionsByPack: Record<string, SampleFile[]> = {}): Promise<RenamePlan> {
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
            action: 'move',
            from,
            to,
            handle: slot.sample.fileHandle,
            parentDirHandle: slot.sample.parentDirHandle,
          });
        }
      }
    }
  }

  // Map original dirnames to their occurrences in the current grid
  const packOccurrences = new Map<string, Array<{ to: string, handle: FileSystemDirectoryHandle }>>();
  
  for (const slot of packSlots) {
    if (slot.pack) {
      const to = `${slot.index.toString().padStart(2, '0')}_${slot.pack.displayName}`;
      const original = slot.pack.originalDirname;
      if (!packOccurrences.has(original)) {
        packOccurrences.set(original, []);
      }
      packOccurrences.get(original)!.push({ to, handle: slot.pack.dirHandle });
    }
  }

  // Handle pack renaming, copying, and deletion
  for (const original of originalPacks) {
    const occurrences = packOccurrences.get(original);
    
    if (!occurrences || occurrences.length === 0) {
      // Pack was completely removed from the grid
      try {
        const handle = await tracksHandle.getDirectoryHandle(original);
        operations.push({
          type: 'pack',
          action: 'delete',
          from: original,
          to: original,
          handle,
          parentDirHandle: tracksHandle,
        });
      } catch (err) {
        // Ignore if already deleted or inaccessible
      }
    } else {
      // Pack exists one or more times
      for (let i = 0; i < occurrences.length; i++) {
        const occ = occurrences[i]!;
        if (i === 0) {
          // The first occurrence is treated as the original (move or keep)
          if (original !== occ.to) {
            operations.push({
              type: 'pack',
              action: 'move',
              from: original,
              to: occ.to,
              handle: occ.handle,
              parentDirHandle: tracksHandle,
            });
          }
        } else {
          // Subsequent occurrences are copies
          operations.push({
            type: 'pack',
            action: 'copy',
            from: original,
            to: occ.to,
            handle: occ.handle,
            parentDirHandle: tracksHandle,
          });
        }
      }
    }
  }

  // Pending sample deletions (X on pad, clear staging area, duplicate resolution)
  for (const packName in pendingDeletionsByPack) {
    const files = pendingDeletionsByPack[packName];
    if (!files) continue;
    for (const file of files) {
      operations.push({
        type: 'file',
        action: 'delete',
        from: file.originalFilename,
        to: file.originalFilename,
        handle: file.fileHandle,
        parentDirHandle: file.parentDirHandle,
      });
    }
  }

  return { operations, createdAt: new Date() };
}
