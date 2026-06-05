import { create } from 'zustand';

interface AudioState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  initAudioContext: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,

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
