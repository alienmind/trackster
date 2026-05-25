import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PadSlot, RenamePlan, SampleFile, TagDefinition, PackSlot, PackFolder } from '../types';
import { parseFilename, buildFilename } from '../utils/fileNaming';
import { inferTag } from '../utils/autoTag';
import { computeArrangement } from '../utils/autoArrange';
import { computeRenamePlan } from '../utils/renamePlan';
import { TAG_DEFINITIONS } from '../utils/constants';
interface FileSystemState {
  rootHandle: FileSystemDirectoryHandle | null;
  packs: string[];
  packSlots: PackSlot[];
  activePack: string | null;
  activePackHandle: FileSystemDirectoryHandle | null;
  slots: PadSlot[];
  unassignedFiles: SampleFile[];
  tags: TagDefinition[];
  pendingChanges: number;
  history: PadSlot[][];
  
  openRootDirectory: () => Promise<void>;
  loadPack: (packName: string) => Promise<void>;
  copyToPack: (file: SampleFile, targetPackName: string) => Promise<void>;
  movePackSlot: (fromIndex: number, toIndex: number) => void;
  moveSlot: (fromIndex: number, toIndex: number) => void;
  clearSlot: (index: number) => void;
  assignToSlot: (file: SampleFile, slotIndex: number) => void;
  removeFile: (file: SampleFile) => void;
  renameFile: (file: SampleFile, newDisplayName: string) => void;
  assignTagToSlot: (tagId: string, slotIndex: number) => void;
  addTag: (label: string) => void;
  removeTag: (tagId: string) => void;
  autoTag: () => void;
  autoArrange: () => void;
  commitChanges: () => Promise<RenamePlan>;
  executeRenamePlan: (plan: RenamePlan) => Promise<void>;
  undo: () => void;
}

const getTracksHandle = async (root: FileSystemDirectoryHandle) => {
  if (root.name === 'Tracks') return root;
  return await root.getDirectoryHandle('Tracks');
};

const countPendingChanges = (slots: PadSlot[]) => {
  let count = 0;
  for (const s of slots) {
    if (s.sample) {
      const ext = s.sample.originalFilename.split('.').pop() || 'wav';
      const to = buildFilename(s.index, s.sample.displayName, ext);
      if (s.sample.originalFilename !== to) count++;
    }
  }
  return count;
};

export const useFileSystemStore = create<FileSystemState>()(
  (persist as unknown as (config: StateCreator<FileSystemState>, options: any) => StateCreator<FileSystemState>)(
    (set, get) => ({
      rootHandle: null,
      packs: [],
      packSlots: Array.from({ length: 64 }, (_, i) => ({ index: i, pack: null })),
      activePack: null,
      activePackHandle: null,
      slots: Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null })),
      unassignedFiles: [],
      tags: [...TAG_DEFINITIONS],
      pendingChanges: 0,
      history: [],

  openRootDirectory: async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      set({ rootHandle: dirHandle });

      try {
        const tracksHandle = await getTracksHandle(dirHandle);
        const packs: string[] = [];
        const newPackSlots: PackSlot[] = Array.from({ length: 64 }, (_, i) => ({ index: i, pack: null }));

        for await (const entry of tracksHandle.values()) {
          if (entry.kind === 'directory') {
            packs.push(entry.name);
            const parsed = parseFilename(entry.name);
            if (parsed && parsed.prefix >= 0 && parsed.prefix < 64) {
              const packFolder: PackFolder = {
                originalDirname: entry.name,
                displayName: parsed.name,
                originalSlotIndex: parsed.prefix,
                dirHandle: entry as FileSystemDirectoryHandle,
              };
              newPackSlots[parsed.prefix]!.pack = packFolder;
            }
          }
        }
        
        set({ 
          packs: packs.sort(),
          packSlots: newPackSlots 
        });
        
        if (packs.length > 0) {
          await get().loadPack(packs[0]!);
        }
      } catch (err) {
        console.error('Could not find Tracks folder or read packs', err);
        // Fallback: treat root as a single pack if no Tracks folder?
        // Or just alert the user.
        alert('Could not find a top-level "Tracks" folder on this drive.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening directory:', err);
      }
    }
  },
  
  loadPack: async (packName: string) => {
    const { rootHandle } = get();
    if (!rootHandle) return;

    let packHandle: FileSystemDirectoryHandle;
    try {
      const tracksHandle = await getTracksHandle(rootHandle);
      packHandle = await tracksHandle.getDirectoryHandle(packName);
    } catch (err) {
      console.error('Error loading pack', packName, err);
      return;
    }

    // Reset slots
    const newSlots: PadSlot[] = Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null }));
    const newUnassigned: SampleFile[] = [];

    // Helper to recursively find .wav files, up to 2 levels deep
    const findWavFiles = async (dirHandle: FileSystemDirectoryHandle, prefix = '') => {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.wav')) {
          const parsed = parseFilename(entry.name);
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          
          if (parsed && parsed.prefix >= 0 && parsed.prefix < 64) {
            const newSample: SampleFile = {
              originalFilename: entry.name,
              displayName: parsed.name,
              originalSlotIndex: parsed.prefix,
              fileHandle,
              parentDirHandle: dirHandle,
              tag: inferTag(parsed.name),
              size: file.size,
              sourcePath: prefix.replace(/\/$/, '') || 'Root',
            };

            if (newSlots[parsed.prefix]!.sample) {
              // Slot already occupied — send this duplicate to unassigned
              newUnassigned.push(newSample);
            } else {
              newSlots[parsed.prefix]!.sample = newSample;
            }
          } else {
            const displayName = parsed ? parsed.name : entry.name.replace(/\.wav$/i, '');
            newUnassigned.push({
              originalFilename: entry.name,
              displayName,
              originalSlotIndex: -1,
              fileHandle,
              parentDirHandle: dirHandle,
              tag: inferTag(displayName),
              size: file.size,
              sourcePath: prefix.replace(/\/$/, '') || 'Root',
            });
          }
        } else if (entry.kind === 'directory' && prefix === '') {
          // Look one level deep (e.g. into Samples/ folder if it exists)
          try {
            const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
            await findWavFiles(subDirHandle, entry.name + '/');
          } catch (e) {
            // ignore
          }
        }
      }
    };

    await findWavFiles(packHandle);
    
    set({ 
      activePack: packName,
      activePackHandle: packHandle,
      slots: newSlots, 
      unassignedFiles: newUnassigned, 
      pendingChanges: 0, 
      history: [] 
    });
  },
  
  copyToPack: async (file, targetPackName) => {
    const { rootHandle, activePack } = get();
    if (!rootHandle || !activePack || activePack === targetPackName) return;

    try {
      const tracksHandle = await getTracksHandle(rootHandle);
      const destPackHandle = await tracksHandle.getDirectoryHandle(targetPackName);
      
      const fileData = await file.fileHandle.getFile();
      
      // We want to drop it in the staging area of the target pack, 
      // so we use the clean display name without any slot prefix.
      // And we prepend the activePack name so the user knows where it came from!
      const targetFilename = `[${activePack}] ${file.displayName}.wav`;
      
      const newFileHandle = await destPackHandle.getFileHandle(targetFilename, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(fileData);
      await writable.close();
      
      // We do NOT remove the original file, making this a pure copy operation.
      // We also do not need to reload the current pack since the current pack hasn't changed.
    } catch (err) {
      console.error('Failed to copy to pack', err);
    }
  },
  
  movePackSlot: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    set((state) => {
      const newSlots = [...state.packSlots];
      const fromSlot = newSlots[fromIndex]!;
      const toSlot = newSlots[toIndex]!;
      
      const tempPack = fromSlot.pack;
      newSlots[fromIndex] = { ...fromSlot, pack: toSlot.pack };
      newSlots[toIndex] = { ...toSlot, pack: tempPack };
      
      return { packSlots: newSlots };
    });
  },

  moveSlot: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const fromSlot = newSlots[fromIndex]!;
      const toSlot = newSlots[toIndex]!;
      
      const tempSample = fromSlot.sample;
      newSlots[fromIndex] = { ...fromSlot, sample: toSlot.sample };
      newSlots[toIndex] = { ...toSlot, sample: tempSample };
      
      const pendingChanges = countPendingChanges(newSlots);

      return {
        slots: newSlots,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },

  clearSlot: (index) => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const slot = newSlots[index]!;
      
      if (!slot.sample) return state;

      const newUnassigned = [...state.unassignedFiles, slot.sample];
      newSlots[index] = { ...slot, sample: null };

      const pendingChanges = countPendingChanges(newSlots);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },

  renameFile: (file, newDisplayName) => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      let newSlots = [...state.slots];
      let newUnassigned = [...state.unassignedFiles];
      
      let found = false;
      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i]!.sample?.originalFilename === file.originalFilename) {
          newSlots[i] = {
            ...newSlots[i]!,
            sample: { ...newSlots[i]!.sample!, displayName: newDisplayName }
          };
          found = true;
          break;
        }
      }
      
      if (!found) {
        for (let i = 0; i < newUnassigned.length; i++) {
          if (newUnassigned[i]!.originalFilename === file.originalFilename) {
            newUnassigned[i] = { ...newUnassigned[i]!, displayName: newDisplayName };
            break;
          }
        }
      }

      const pendingChanges = countPendingChanges(newSlots);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },

  removeFile: (file) => {    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      let changed = false;

      // Remove from slots if present
      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i]!.sample?.originalFilename === file.originalFilename) {
          newSlots[i] = { ...newSlots[i]!, sample: null };
          changed = true;
          break;
        }
      }

      // Remove from unassigned if present
      const newUnassigned = state.unassignedFiles.filter(f => f.originalFilename !== file.originalFilename);
      if (newUnassigned.length !== state.unassignedFiles.length) {
        changed = true;
      }

      if (!changed) return state;

      const pendingChanges = countPendingChanges(newSlots);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },

  assignToSlot: (file, slotIndex) => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      
      const newUnassigned = state.unassignedFiles.filter(f => f.originalFilename !== file.originalFilename);
      
      // If the slot is occupied, put its sample back to unassigned
      if (newSlots[slotIndex]!.sample) {
        newUnassigned.push(newSlots[slotIndex]!.sample!);
      }
      
      newSlots[slotIndex] = { ...newSlots[slotIndex]!, sample: file };

      const pendingChanges = countPendingChanges(newSlots);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },
  
  assignTagToSlot: (tagId, slotIndex) => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const slot = newSlots[slotIndex];
      
      if (!slot?.sample) return state;

      newSlots[slotIndex] = {
        ...slot,
        sample: { ...slot.sample, tag: tagId }
      };

      return {
        slots: newSlots,
        history: [...state.history, snapshot]
      };
    });
  },

  addTag: (label: string) => {
    const upperLabel = label.toUpperCase();
    const id = upperLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    set((state) => {
      // Don't add if id already exists
      if (state.tags.some(t => t.id === id)) return state;
      const newTag: TagDefinition = {
        id,
        label: upperLabel,
        icon: 'Tag',
        patterns: [new RegExp(upperLabel, 'i')],
        color
      };
      return { tags: [...state.tags, newTag] };
    });
  },

  removeTag: (tagId: string) => {
    set((state) => {
      // Remove tag from tag list
      const newTags = state.tags.filter(t => t.id !== tagId);

      // Remove tag from slots
      const newSlots = state.slots.map(slot => {
        if (slot.sample && slot.sample.tag === tagId) {
          return { ...slot, sample: { ...slot.sample, tag: 'unknown' } };
        }
        return slot;
      });

      // Remove tag from unassignedFiles
      const newUnassignedFiles = state.unassignedFiles.map(file => {
        if (file.tag === tagId) {
          return { ...file, tag: 'unknown' };
        }
        return file;
      });

      return {
        tags: newTags,
        slots: newSlots,
        unassignedFiles: newUnassignedFiles
      };
    });
  },

  autoTag: () => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = state.slots.map(s => {
        if (!s.sample) return s;
        return {
          ...s,
          sample: {
            ...s.sample,
            tag: inferTag(s.sample.displayName)
          }
        };
      });
      return { slots: newSlots, history: [...state.history, snapshot] };
    });
  },
  
  autoArrange: () => {
    set((state) => {
      const snapshot = state.slots.map((s) => ({ ...s }));
      const result = computeArrangement(state.slots, state.unassignedFiles);
      
      const pendingChanges = countPendingChanges(result.slots);
      
      return {
        slots: result.slots,
        unassignedFiles: result.unassignedFiles,
        history: [...state.history, snapshot],
        pendingChanges
      };
    });
  },
  
  commitChanges: async () => {
    return computeRenamePlan(get().slots);
  },
  
  executeRenamePlan: async (plan) => {
    const { activePack, loadPack } = get();
    if (!activePack) return;

    // Pass 1: rename each file to a temp name (in its own directory)
    for (const op of plan.operations) {
      const dir = op.parentDirHandle;
      const tempName = `__tmp_${op.to}`;
      try {
        if ('move' in op.fileHandle) {
          await (op.fileHandle as any).move(dir, tempName);
        } else {
          const file = await op.fileHandle.getFile();
          const newFileHandle = await dir.getFileHandle(tempName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          await dir.removeEntry(op.from);
        }
      } catch (err) {
        console.error('Rename pass 1 failed', err);
      }
    }

    // Pass 2: rename temp files to final names (in their own directories)
    for (const op of plan.operations) {
      const dir = op.parentDirHandle;
      const tempName = `__tmp_${op.to}`;
      try {
        const tempHandle = await dir.getFileHandle(tempName);
        if ('move' in tempHandle) {
          await (tempHandle as any).move(dir, op.to);
        } else {
          const file = await tempHandle.getFile();
          const newFileHandle = await dir.getFileHandle(op.to, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          await dir.removeEntry(tempName);
        }
      } catch (err) {
        console.error('Rename pass 2 failed', err);
      }
    }

    await loadPack(activePack);
  },
  
  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prevSlots = state.history[state.history.length - 1]!;
      const newHistory = state.history.slice(0, -1);
      
      const pendingChanges = countPendingChanges(prevSlots);
      
      return {
        slots: prevSlots,
        history: newHistory,
        pendingChanges
      };
    });
  }
    }),
    {
      name: 'trackster-storage',
      partialize: (state: any) => ({ tags: state.tags }),
    }
  )
);
