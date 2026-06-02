import { logger } from "../utils/logger";
import { create, StateCreator } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { PadSlot, RenamePlan, SampleFile, TagDefinition, PackSlot, PackFolder } from '../types';
import { parseFilename, buildFilename } from '../utils/fileNaming';
import { inferTag } from '../utils/autoTag';
import { computeArrangement } from '../utils/autoArrange';
import { computeRenamePlan } from '../utils/renamePlan';
import { TAG_DEFINITIONS } from '../utils/constants';
import { computeSimilarity } from '../utils/similarity';

export interface CircuitTracksState {
  // Audio State
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  currentlyPlayingSlot: number | null;
  decodedBuffers: Map<number, AudioBuffer>;
  currentSource: AudioBufferSourceNode | null;
  analysisProgress: { current: number; total: number } | null;
  duplicatePairs: [number, number][];

  initAudioContext: () => void;
  playSlot: (slotIndex: number, fileHandle: FileSystemFileHandle) => Promise<void>;
  stopPlayback: () => void;
  togglePlayback: (slotIndex: number, fileHandle: FileSystemFileHandle) => Promise<void>;
  scanDuplicates: () => Promise<void>;
  clearDuplicates: () => void;

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
  
  slotsByPack: Record<string, PadSlot[]>;
  unassignedFilesByPack: Record<string, SampleFile[]>;
  historyByPack: Record<string, PadSlot[][]>;
  
  applyTagsToFilenames: boolean;
  setApplyTagsToFilenames: (apply: boolean) => void;
  
  workspaceMode: 'read' | 'readwrite' | null;
  setWorkspaceMode: (mode: 'read' | 'readwrite') => Promise<boolean>;
  
  openRootDirectory: (mode?: 'read' | 'readwrite') => Promise<void>;
  rescanRootDirectory: () => Promise<void>;
  loadPack: (packName: string) => Promise<void>;
  copyToPack: (file: SampleFile, targetPackName: string) => Promise<void>;
  movePackSlot: (fromIndex: number, toIndex: number) => void;
  moveToPack: (file: SampleFile, targetPackName: string) => void;
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
  if (root.name.toLowerCase() === 'tracks') return root;
  try {
    return await root.getDirectoryHandle('Tracks');
  } catch (e) {
    try {
      return await root.getDirectoryHandle('tracks');
    } catch (e2) {
      for await (const entry of root.values()) {
        if (entry.kind === 'directory' && entry.name.toLowerCase() === 'tracks') {
          return await root.getDirectoryHandle(entry.name);
        }
      }
      throw e;
    }
  }
};

const countPendingChanges = (slots: PadSlot[], packSlots: PackSlot[], applyTagsToFilenames: boolean) => {
  let count = 0;
  for (const s of slots) {
    if (s.sample) {
      const ext = s.sample.originalFilename.split('.').pop() || 'wav';
      const shouldApplyTag = applyTagsToFilenames || s.sample.hasOriginalTagPrefix || s.index !== s.sample.originalSlotIndex;
      const to = buildFilename(s.index, s.sample.displayName, shouldApplyTag ? s.sample.tag : undefined, ext);
      if (s.sample.originalFilename !== to) count++;
    }
  }
  for (const s of packSlots) {
    if (s.pack) {
      const to = `${s.index.toString().padStart(2, '0')}_${s.pack.displayName}`;
      if (s.pack.originalDirname !== to) count++;
    }
  }
  return count;
};

const countAllPendingChanges = (slotsByPack: Record<string, PadSlot[]>, packSlots: PackSlot[], applyTagsToFilenames: boolean) => {
  let count = 0;
  for (const packName in slotsByPack) {
    const slots = slotsByPack[packName];
    if (slots) count += countPendingChanges(slots, [], applyTagsToFilenames);
  }
  count += countPendingChanges([], packSlots, applyTagsToFilenames);
  return count;
};

const idbStorage: PersistStorage<any> = {
  getItem: async (name: string) => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: any) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export const useCircuitTracksStore = create<CircuitTracksState>()(
  (persist as unknown as (config: StateCreator<CircuitTracksState>, options: any) => StateCreator<CircuitTracksState>)(
    (set, get) => ({
      // Audio Store properties
      audioContext: null,
      analyser: null,
      currentlyPlayingSlot: null,
      decodedBuffers: new Map(),
      currentSource: null,
      analysisProgress: null,
      duplicatePairs: [],

      initAudioContext: () => {
        if (!get().audioContext) {
          const ctx = new AudioContext();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          set({ audioContext: ctx, analyser });
        }
      },

      playSlot: async (slotIndex, fileHandle) => {
        const state = get();
        if (!state.audioContext) {
          state.initAudioContext();
        }
        const ctx = get().audioContext!;
        
        get().stopPlayback();

        let buffer = slotIndex >= 0 ? state.decodedBuffers.get(slotIndex) : undefined;
        if (!buffer) {
          try {
            const file = await fileHandle.getFile();
            const arrayBuffer = await file.arrayBuffer();
            buffer = await ctx.decodeAudioData(arrayBuffer);
            if (slotIndex >= 0) {
              state.decodedBuffers.set(slotIndex, buffer);
            }
          } catch (err: any) {
            import('./useUIStore').then(({ useUIStore }) => {
              useUIStore.getState().addNotification({ 
                message: err.name === 'NotFoundError' 
                  ? 'File not found. The SD card may have been modified or re-mounted. Please click "Open Tracks" to reconnect.' 
                  : 'Could not access file. Please check permissions.', 
                type: 'error' 
              });
            });
            return;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        if (state.analyser) {
          source.connect(state.analyser);
          state.analyser.connect(ctx.destination);
        } else {
          source.connect(ctx.destination);
        }
        source.onended = () => {
          if (get().currentlyPlayingSlot === slotIndex) {
            set({ currentlyPlayingSlot: null, currentSource: null });
          }
        };
        source.start();
        set({ currentlyPlayingSlot: slotIndex, currentSource: source });
      },

      stopPlayback: () => {
        const { currentSource } = get();
        if (currentSource) {
          currentSource.stop();
          currentSource.disconnect();
        }
        set({ currentlyPlayingSlot: null, currentSource: null });
      },

      togglePlayback: async (slotIndex, fileHandle) => {
        if (get().currentlyPlayingSlot === slotIndex) {
          get().stopPlayback();
        } else {
          await get().playSlot(slotIndex, fileHandle);
        }
      },

      scanDuplicates: async () => {
        const { slots, unassignedFiles } = get();
        const allSamples: any[] = [];
        
        slots.forEach(s => { if (s.sample) allSamples.push(s.sample); });
        unassignedFiles.forEach(s => allSamples.push(s));
        
        if (allSamples.length < 2) return;

        set({ analysisProgress: { current: 0, total: allSamples.length } });

        const worker = new Worker(new URL('../workers/audioAnalyzer.worker.ts', import.meta.url), { type: 'module' });
        
        const fingerprints = new Map<string, number[]>();
        let completed = 0;

        return new Promise<void>((resolve) => {
          worker.onmessage = (e) => {
            const { originalFilename, fingerprint, error } = e.data;
            if (!error && fingerprint) {
              fingerprints.set(originalFilename, fingerprint);
            }
            
            completed++;
            set({ analysisProgress: { current: completed, total: allSamples.length } });
            
            if (completed === allSamples.length) {
              worker.terminate();
              set({ analysisProgress: null });
              
              const clusters: any[][] = [];
              const processed = new Set<string>();

              for (let i = 0; i < allSamples.length; i++) {
                const sampleA = allSamples[i]!;
                if (processed.has(sampleA.originalFilename)) continue;
                
                const fpA = fingerprints.get(sampleA.originalFilename);
                if (!fpA) continue;

                const cluster: any[] = [sampleA];
                processed.add(sampleA.originalFilename);

                for (let j = i + 1; j < allSamples.length; j++) {
                  const sampleB = allSamples[j]!;
                  if (processed.has(sampleB.originalFilename)) continue;
                  
                  const fpB = fingerprints.get(sampleB.originalFilename);
                  if (!fpB) continue;

                  const sim = computeSimilarity(fpA, fpB);
                  if (sim > 0.92) {
                    cluster.push(sampleB);
                    processed.add(sampleB.originalFilename);
                  }
                }
                
                if (cluster.length > 1) {
                  clusters.push(cluster);
                }
              }
              
              import('./useUIStore').then(({ useUIStore }) => {
                 useUIStore.getState().openDuplicateModal(clusters);
              });
              resolve();
            }
          };

          allSamples.forEach(async (sample) => {
            try {
              const file = await sample.fileHandle.getFile();
              const buffer = await file.arrayBuffer();
              worker.postMessage({ originalFilename: sample.originalFilename, buffer }, [buffer]);
            } catch (err) {
              worker.postMessage({ originalFilename: sample.originalFilename, error: 'File read error' });
            }
          });
        });
      },

      clearDuplicates: () => {
        set({ duplicatePairs: [] });
      },

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
      slotsByPack: {},
      unassignedFilesByPack: {},
      historyByPack: {},
      
      applyTagsToFilenames: false,
      setApplyTagsToFilenames: (apply) => set((state) => ({ 
        applyTagsToFilenames: apply,
        pendingChanges: countAllPendingChanges(state.slotsByPack, state.packSlots, apply)
      })),
      
      workspaceMode: null,
      setWorkspaceMode: async (mode) => {
        const { rootHandle } = get();
        if (!rootHandle) return false;
        try {
          if (mode === 'readwrite') {
            const status = await rootHandle.requestPermission({ mode: 'readwrite' });
            if (status === 'granted') {
              logger.info(`[Store] Workspace mode changed to readwrite`);
              set({ workspaceMode: 'readwrite' });
              return true;
            } else {
              logger.warn(`[Store] User denied readwrite permission`);
              return false;
            }
          } else {
            logger.info(`[Store] Workspace mode changed to read`);
            set({ workspaceMode: 'read' });
            return true;
          }
        } catch (e) {
          logger.error(`[Store] Error setting workspace mode:`, e);
          return false;
        }
      },
      
      openRootDirectory: async (mode = 'read') => {
    try {
      logger.log(`[Store] Opening root directory with mode: ${mode}`);
      const dirHandle = await window.showDirectoryPicker({ mode });
      set({ rootHandle: dirHandle, workspaceMode: mode });
      await get().rescanRootDirectory();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        logger.error('Error opening directory:', err);
      }
    }
  },

  rescanRootDirectory: async () => {
    const { rootHandle } = get();
    if (!rootHandle) return;

    try {
      const tracksHandle = await getTracksHandle(rootHandle);
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
      
      set((state) => ({ 
        packs: packs.sort(),
        packSlots: newPackSlots,
        pendingChanges: countAllPendingChanges(state.slotsByPack, newPackSlots, state.applyTagsToFilenames)
      }));
      
      const { activePack } = get();
      if (!activePack && packs.length > 0) {
        await get().loadPack(packs[0]!);
      } else if (activePack) {
        if (packs.includes(activePack)) {
          await get().loadPack(activePack);
        } else {
        }
      }
    } catch (err) {
      logger.error('Could not find Tracks folder or read packs', err);
      import('./useUIStore').then(({ useUIStore }) => {
        useUIStore.getState().addNotification({ message: 'Could not find a top-level "Tracks" folder on this drive.', type: 'error' });
      });
    }
  },
  
  loadPack: async (packName: string) => {
    logger.log(`[Store] Loading pack: ${packName}`);
    const { rootHandle } = get();
    if (!rootHandle) return;

    let packHandle: FileSystemDirectoryHandle;
    try {
      const tracksHandle = await getTracksHandle(rootHandle);
      packHandle = await tracksHandle.getDirectoryHandle(packName);
    } catch (err: any) {
      logger.error('Error loading pack', packName, err);
      import('./useUIStore').then(({ useUIStore }) => {
        useUIStore.getState().addNotification({ 
          message: err.name === 'NotFoundError' ? 'Pack not found or access lost. Please click "Mount SD Card" to restore access.' : 'Could not access pack. Please check permissions.', 
          type: 'error' 
        });
      });
      return;
    }

    const existingSlots = get().slotsByPack[packName];
    const existingUnassigned = get().unassignedFilesByPack[packName];

    const newSlots: PadSlot[] = Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null }));
    const newUnassigned: SampleFile[] = [];

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
              hasOriginalTagPrefix: parsed.hasOriginalTagPrefix,
              size: file.size,
              sourcePath: prefix.replace(/\/$/, '') || 'Root',
            };

            if (newSlots[parsed.prefix]!.sample) {
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
              hasOriginalTagPrefix: parsed ? parsed.hasOriginalTagPrefix : false,
              size: file.size,
              sourcePath: prefix.replace(/\/$/, '') || 'Root',
            });
          }
        } else if (entry.kind === 'directory' && prefix === '') {
          try {
            const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
            await findWavFiles(subDirHandle, entry.name + '/');
          } catch (e) {
          }
        }
      }
    };

    await findWavFiles(packHandle);
    
    // Reconcile handles if we had existing layout
    let finalSlots = newSlots;
    let finalUnassigned = newUnassigned;

    if (existingSlots && existingUnassigned) {
      const allScanned = new Map<string, SampleFile>();
      newSlots.forEach(s => { if (s.sample) allScanned.set(s.sample.originalFilename, s.sample); });
      newUnassigned.forEach(s => allScanned.set(s.originalFilename, s));

      finalSlots = existingSlots.map(slot => {
        if (!slot.sample) return slot;
        const fresh = allScanned.get(slot.sample.originalFilename);
        if (fresh) {
          allScanned.delete(slot.sample.originalFilename);
          return { ...slot, sample: { ...slot.sample, fileHandle: fresh.fileHandle, parentDirHandle: fresh.parentDirHandle, size: fresh.size } };
        }
        return { ...slot, sample: null }; // File deleted externally
      });

      finalUnassigned = existingUnassigned.map(sample => {
        const fresh = allScanned.get(sample.originalFilename);
        if (fresh) {
          allScanned.delete(sample.originalFilename);
          return { ...sample, fileHandle: fresh.fileHandle, parentDirHandle: fresh.parentDirHandle, size: fresh.size };
        }
        return null;
      }).filter(Boolean) as SampleFile[];

      finalUnassigned.push(...Array.from(allScanned.values()));
    }

    set((state) => {
      const newSlotsByPack = { ...state.slotsByPack, [packName]: finalSlots };
      return { 
        activePack: packName,
        activePackHandle: packHandle,
        slots: finalSlots, 
        unassignedFiles: finalUnassigned, 
        pendingChanges: countAllPendingChanges(newSlotsByPack, get().packSlots, get().applyTagsToFilenames), 
        history: state.historyByPack[packName] || [],
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: { ...state.unassignedFilesByPack, [packName]: finalUnassigned },
        historyByPack: { ...state.historyByPack, [packName]: state.historyByPack[packName] || [] }
      };
    });
  },
  
  moveToPack: (file, targetPackName) => {
    logger.log(`[Store] Moving file ${file.displayName} to pack ${targetPackName}`);
    set((state) => {
      const { activePack } = state;
      if (!activePack || activePack === targetPackName) return state;

      const newSlots = [...state.slots];
      let changed = false;

      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i]!.sample?.originalFilename === file.originalFilename) {
          newSlots[i] = { ...newSlots[i]!, sample: null };
          changed = true;
          break;
        }
      }

      const newUnassigned = state.unassignedFiles.filter(f => f.originalFilename !== file.originalFilename);
      if (newUnassigned.length !== state.unassignedFiles.length) {
        changed = true;
      }

      if (!changed) return state;

      const newSlotsByPack = { ...state.slotsByPack, [activePack]: newSlots };
      
      const targetUnassigned = [...(state.unassignedFilesByPack[targetPackName] || [])];
      targetUnassigned.push(file);

      const newUnassignedByPack = { 
        ...state.unassignedFilesByPack, 
        [activePack]: newUnassigned,
        [targetPackName]: targetUnassigned
      };

      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        pendingChanges
      };
    });
  },

  copyToPack: async (file, targetPackName) => {
    logger.log(`[Store] Copying file ${file.displayName} to pack ${targetPackName}`);
    const { rootHandle, activePack } = get();
    if (!rootHandle || !activePack || activePack === targetPackName) return;

    try {
      const tracksHandle = await getTracksHandle(rootHandle);
      const destPackHandle = await tracksHandle.getDirectoryHandle(targetPackName);
      
      const fileData = await file.fileHandle.getFile();
      
      const targetFilename = `[${activePack}] ${file.displayName}.wav`;
      
      const newFileHandle = await destPackHandle.getFileHandle(targetFilename, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(fileData);
      await writable.close();

      // Clear cache for the target pack so it will rescan when loaded
      set((state) => {
        const newSlotsByPack = { ...state.slotsByPack };
        const newUnassignedByPack = { ...state.unassignedFilesByPack };
        const newHistoryByPack = { ...state.historyByPack };
        
        delete newSlotsByPack[targetPackName];
        delete newUnassignedByPack[targetPackName];
        delete newHistoryByPack[targetPackName];
        
        return {
          slotsByPack: newSlotsByPack,
          unassignedFilesByPack: newUnassignedByPack,
          historyByPack: newHistoryByPack
        };
      });
      
    } catch (err) {
      logger.error('Failed to copy to pack', err);
    }
  },
  
  movePackSlot: (fromIndex, toIndex) => {
    logger.log(`[Store] Moving pack slot from ${fromIndex} to ${toIndex}`);
    if (fromIndex === toIndex) return;

    set((state) => {
      const newSlots = [...state.packSlots];
      const fromSlot = newSlots[fromIndex]!;
      const toSlot = newSlots[toIndex]!;
      
      const tempPack = fromSlot.pack;
      newSlots[fromIndex] = { ...fromSlot, pack: toSlot.pack };
      newSlots[toIndex] = { ...toSlot, pack: tempPack };
      
      const pendingChanges = countAllPendingChanges(state.slotsByPack, newSlots, state.applyTagsToFilenames);
      return { packSlots: newSlots, pendingChanges };
    });
  },

  moveSlot: (fromIndex, toIndex) => {
    logger.log(`[Store] Moving slot from ${fromIndex} to ${toIndex}`);
    if (fromIndex === toIndex) return;

    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const fromSlot = newSlots[fromIndex]!;
      const toSlot = newSlots[toIndex]!;
      
      const tempSample = fromSlot.sample;
      newSlots[fromIndex] = { ...fromSlot, sample: toSlot.sample };
      newSlots[toIndex] = { ...toSlot, sample: tempSample };
      
      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  clearSlot: (index) => {
    logger.log(`[Store] Clearing slot ${index}`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const slot = newSlots[index]!;
      
      if (!slot.sample) return state;

      const newUnassigned = [...state.unassignedFiles, slot.sample];
      newSlots[index] = { ...slot, sample: null };

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  renameFile: (file, newDisplayName) => {
    logger.log(`[Store] Renaming file ${file.displayName} to ${newDisplayName}`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const newUnassigned = [...state.unassignedFiles];
      
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

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  removeFile: (file) => {
    logger.log(`[Store] Removing file ${file.displayName}`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      let changed = false;

      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i]!.sample?.originalFilename === file.originalFilename) {
          newSlots[i] = { ...newSlots[i]!, sample: null };
          changed = true;
          break;
        }
      }

      const newUnassigned = state.unassignedFiles.filter(f => f.originalFilename !== file.originalFilename);
      if (newUnassigned.length !== state.unassignedFiles.length) {
        changed = true;
      }

      if (!changed) return state;

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  assignToSlot: (file, slotIndex) => {
    logger.log(`[Store] Assigning file ${file.displayName} to slot ${slotIndex}`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      
      const newUnassigned = state.unassignedFiles.filter(f => f.originalFilename !== file.originalFilename);
      
      if (newSlots[slotIndex]!.sample) {
        newUnassigned.push(newSlots[slotIndex]!.sample!);
      }
      
      newSlots[slotIndex] = { ...newSlots[slotIndex]!, sample: file };

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return {
        slots: newSlots,
        unassignedFiles: newUnassigned,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },
  
  assignTagToSlot: (tagId, slotIndex) => {
    logger.log(`[Store] Assigning tag ${tagId} to slot ${slotIndex}`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const slot = newSlots[slotIndex];
      
      if (!slot?.sample) return state;

      newSlots[slotIndex] = {
        ...slot,
        sample: { ...slot.sample, tag: tagId }
      };

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newHistory = [...state.history, snapshot];

      return {
        slots: newSlots,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
      };
    });
  },

  addTag: (label: string) => {
    logger.log(`[Store] Adding tag ${label}`);
    const upperLabel = label.toUpperCase();
    const id = upperLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    set((state) => {
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
    logger.log(`[Store] Removing tag ${tagId}`);
    set((state) => {
      if (!state.activePack) return state;
      const newTags = state.tags.filter(t => t.id !== tagId);

      const newSlots = state.slots.map(slot => {
        if (slot.sample && slot.sample.tag === tagId) {
          return { ...slot, sample: { ...slot.sample, tag: 'unknown' } };
        }
        return slot;
      });

      const newUnassignedFiles = state.unassignedFiles.map(file => {
        if (file.tag === tagId) {
          return { ...file, tag: 'unknown' };
        }
        return file;
      });

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassignedFiles };

      return {
        tags: newTags,
        slots: newSlots,
        unassignedFiles: newUnassignedFiles,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack
      };
    });
  },

  autoTag: () => {
    logger.log(`[Store] Auto-tagging files`);
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      
      const newSlots = state.slots.map(s => {
        if (!s.sample) return s;
        if (s.sample.tag !== 'unknown') return s;
        return { ...s, sample: { ...s.sample, tag: inferTag(s.sample.displayName) } };
      });
      
      const newUnassignedFiles = state.unassignedFiles.map(f => {
        if (f.tag !== 'unknown') return f;
        return { ...f, tag: inferTag(f.displayName) };
      });

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassignedFiles };
      const newHistory = [...state.history, snapshot];

      return { 
        slots: newSlots, 
        unassignedFiles: newUnassignedFiles, 
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory }
      };
    });
  },
  
  autoArrange: () => {
    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const result = computeArrangement(state.slots, state.unassignedFiles);
      
      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: result.slots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: result.unassignedFiles };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return { 
        slots: result.slots, 
        unassignedFiles: result.unassignedFiles, 
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },
  
  commitChanges: async () => {
    logger.log(`[Store] Committing changes... computing plan...`);
    const { rootHandle, slotsByPack, packSlots, applyTagsToFilenames } = get();
    if (!rootHandle) return { operations: [], createdAt: new Date() };

    return computeRenamePlan(slotsByPack, packSlots, rootHandle, applyTagsToFilenames);
  },
  
  executeRenamePlan: async (plan) => {
    const { activePack } = get();
    if (!activePack) return;

    logger.log(`[executeRenamePlan] Starting with ${plan.operations.length} operations, activePack=${activePack}`);

    // Build a map from originalFilename → packName BEFORE renaming anything.
    // We can't use parentDirHandle.name because files may live in subdirectories (e.g. "PCM")
    // while the slotsByPack key is the pack name (e.g. "16_AcidTechno").
    const fileToPackMap = new Map<string, string>();
    const currentSlotsByPack = get().slotsByPack;
    for (const packName in currentSlotsByPack) {
      const slots = currentSlotsByPack[packName];
      if (slots) {
        for (const slot of slots) {
          if (slot.sample) {
            fileToPackMap.set(slot.sample.originalFilename, packName);
          }
        }
      }
    }

    // Pass 1: rename each file/folder to a temp name (copy+delete, never use .move() which can hang on USB)
    for (let opIdx = 0; opIdx < plan.operations.length; opIdx++) {
      const op = plan.operations[opIdx]!;
      const dir = op.parentDirHandle;
      const tempName = `__tmp_${op.to}`;
      logger.log(`[executeRenamePlan] Pass1 op${opIdx}: ${op.type} "${op.from}" -> temp "${tempName}"`);
      try {
        if (op.type === 'file') {
          const file = await (op.handle as FileSystemFileHandle).getFile();
          const newFileHandle = await dir.getFileHandle(tempName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          await dir.removeEntry(op.from);
        } else if (op.type === 'pack') {
          const newDirHandle = await dir.getDirectoryHandle(tempName, { create: true });
          const oldDirHandle = op.handle as FileSystemDirectoryHandle;
          for await (const entry of oldDirHandle.values()) {
            if (entry.kind === 'file') {
              const file = await (entry as FileSystemFileHandle).getFile();
              const newFile = await newDirHandle.getFileHandle(entry.name, { create: true });
              const writable = await newFile.createWritable();
              await writable.write(file);
              await writable.close();
            }
          }
          await dir.removeEntry(op.from, { recursive: true });
        }
        logger.log(`[executeRenamePlan] Pass1 op${opIdx}: done`);
      } catch (err) {
        logger.error(`[executeRenamePlan] Pass1 op${opIdx} FAILED:`, err);
      }
    }

    // Pass 2: rename temp files/folders to final names (copy+delete again)
    const fileUpdates: Array<{
      packName: string; 
      from: string; 
      to: string; 
      handle: FileSystemFileHandle; 
      newPrefix: number;
      newName: string;
      newHasTag: boolean;
    }> = [];

    for (let opIdx = 0; opIdx < plan.operations.length; opIdx++) {
      const op = plan.operations[opIdx]!;
      const dir = op.parentDirHandle;
      const tempName = `__tmp_${op.to}`;
      logger.log(`[executeRenamePlan] Pass2 op${opIdx}: temp "${tempName}" -> "${op.to}"`);
      try {
        if (op.type === 'file') {
          const tempHandle = await dir.getFileHandle(tempName);
          const file = await tempHandle.getFile();
          const newFileHandle = await dir.getFileHandle(op.to, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          await dir.removeEntry(tempName);
          
          const finalHandle = await dir.getFileHandle(op.to);
          const parsed = parseFilename(op.to);
          const resolvedPackName = fileToPackMap.get(op.from) || dir.name;
          logger.log(`[executeRenamePlan] Pass2 op${opIdx}: resolved pack="${resolvedPackName}" (dir.name="${dir.name}")`);
          fileUpdates.push({
            packName: resolvedPackName,
            from: op.from,
            to: op.to,
            handle: finalHandle,
            newPrefix: parsed ? parsed.prefix : -1,
            newName: parsed ? parsed.name : '',
            newHasTag: parsed ? parsed.hasOriginalTagPrefix : false
          });
        } else if (op.type === 'pack') {
          const oldDirHandle = await dir.getDirectoryHandle(tempName);
          const newDirHandle = await dir.getDirectoryHandle(op.to, { create: true });
          for await (const entry of oldDirHandle.values()) {
            if (entry.kind === 'file') {
              const file = await (entry as FileSystemFileHandle).getFile();
              const newFile = await newDirHandle.getFileHandle(entry.name, { create: true });
              const writable = await newFile.createWritable();
              await writable.write(file);
              await writable.close();
            }
          }
          await dir.removeEntry(tempName, { recursive: true });
        }
        logger.log(`[executeRenamePlan] Pass2 op${opIdx}: done`);
      } catch (err) {
        logger.error(`[executeRenamePlan] Pass2 op${opIdx} FAILED:`, err);
      }
    }

    logger.log(`[executeRenamePlan] File updates collected:`, fileUpdates.map(u => `"${u.from}" -> "${u.to}" (pack: ${u.packName})`));

    // Determine if any packs were renamed
    let newActivePack = activePack;
    const renamedPacks: Record<string, string> = {};

    for (const op of plan.operations) {
      if (op.type === 'pack') {
        renamedPacks[op.from] = op.to;
        if (op.from === activePack) {
          newActivePack = op.to;
        }
      }
    }

    // Update state directly - manual sync avoids stale FS cache issues
    set(state => {
      const newSlotsByPack = { ...state.slotsByPack };
      const newUnassignedByPack = { ...state.unassignedFilesByPack };
      const newHistoryByPack = { ...state.historyByPack };

      // 1. Rename keys for packs that were renamed
      for (const [from, to] of Object.entries(renamedPacks)) {
        if (newSlotsByPack[from]) {
          newSlotsByPack[to] = newSlotsByPack[from];
          delete newSlotsByPack[from];
        }
        if (newUnassignedByPack[from]) {
          newUnassignedByPack[to] = newUnassignedByPack[from];
          delete newUnassignedByPack[from];
        }
        if (newHistoryByPack[from]) {
          newHistoryByPack[to] = newHistoryByPack[from];
          delete newHistoryByPack[from];
        }
      }

      // 2. Update files directly in slotsByPack to match new filenames on disk
      for (const update of fileUpdates) {
        const packSlots = newSlotsByPack[update.packName];
        if (packSlots) {
          const newPackSlots = [...packSlots];
          let found = false;
          for (let i = 0; i < newPackSlots.length; i++) {
            const slot = newPackSlots[i];
            if (slot && slot.sample && slot.sample.originalFilename === update.from) {
              logger.log(`[executeRenamePlan] Updating slot ${i} in pack "${update.packName}": "${update.from}" -> "${update.to}"`);
              newPackSlots[i] = {
                ...slot,
                sample: {
                  ...slot.sample,
                  originalFilename: update.to,
                  originalSlotIndex: update.newPrefix,
                  displayName: update.newName || slot.sample.displayName,
                  hasOriginalTagPrefix: update.newHasTag,
                  fileHandle: update.handle
                }
              };
              found = true;
              break;
            }
          }
          if (found) {
            newSlotsByPack[update.packName] = newPackSlots;
          } else {
            logger.warn(`[executeRenamePlan] Could not find slot with originalFilename="${update.from}" in pack "${update.packName}"`);
          }
        } else {
          logger.warn(`[executeRenamePlan] No slotsByPack entry for pack "${update.packName}"`);
        }
      }

      // 3. Clear history for all affected packs since the baseline has changed
      const affectedPacks = new Set<string>();
      for (const update of fileUpdates) {
        affectedPacks.add(update.packName);
      }
      for (const packName of affectedPacks) {
        newHistoryByPack[packName] = [];
      }

      const finalSlots = newActivePack ? (newSlotsByPack[newActivePack] || state.slots) : state.slots;
      const finalUnassigned = newActivePack ? (newUnassignedByPack[newActivePack] || state.unassignedFiles) : state.unassignedFiles;
      
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);
      logger.log(`[executeRenamePlan] After state update: pendingChanges=${pendingChanges}`);

      return {
        activePack: newActivePack,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: newHistoryByPack,
        slots: finalSlots,
        unassignedFiles: finalUnassigned,
        history: [],
        pendingChanges
      };
    });

    logger.log(`[executeRenamePlan] Complete`);
  },
  
  undo: () => {
    set((state) => {
      if (!state.activePack || state.history.length === 0) return state;
      const newHistory = [...state.history];
      const prevSlots = newHistory.pop()!;
      
      // Compute unassigned diff: if a file was in current slots but not in prevSlots, it goes to unassigned
      const newUnassigned = [...state.unassignedFiles];
      state.slots.forEach(s => {
        if (s.sample && !prevSlots.some(ps => ps.sample?.originalFilename === s.sample?.originalFilename)) {
          newUnassigned.push(s.sample);
        }
      });
      
      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: prevSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames);

      return { 
        slots: prevSlots, 
        unassignedFiles: newUnassigned,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  }
    }),
    {
      name: 'trackster-storage',
      storage: idbStorage,
      partialize: (state: CircuitTracksState) => ({
        rootHandle: state.rootHandle,
        packs: state.packs,
        packSlots: state.packSlots,
        activePack: state.activePack,
        activePackHandle: state.activePackHandle,
        slots: state.slots,
        unassignedFiles: state.unassignedFiles,
        tags: state.tags,
        pendingChanges: state.pendingChanges,
        history: state.history,
        slotsByPack: state.slotsByPack,
        unassignedFilesByPack: state.unassignedFilesByPack,
        historyByPack: state.historyByPack,
      }),
    }
  )
);
