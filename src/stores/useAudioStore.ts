import { create } from 'zustand';
import type { PadSlot } from '../types';

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
  scanDuplicates: (slots: PadSlot[]) => Promise<void>;
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

  scanDuplicates: async (_slots) => {
    // TODO: implement
  },

  clearDuplicates: () => {
    set({ duplicatePairs: [] });
  }
}));
