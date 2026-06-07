import { create } from 'zustand';
import * as Tone from 'tone';

interface SequencerState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  setPlaying: (playing: boolean) => Promise<void>;
  togglePlaying: () => Promise<void>;
  setBpm: (bpm: number) => void;
  setCurrentStep: (step: number) => void;
}

export const useSequencerStore = create<SequencerState>((set, get) => ({
  isPlaying: false,
  bpm: 120,
  currentStep: 0,
  
  setPlaying: async (playing: boolean) => {
    if (playing) {
      await Tone.start();
      Tone.Transport.start();
      set({ isPlaying: true });
    } else {
      Tone.Transport.pause();
      set({ isPlaying: false });
    }
  },

  togglePlaying: async () => {
    const { isPlaying, setPlaying } = get();
    await setPlaying(!isPlaying);
  },

  setBpm: (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
    set({ bpm });
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  }
}));
