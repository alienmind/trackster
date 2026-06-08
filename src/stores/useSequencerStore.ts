import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Tone from 'tone';


export type StepData = {
  active: boolean;
  noteOverride?: string;
};

export interface SequencerState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  
  patternSize: number; // Max 64
  
  // Maps a trackId (e.g., 'track_123') to an array of 64 StepData objects
  tracks: Record<string, StepData[]>;
  
  // Maps a trackId to a composite string "nodeId:channelId"
  trackAssignments: Record<string, string | null>;

  addTrack: (assignmentId: string) => void;
  removeTrack: (trackId: string) => void;

  setPlaying: (playing: boolean) => Promise<void>;
  togglePlaying: () => Promise<void>;
  setBpm: (bpm: number) => void;
  setCurrentStep: (step: number) => void;
  
  setTrackAssignment: (trackId: string, nodeId: string | null) => void;
  
  setStep: (trackId: string, stepIndex: number, active: boolean, noteOverride?: string) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;
  setPatternSize: (size: number) => void;
}

const createEmptyTrack = (): StepData[] => Array.from({ length: 64 }, () => ({ active: false }));

let masterLoop: Tone.Loop | null = null;

const ensureMasterLoop = () => {
  if (masterLoop) return;
  
  let step = 0;
  masterLoop = new Tone.Loop((time) => {
    const { patternSize, isPlaying } = useSequencerStore.getState();
    if (!isPlaying) return;
    
    const currentPatternSize = patternSize || 16;
    const s = step % currentPatternSize;
    
    Tone.Draw.schedule(() => {
      useSequencerStore.getState().setCurrentStep(s);
    }, time);
    
    step++;
  }, "16n");
  
  masterLoop.start(0);
};

const sequencerStoreCreator: StateCreator<SequencerState> = (set, get) => ({

  isPlaying: false,
  bpm: 120,
  currentStep: 0,
  
  patternSize: 16,
  
  tracks: {},
  trackAssignments: {},
  
  addTrack: (assignmentId: string) => set((state) => {
    const trackId = `track_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      tracks: { ...state.tracks, [trackId]: createEmptyTrack() },
      trackAssignments: { ...state.trackAssignments, [trackId]: assignmentId }
    };
  }),
  
  removeTrack: (trackId: string) => set((state) => {
    const newTracks = { ...state.tracks };
    delete newTracks[trackId];
    const newAssignments = { ...state.trackAssignments };
    delete newAssignments[trackId];
    return {
      tracks: newTracks,
      trackAssignments: newAssignments
    };
  }),
  
  setTrackAssignment: (trackId, assignmentId) => set((state) => ({
    trackAssignments: { ...state.trackAssignments, [trackId]: assignmentId }
  })),
  
  setPlaying: async (playing: boolean) => {
    if (playing) {
      await Tone.start();
      ensureMasterLoop();
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
  },

  setStep: (trackId, stepIndex, active, noteOverride) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const newTrack = [...track];
    newTrack[stepIndex] = { active, noteOverride };
    return { tracks: { ...state.tracks, [trackId]: newTrack } };
  }),

  toggleStep: (trackId, stepIndex) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const newTrack = [...track];
    const step = newTrack[stepIndex];
    if (step) {
      newTrack[stepIndex] = { ...step, active: !step.active };
    }
    return { tracks: { ...state.tracks, [trackId]: newTrack } };
  }),

  setPatternSize: (size) => set({ patternSize: size })
});

type PersistOptions<T> = {
  name: string;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: () => ((state: T | undefined) => void) | void;
};
const persistMiddleware = persist as unknown as <T>(
  config: StateCreator<T>,
  options: PersistOptions<T>,
) => StateCreator<T>;

export const useSequencerStore = create<SequencerState>()(
  persistMiddleware<SequencerState>(
    sequencerStoreCreator,
    {
      name: 'trackster-sequencer-v1',
      // Only persist the user-authored pattern data, not the live transport state
      // or the in-memory Tone.js references. On rehydrate we explicitly reset
      // isPlaying / currentStep so the transport stays stopped.
      partialize: (state) => ({
        bpm: state.bpm,
        patternSize: state.patternSize,
        tracks: state.tracks,
        trackAssignments: state.trackAssignments,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isPlaying = false;
        state.currentStep = 0;
        // Apply persisted bpm to Tone.Transport for next play
        if (typeof state.bpm === 'number') {
          try { Tone.Transport.bpm.value = state.bpm; } catch { /* Tone not ready yet */ }
        }
      },
    }
  )
);


