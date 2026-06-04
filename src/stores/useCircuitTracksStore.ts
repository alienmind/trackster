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
import { useUIStore } from './useUIStore';

export type DeviceMode = 'samples' | 'packs' | 'scales' | 'tempo';

export interface PackHistoryEntry {
  packSlots: PackSlot[];
  slotsByPack: Record<string, PadSlot[]>;
  unassignedFilesByPack: Record<string, SampleFile[]>;
  historyByPack: Record<string, PadSlot[][]>;
}

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
  executeProgress: { current: number; total: number; phase: string } | null;
  history: PadSlot[][];
  packHistory: PackHistoryEntry[];
  
  slotsByPack: Record<string, PadSlot[]>;
  unassignedFilesByPack: Record<string, SampleFile[]>;
  historyByPack: Record<string, PadSlot[][]>;
  
  applyTagsToFilenames: boolean;
  setApplyTagsToFilenames: (apply: boolean) => void;
  
  workspaceMode: 'read' | 'readwrite' | null;
  setWorkspaceMode: (mode: 'read' | 'readwrite') => Promise<boolean>;
  
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  activeRootNote: number;
  setActiveRootNote: (padIndex: number) => void;
  activeScaleType: number;
  setActiveScaleType: (padIndex: number) => void;
  scalesViewMode: 'description' | 'piano';
  setScalesViewMode: (mode: 'description' | 'piano') => void;
  previewSequence: 'full' | '1-3-5' | '1-3-5-7-9' | '1-3-5-7-9-11';
  setPreviewSequence: (seq: 'full' | '1-3-5' | '1-3-5-7-9' | '1-3-5-7-9-11') => void;
  previewLoop: 'one-off' | 'continuous';
  setPreviewLoop: (mode: 'one-off' | 'continuous') => void;
  previewArpMode: 'up' | 'up-down' | 'random';
  setPreviewArpMode: (mode: 'up' | 'up-down' | 'random') => void;
  previewSustain: 'on' | 'off';
  setPreviewSustain: (mode: 'on' | 'off') => void;
  duplicateActivePack: () => void;
  clearActivePack: () => void;
  
  openRootDirectory: (mode?: 'read' | 'readwrite') => Promise<void>;
  rescanRootDirectory: () => Promise<void>;
  loadPack: (packName: string) => Promise<void>;
  copyToPack: (file: SampleFile, targetPackName: string) => Promise<void>;
  movePackSlot: (fromIndex: number, toIndex: number) => void;
  moveToPack: (file: SampleFile, targetPackName: string) => void;
  moveSlot: (fromIndex: number, toIndex: number) => void;
  moveSlots: (fromIndices: number[], toStartIndex: number) => void;
  clearSlot: (index: number) => void;
  clearSlots: (indices: number[]) => void;
  copySlotsToStaging: (indices: number[]) => void;
  clearPackSlot: (index: number) => void;
  duplicatePack: (index: number) => void;
  renamePack: (index: number, newDisplayName: string) => void;
  assignToSlot: (file: SampleFile, slotIndex: number) => void;
  assignMultipleToSlots: (files: SampleFile[], startIndex: number) => void;
  removeFile: (file: SampleFile) => void;
  renameFile: (file: SampleFile, newDisplayName: string) => void;
  assignTagToSlot: (tagId: string, slotIndex: number) => void;
  addTag: (label: string) => void;
  removeTag: (tagId: string) => void;
  autoTag: () => void;
  autoArrange: () => void;
  commitChanges: () => Promise<RenamePlan>;
  executeRenamePlan: (plan: RenamePlan) => Promise<void>;
  clearExecuteProgress: () => void;
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

const snapshotPackState = (state: CircuitTracksState): PackHistoryEntry => ({
  packSlots: state.packSlots.map(s => ({ ...s, pack: s.pack ? { ...s.pack } : null })),
  slotsByPack: { ...state.slotsByPack },
  unassignedFilesByPack: { ...state.unassignedFilesByPack },
  historyByPack: { ...state.historyByPack }
});

const countAllPendingChanges = (slotsByPack: Record<string, PadSlot[]>, packSlots: PackSlot[], applyTagsToFilenames: boolean, originalPacks: string[]) => {
  let count = 0;
  for (const packName in slotsByPack) {
    const slots = slotsByPack[packName];
    if (slots) count += countPendingChanges(slots, [], applyTagsToFilenames);
  }
  count += countPendingChanges([], packSlots, applyTagsToFilenames);

  const occurrences = new Map<string, number>();
  for (const slot of packSlots) {
    if (slot.pack) {
      occurrences.set(slot.pack.originalDirname, (occurrences.get(slot.pack.originalDirname) || 0) + 1);
    }
  }

  for (const original of originalPacks) {
    const countOccurrences = occurrences.get(original) || 0;
    if (countOccurrences === 0) {
      count++; // Deletion
    } else if (countOccurrences > 1) {
      count += (countOccurrences - 1); // Duplicates
    }
  }

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
          analyser.connect(ctx.destination);
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
      executeProgress: null,
      history: [],
      packHistory: [],
      slotsByPack: {},
      unassignedFilesByPack: {},
      historyByPack: {},
      
      applyTagsToFilenames: false,
      setApplyTagsToFilenames: (apply) => set((state) => ({ 
        applyTagsToFilenames: apply,
        pendingChanges: countAllPendingChanges(state.slotsByPack, state.packSlots, apply, state.packs)
      })),
      
      workspaceMode: null,
      deviceMode: 'samples',
      setDeviceMode: (mode) => set({ deviceMode: mode }),
      bpm: 120,
      setBpm: (bpm) => set({ bpm }),
      activeRootNote: 8,
      setActiveRootNote: (padIndex) => set({ activeRootNote: padIndex }),
      activeScaleType: 16,
      setActiveScaleType: (padIndex) => set({ activeScaleType: padIndex }),
      scalesViewMode: 'description',
      setScalesViewMode: (mode) => set({ scalesViewMode: mode }),
      previewSequence: 'full',
      setPreviewSequence: (seq) => set({ previewSequence: seq }),
      previewLoop: 'one-off',
      setPreviewLoop: (mode) => set({ previewLoop: mode }),
      previewArpMode: 'up',
      setPreviewArpMode: (mode) => set({ previewArpMode: mode }),
      previewSustain: 'on',
      setPreviewSustain: (mode) => set({ previewSustain: mode }),
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
          const parsed = parseFilename(entry.name, true);
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
        pendingChanges: countAllPendingChanges(state.slotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs)
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
      // Clear audio cache when switching packs to prevent playing old cached audio
      if (state.activePack !== packName) {
        state.decodedBuffers.clear();
      }

      const newSlotsByPack = { ...state.slotsByPack, [packName]: finalSlots };
      return { 
        activePack: packName,
        activePackHandle: packHandle,
        slots: finalSlots, 
        unassignedFiles: finalUnassigned, 
        pendingChanges: countAllPendingChanges(newSlotsByPack, get().packSlots, get().applyTagsToFilenames, get().packs), 
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

      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
      const newPackHistory = [...state.packHistory, snapshotPackState(state)];
      const newPackSlots = [...state.packSlots];
      const fromSlot = newPackSlots[fromIndex]!;
      const toSlot = newPackSlots[toIndex]!;
      
      const tempPack = fromSlot.pack;
      newPackSlots[fromIndex] = { ...fromSlot, pack: toSlot.pack };
      newPackSlots[toIndex] = { ...toSlot, pack: tempPack };
      
      const pendingChanges = countAllPendingChanges(state.slotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs);

      return {
        packSlots: newPackSlots,
        packHistory: newPackHistory,
        pendingChanges
      };
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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

      return {
        slots: newSlots,
        history: newHistory,
        slotsByPack: newSlotsByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  moveSlots: (fromIndices, toStartIndex) => {
    logger.log(`[Store] Moving multiple slots from [${fromIndices.join(',')}] to start index ${toStartIndex}`);
    if (fromIndices.length === 0) return;

    set((state) => {
      if (!state.activePack) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const newUnassigned = [...state.unassignedFiles];
      
      const samplesToMove: import('../types').SampleFile[] = [];
      fromIndices.forEach(idx => {
        const sample = newSlots[idx]!.sample;
        if (sample) {
          samplesToMove.push(sample);
          newSlots[idx] = { ...newSlots[idx]!, sample: null };
        }
      });
      
      let currentIndex = toStartIndex;
      for (const sample of samplesToMove) {
        if (currentIndex < 64) {
          const overwritten = newSlots[currentIndex]!.sample;
          if (overwritten) {
            newUnassigned.push(overwritten);
          }
          newSlots[currentIndex] = { ...newSlots[currentIndex]!, sample };
          currentIndex++;
        } else {
          newUnassigned.push(sample);
        }
      }
      
      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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

  clearSlots: (indices) => {
    logger.log(`[Store] Clearing slots [${indices.join(',')}]`);
    set((state) => {
      if (!state.activePack || indices.length === 0) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const newUnassigned = [...state.unassignedFiles];
      
      let changed = false;
      indices.forEach(index => {
        const slot = newSlots[index]!;
        if (slot.sample) {
          newUnassigned.push(slot.sample);
          newSlots[index] = { ...slot, sample: null };
          changed = true;
        }
      });
      
      if (!changed) return state;

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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

  copySlotsToStaging: (indices) => {
    logger.log(`[Store] Copying slots [${indices.join(',')}] to staging`);
    set((state) => {
      if (!state.activePack || indices.length === 0) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      const newUnassigned = [...state.unassignedFiles];
      
      let changed = false;
      const existingNames = new Set(newUnassigned.map(f => f.originalFilename));
      
      indices.forEach(index => {
        const slot = newSlots[index]!;
        if (slot.sample && !existingNames.has(slot.sample.originalFilename)) {
          newUnassigned.push(slot.sample);
          existingNames.add(slot.sample.originalFilename);
          changed = true;
        }
      });
      
      if (!changed) return state;

      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

      return {
        unassignedFiles: newUnassigned,
        history: newHistory,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: { ...state.historyByPack, [state.activePack]: newHistory },
        pendingChanges
      };
    });
  },

  clearPackSlot: (index) => {
    logger.log(`[Store] Clearing pack slot ${index}`);
    set((state) => {
      const newPackHistory = [...state.packHistory, snapshotPackState(state)];
      const newPackSlots = [...state.packSlots];
      const slot = newPackSlots[index]!;
      if (!slot.pack) return state;

      const packName = slot.pack.originalDirname;
      newPackSlots[index] = { ...slot, pack: null };

      // Remove associated data for this pack
      const newSlotsByPack = { ...state.slotsByPack };
      const newUnassignedByPack = { ...state.unassignedFilesByPack };
      const newHistoryByPack = { ...state.historyByPack };
      delete newSlotsByPack[packName];
      delete newUnassignedByPack[packName];
      delete newHistoryByPack[packName];

      // If this was the active pack, clear the selection
      const isActive = state.activePack === packName;
      const pendingChanges = countAllPendingChanges(newSlotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs);

      return {
        packSlots: newPackSlots,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: newHistoryByPack,
        packHistory: newPackHistory,
        ...(isActive ? { activePack: null, activePackHandle: null, slots: Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null })), unassignedFiles: [], history: [], deviceMode: 'packs' } : {}),
        pendingChanges
      };
    });
  },

  clearActivePack: () => {
    const state = get();
    if (!state.activePack) return;
    const slot = state.packSlots.find(s => s.pack?.originalDirname === state.activePack);
    if (!slot || !slot.pack) return;

    useUIStore.getState().showConfirmModal({
      title: "Delete Pack",
      description: `Are you sure you want to completely remove "${slot.pack.displayName || slot.pack.originalDirname}" from your SD Card?\n\nThis cannot be undone.`,
      confirmText: "Delete Pack",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: () => {
        get().clearPackSlot(slot.index);
      }
    });
  },

  duplicateActivePack: () => {
    const state = get();
    if (!state.activePack) return;
    const slot = state.packSlots.find(s => s.pack?.originalDirname === state.activePack);
    if (slot && slot.pack) {
      get().duplicatePack(slot.index);
    }
  },

  duplicatePack: (index) => {
    logger.log(`[Store] Duplicating pack at slot ${index}`);
    set((state) => {
      const slot = state.packSlots[index];
      if (!slot?.pack) return state;

      const newPackHistory = [...state.packHistory, snapshotPackState(state)];
      // Find next empty slot
      const emptyIndex = state.packSlots.findIndex(s => s.pack === null);
      if (emptyIndex === -1) {
        logger.warn(`[Store] No empty pack slots available for duplication`);
        return state;
      }

      const srcPack = slot.pack;
      const newDisplayName = `${srcPack.displayName} Copy`;
      // The new pack is a UI-only clone. It shares the same dirHandle as the
      // source so that computeRenamePlan can produce a copy operation at commit
      // time (it will see two packSlots referencing the same originalDirname).
      const newPack: PackFolder = {
        originalDirname: srcPack.originalDirname,
        displayName: newDisplayName,
        originalSlotIndex: emptyIndex,
        dirHandle: srcPack.dirHandle,
      };

      const newPackSlots = [...state.packSlots];
      newPackSlots[emptyIndex] = { ...newPackSlots[emptyIndex]!, pack: newPack };

      // Clone the samples data for this pack
      const srcSlots = state.slotsByPack[srcPack.originalDirname];
      const srcUnassigned = state.unassignedFilesByPack[srcPack.originalDirname];
      const newSlotsByPack = { ...state.slotsByPack };
      const newUnassignedByPack = { ...state.unassignedFilesByPack };

      // Use a temporary key for the duplicated pack data — the pack name
      // will be resolved at commit time based on the slot index + displayName.
      const dupeKey = `${emptyIndex.toString().padStart(2, '0')}_${newDisplayName}`;
      if (srcSlots) newSlotsByPack[dupeKey] = srcSlots.map(s => ({ ...s }));
      if (srcUnassigned) newUnassignedByPack[dupeKey] = [...srcUnassigned];

      const pendingChanges = countAllPendingChanges(newSlotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs);

      return {
        packSlots: newPackSlots,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        packHistory: newPackHistory,
        pendingChanges
      };
    });
  },

  renamePack: (index, newDisplayName) => {
    logger.log(`[Store] Renaming pack at slot ${index} to "${newDisplayName}"`);
    set((state) => {
      const slot = state.packSlots[index];
      if (!slot?.pack) return state;

      const newPackHistory = [...state.packHistory, snapshotPackState(state)];
      const newPackSlots = [...state.packSlots];
      newPackSlots[index] = {
        ...slot,
        pack: { ...slot.pack, displayName: newDisplayName }
      };

      const pendingChanges = countAllPendingChanges(state.slotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs);
      return { packSlots: newPackSlots, packHistory: newPackHistory, pendingChanges };
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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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

  assignMultipleToSlots: (files, startIndex) => {
    logger.log(`[Store] Assigning ${files.length} files starting at ${startIndex}`);
    set((state) => {
      if (!state.activePack || files.length === 0) return state;
      const snapshot = state.slots.map((s) => ({ ...s }));
      const newSlots = [...state.slots];
      let newUnassigned = [...state.unassignedFiles];
      
      const fileOriginalNames = new Set(files.map(f => f.originalFilename));
      newUnassigned = newUnassigned.filter(f => !fileOriginalNames.has(f.originalFilename));
      
      let currentIndex = startIndex;
      for (const file of files) {
        if (currentIndex < 64) {
          const overwritten = newSlots[currentIndex]!.sample;
          if (overwritten) {
            newUnassigned.push(overwritten);
          }
          newSlots[currentIndex] = { index: currentIndex, sample: file };
          currentIndex++;
        } else {
          newUnassigned.push(file);
        }
      }
      
      const newSlotsByPack = { ...state.slotsByPack, [state.activePack]: newSlots };
      const newUnassignedByPack = { ...state.unassignedFilesByPack, [state.activePack]: newUnassigned };
      const newHistory = [...state.history, snapshot];
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
    const { rootHandle, slotsByPack, packSlots, applyTagsToFilenames, packs } = get();
    if (!rootHandle) return { operations: [], createdAt: new Date() };

    const tracksHandle = await getTracksHandle(rootHandle);

    return computeRenamePlan(slotsByPack, packSlots, packs, tracksHandle, applyTagsToFilenames);
  },
  
  clearExecuteProgress: () => set({ executeProgress: null }),

  executeRenamePlan: async (plan) => {
    const { activePack } = get();

    const totalSteps = plan.operations.length * 2; // Pass 1 + Pass 2
    let completedSteps = 0;

    const reportProgress = (phase: string) => {
      set({ executeProgress: { current: completedSteps, total: totalSteps, phase } });
    };

    // Yield to the browser so it can repaint the UI between operations
    const yieldToUI = () => new Promise<void>(r => setTimeout(r, 0));

    logger.log(`[executeRenamePlan] Starting with ${plan.operations.length} operations, activePack=${activePack}`);
    reportProgress('Preparing...');

    const copyDirectoryContents = async (srcHandle: FileSystemDirectoryHandle, destHandle: FileSystemDirectoryHandle, onProgress?: (name: string) => void) => {
      for await (const entry of srcHandle.values()) {
        if (entry.kind === 'file') {
          if (onProgress) onProgress(entry.name);
          const fileHandle = await srcHandle.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          const newFile = await destHandle.getFileHandle(entry.name, { create: true });
          const writable = await newFile.createWritable();
          await writable.write(file);
          await writable.close();
          await yieldToUI(); // Unfreeze the browser
        } else if (entry.kind === 'directory') {
          const subDirHandle = await srcHandle.getDirectoryHandle(entry.name);
          const newDir = await destHandle.getDirectoryHandle(entry.name, { create: true });
          await copyDirectoryContents(subDirHandle, newDir, onProgress);
        }
      }
    };

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

    // Pass 1: rename each file/folder to a temp name.
    // We create new directories and move files individually, avoiding data duplication.
    for (let opIdx = 0; opIdx < plan.operations.length; opIdx++) {
      const op = plan.operations[opIdx]!;
      const dir = op.parentDirHandle;
      const action = op.action || 'move';
      const tempName = `__tmp_${op.to}`;
      reportProgress(`Preparing (${op.type}): ${op.from}`);
      await yieldToUI();
      try {
        if (action === 'delete') {
          logger.log(`[executeRenamePlan] Pass1 op${opIdx}: ${op.type} DELETE "${op.from}"`);
          await dir.removeEntry(op.from, { recursive: op.type === 'pack' });
        } else {
          logger.log(`[executeRenamePlan] Pass1 op${opIdx}: ${op.type} ${action.toUpperCase()} "${op.from}" -> temp "${tempName}"`);
          if (op.type === 'file') {
            const file = await (op.handle as FileSystemFileHandle).getFile();
            const newFileHandle = await dir.getFileHandle(tempName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            if (action === 'move') await dir.removeEntry(op.from);
          } else if (op.type === 'pack') {
            const newDirHandle = await dir.getDirectoryHandle(tempName, { create: true });
            const oldDirHandle = op.handle as FileSystemDirectoryHandle;
            await copyDirectoryContents(oldDirHandle, newDirHandle, (fileName) => {
              reportProgress(`Preparing (${op.type}): ${op.from} → ${fileName}`);
            });
            if (action === 'move') await dir.removeEntry(op.from, { recursive: true });
          }
        }
        completedSteps++;
        logger.log(`[executeRenamePlan] Pass1 op${opIdx}: done`);
      } catch (err) {
        completedSteps++;
        logger.error(`[executeRenamePlan] Pass1 op${opIdx} FAILED:`, err);
      }
    }

    // Pass 2: rename temp files/folders to final names (copy+delete again)
    const fileUpdates: Array<{
      packName: string; 
      from: string; 
      to: string; 
      handle: FileSystemFileHandle; 
      parentDirHandle: FileSystemDirectoryHandle;
      newPrefix: number;
      newName: string;
      newHasTag: boolean;
    }> = [];

    const renamedPacksHandles: Record<string, FileSystemDirectoryHandle> = {};

    for (let opIdx = 0; opIdx < plan.operations.length; opIdx++) {
      const op = plan.operations[opIdx]!;
      const action = op.action || 'move';
      if (action === 'delete') {
        completedSteps++;
        continue;
      }
      const dir = op.parentDirHandle;
      const tempName = `__tmp_${op.to}`;
      reportProgress(`Finalizing (${op.type}): ${op.to}`);
      await yieldToUI();
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
            parentDirHandle: dir,
            newPrefix: parsed ? parsed.prefix : -1,
            newName: parsed ? parsed.name : '',
            newHasTag: parsed ? parsed.hasOriginalTagPrefix : false
          });
        } else if (op.type === 'pack') {
          const oldDirHandle = await dir.getDirectoryHandle(tempName);
          const newDirHandle = await dir.getDirectoryHandle(op.to, { create: true });
          await copyDirectoryContents(oldDirHandle, newDirHandle, (fileName) => {
            reportProgress(`Finalizing (${op.type}): ${op.to} → ${fileName}`);
          });
          await dir.removeEntry(tempName, { recursive: true });
          renamedPacksHandles[op.to] = newDirHandle;
        }
        completedSteps++;
        logger.log(`[executeRenamePlan] Pass2 op${opIdx}: done`);
      } catch (err) {
        completedSteps++;
        logger.error(`[executeRenamePlan] Pass2 op${opIdx} FAILED:`, err);
      }
    }

    logger.log(`[executeRenamePlan] File updates collected:`, fileUpdates.map(u => `"${u.from}" -> "${u.to}" (pack: ${u.packName})`));

    // Determine if any packs were renamed
    let newActivePack: string | null = activePack;
    const renamedPacks: Record<string, string> = {};

    for (const op of plan.operations) {
      if (op.type === 'pack') {
        const action = op.action || 'move';
        if (action === 'move') {
          renamedPacks[op.from] = op.to;
          if (op.from === activePack) {
            newActivePack = op.to;
          }
        } else if (action === 'delete') {
          if (op.from === activePack) {
            newActivePack = null;
          }
        } else if (action === 'copy') {
          // Track the new handle for the copied pack
          renamedPacks[op.to] = op.to; // The copy now maps to its new name
        }
      }
    }

    // Update file handles for copied packs before state update
    for (const op of plan.operations) {
      if (op.type === 'pack' && op.action === 'copy') {
        const newDirHandle = renamedPacksHandles[op.to];
        if (newDirHandle) {
          const packSlots = get().slotsByPack[op.to];
          if (packSlots) {
            for (const slot of packSlots) {
              if (slot.sample) {
                try {
                  const newHandle = await newDirHandle.getFileHandle(slot.sample.originalFilename);
                  fileUpdates.push({
                    packName: op.to,
                    from: slot.sample.originalFilename,
                    to: slot.sample.originalFilename,
                    handle: newHandle,
                    parentDirHandle: newDirHandle,
                    newPrefix: slot.sample.originalSlotIndex,
                    newName: slot.sample.displayName,
                    newHasTag: slot.sample.hasOriginalTagPrefix || false
                  });
                } catch (err) {
                  // File might not exist if it was deleted
                }
              }
            }
          }
        }
      }
    }

    // Update state directly - manual sync avoids stale FS cache issues
    set(state => {
      let newSlotsByPack = { ...state.slotsByPack };
      let newUnassignedByPack = { ...state.unassignedFilesByPack };
      let newHistoryByPack = { ...state.historyByPack };

      // 1. Rename keys for packs that were renamed (use temporary objects to avoid clobbering on swaps)
      const nextSlotsByPack: Record<string, PadSlot[]> = {};
      const nextUnassignedByPack: Record<string, SampleFile[]> = {};
      const nextHistoryByPack: Record<string, PadSlot[][]> = {};

      for (const key of Object.keys(newSlotsByPack)) {
        const to = renamedPacks[key] || key;
        nextSlotsByPack[to] = newSlotsByPack[key]!;
      }
      for (const key of Object.keys(newUnassignedByPack)) {
        const to = renamedPacks[key] || key;
        nextUnassignedByPack[to] = newUnassignedByPack[key]!;
      }
      for (const key of Object.keys(newHistoryByPack)) {
        const to = renamedPacks[key] || key;
        nextHistoryByPack[to] = newHistoryByPack[key]!;
      }

      newSlotsByPack = nextSlotsByPack;
      newUnassignedByPack = nextUnassignedByPack;
      newHistoryByPack = nextHistoryByPack;

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
                  fileHandle: update.handle,
                  parentDirHandle: update.parentDirHandle
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
      
      const newPackSlots = state.packSlots.map(slot => {
        if (slot.pack) {
          // If this slot's originalDirname was moved, use the new name
          let newDirname = slot.pack.originalDirname;
          const expectedTo = `${slot.index.toString().padStart(2, '0')}_${slot.pack.displayName}`;
          
          // Check if this specific slot was subject to an operation
          const op = plan.operations.find(o => o.type === 'pack' && o.to === expectedTo);
          if (op) {
            newDirname = op.to;
          } else if (renamedPacks[slot.pack.originalDirname]) {
             // Fallback for moves if exact match not found (though it should be)
             newDirname = renamedPacks[slot.pack.originalDirname]!;
          }

          if (newDirname !== slot.pack.originalDirname) {
            return {
              ...slot,
              pack: {
                ...slot.pack,
                originalDirname: newDirname,
                dirHandle: renamedPacksHandles[newDirname] || slot.pack.dirHandle
              }
            };
          }
        }
        return slot;
      });

      const pendingChanges = countAllPendingChanges(newSlotsByPack, newPackSlots, state.applyTagsToFilenames, state.packs);
      logger.log(`[executeRenamePlan] After state update: pendingChanges=${pendingChanges}`);

      return {
        activePack: newActivePack,
        packSlots: newPackSlots,
        slotsByPack: newSlotsByPack,
        unassignedFilesByPack: newUnassignedByPack,
        historyByPack: newHistoryByPack,
        slots: finalSlots,
        unassignedFiles: finalUnassigned,
        history: [],
        packHistory: [],
        pendingChanges
      };
    });

    logger.log(`[executeRenamePlan] Complete`);
  },
  
  undo: () => {
    set((state) => {
      if (state.deviceMode === 'packs') {
        if (state.packHistory.length === 0) return state;
        const newPackHistory = [...state.packHistory];
        const prev = newPackHistory.pop()!;
        const pendingChanges = countAllPendingChanges(prev.slotsByPack, prev.packSlots, state.applyTagsToFilenames, state.packs);
        return {
          packSlots: prev.packSlots,
          slotsByPack: prev.slotsByPack,
          unassignedFilesByPack: prev.unassignedFilesByPack,
          historyByPack: prev.historyByPack,
          packHistory: newPackHistory,
          pendingChanges
        };
      }

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
      const pendingChanges = countAllPendingChanges(newSlotsByPack, state.packSlots, state.applyTagsToFilenames, state.packs);

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
        packHistory: state.packHistory,
        slotsByPack: state.slotsByPack,
        unassignedFilesByPack: state.unassignedFilesByPack,
        historyByPack: state.historyByPack,
        deviceMode: state.deviceMode,
        activeRootNote: state.activeRootNote,
        activeScaleType: state.activeScaleType,
        scalesViewMode: state.scalesViewMode,
        previewSequence: state.previewSequence,
        previewLoop: state.previewLoop,
        previewArpMode: state.previewArpMode,
        previewSustain: state.previewSustain,
        bpm: state.bpm,
      }),
    }
  )
);
