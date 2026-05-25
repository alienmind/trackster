import { create } from 'zustand';
import type { PadSlot, RenamePlan, PageIndex } from '../types';
import { parseFilename } from '../utils/fileNaming';
import { inferTag } from '../utils/autoTag';

interface FileSystemState {
  directoryHandle: FileSystemDirectoryHandle | null;
  slots: PadSlot[];
  pendingChanges: number;
  history: PadSlot[][];
  
  openDirectory: () => Promise<void>;
  loadFiles: () => Promise<void>;
  moveSlot: (fromIndex: number, toIndex: number) => void;
  autoTag: () => void;
  autoArrange: () => void;
  commitChanges: () => Promise<RenamePlan>;
  executeRenamePlan: (plan: RenamePlan) => Promise<void>;
  undo: () => void;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  directoryHandle: null,
  slots: Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null })),
  pendingChanges: 0,
  history: [],

  openDirectory: async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      set({ directoryHandle: dirHandle });
      await get().loadFiles();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening directory:', err);
      }
    }
  },
  
  loadFiles: async () => {
    const { directoryHandle } = get();
    if (!directoryHandle) return;

    // Reset slots
    const newSlots = Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null as any }));

    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.wav')) {
        const parsed = parseFilename(entry.name);
        if (parsed && parsed.prefix >= 0 && parsed.prefix < 64) {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const displayName = parsed.name;
          
          newSlots[parsed.prefix].sample = {
            originalFilename: entry.name,
            displayName,
            originalSlotIndex: parsed.prefix,
            fileHandle,
            tag: inferTag(displayName), // Infer tag initially
            size: file.size,
          };
        }
      }
    }
    
    set({ slots: newSlots, pendingChanges: 0, history: [] });
  },
  
  autoTag: () => {
    // TODO: implement
  },
  
  autoArrange: () => {
    // TODO: implement
  },
  
  commitChanges: async () => {
    // TODO: implement
    return { operations: [], createdAt: new Date() };
  },
  
  executeRenamePlan: async (plan) => {
    // TODO: implement
  },
  
  undo: () => {
    // TODO: implement
  }
}));
