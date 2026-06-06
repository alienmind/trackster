import { create } from 'zustand';

interface AudioState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  lastPlayedBuffer: AudioBuffer | null;
  lastPlayedStartTime: number | null;
  setLastPlayed: (buffer: AudioBuffer | null, startTime: number | null) => void;
  initAudioContext: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,
  lastPlayedBuffer: null,
  lastPlayedStartTime: null,

  setLastPlayed: (buffer, startTime) => set({ lastPlayedBuffer: buffer, lastPlayedStartTime: startTime }),

  initAudioContext: () => {
    if (!get().audioContext) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(ctx.destination);
      set({ audioContext: ctx, analyser });
    }
  }
}));
