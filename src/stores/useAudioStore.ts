import { create } from 'zustand';
import type { PadSlot } from '../types';

interface AudioState {
  audioContext: AudioContext | null;
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
  currentlyPlayingSlot: null,
  decodedBuffers: new Map(),
  currentSource: null,
  analysisProgress: null,
  duplicatePairs: [],

  initAudioContext: () => {
    if (!get().audioContext) {
      set({ audioContext: new AudioContext() });
    }
  },

  playSlot: async (slotIndex, fileHandle) => {
    // TODO: implement
  },

  stopPlayback: () => {
    // TODO: implement
  },

  togglePlayback: async (slotIndex, fileHandle) => {
    // TODO: implement
  },

  scanDuplicates: async (slots) => {
    // TODO: implement
  },

  clearDuplicates: () => {
    set({ duplicatePairs: [] });
  }
}));
