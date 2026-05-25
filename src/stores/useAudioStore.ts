import { create } from 'zustand';
import type { PadSlot, SampleFile } from '../types';
import { useFileSystemStore } from './useFileSystemStore';
import { useUIStore } from './useUIStore';
import { computeSimilarity } from '../utils/similarity';

interface AudioState {
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
}

export const useAudioStore = create<AudioState>((set, get) => ({
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
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      buffer = await ctx.decodeAudioData(arrayBuffer);
      if (slotIndex >= 0) {
        state.decodedBuffers.set(slotIndex, buffer);
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
    const { slots, unassignedFiles } = useFileSystemStore.getState();
    const allSamples: SampleFile[] = [];
    
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
          // Analysis done, compute clusters
          worker.terminate();
          set({ analysisProgress: null });
          
          const clusters: SampleFile[][] = [];
          const processed = new Set<string>();

          for (let i = 0; i < allSamples.length; i++) {
            const sampleA = allSamples[i]!;
            if (processed.has(sampleA.originalFilename)) continue;
            
            const fpA = fingerprints.get(sampleA.originalFilename);
            if (!fpA) continue;

            const cluster: SampleFile[] = [sampleA];
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
          
          useUIStore.getState().openDuplicateModal(clusters);
          resolve();
        }
      };

      // Start processing
      allSamples.forEach(async (sample) => {
        try {
          const file = await sample.fileHandle.getFile();
          const buffer = await file.arrayBuffer();
          // We need originalFilename to identify it back since slotIndex is not unique across unassigned
          worker.postMessage({ originalFilename: sample.originalFilename, buffer }, [buffer]);
        } catch (err) {
          worker.postMessage({ originalFilename: sample.originalFilename, error: 'File read error' });
        }
      });
    });
  },

  clearDuplicates: () => {
    set({ duplicatePairs: [] });
  }
}));
