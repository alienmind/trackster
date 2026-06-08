import { create } from 'zustand';
import Soundfont from 'soundfont-player';
import * as Tone from 'tone';
import { useAudioStore } from './useAudioStore';
import { useCircuitTracksStore } from './useCircuitTracksStore';

interface PianoAudioState {
  isAudioReady: boolean;
  isLoadingAudio: boolean;
  piano: any | null;
  audioContext: AudioContext | null;
  playingNodes: Record<number, any>;
  pressedNotes: Record<number, boolean>;
  
  initAudio: () => Promise<void>;
  playNote: (interval: number, durationMs?: number) => Promise<void>;
  stopNote: (interval: number) => void;
  playPreview: (rootIdx: number, scaleIntervals: number[]) => Promise<void>;
  stopPreview: () => void;
  arpeggioId: number;
}

export const usePianoAudioStore = create<PianoAudioState>((set, get) => ({
  isAudioReady: false,
  isLoadingAudio: false,
  piano: null,
  audioContext: null,
  playingNodes: {},
  pressedNotes: {},
  arpeggioId: 0,

  initAudio: async () => {
    const { isAudioReady, isLoadingAudio } = get();
    if (isAudioReady || isLoadingAudio) return;

    set({ isLoadingAudio: true });
    try {
      await Tone.start();
      
      let ac = useAudioStore.getState().audioContext;
      if (!ac) {
        useAudioStore.getState().initAudioContext();
        ac = useAudioStore.getState().audioContext;
      }
      // No longer need analyser for destination, we route directly to Tone.Destination
      
      if (!ac) throw new Error("Could not initialize shared AudioContext");

      if (typeof Soundfont.instrument !== 'function') {
        throw new Error("Soundfont.instrument is not a function. Check import.");
      }
      
      const destNode = ac.createGain();
      destNode.connect(ac.destination);
      
      const analyser = useAudioStore.getState().analyser;
      if (analyser) {
          destNode.connect(analyser);
      }
      
      const instrument = await Soundfont.instrument(ac, 'acoustic_grand_piano', {
        nameToUrl: (name: string, _sf: string, format?: string) => `${import.meta.env.BASE_URL}soundfonts/${name}-${format || 'mp3'}.js`,
        destination: destNode
      });
      
      set({ 
        piano: instrument, 
        audioContext: ac, 
        isAudioReady: true 
      });
    } catch (err) {
      // Failed to load soundfont
    } finally {
      set({ isLoadingAudio: false });
    }
  },

  playNote: async (interval: number, durationMs?: number) => {
    // 1. Set pressed state synchronously
    set(state => ({
      pressedNotes: { ...state.pressedNotes, [interval]: true }
    }));

    const { piano, audioContext } = get();
    
    // If not ready, try to initialize it now
    if (!piano || !audioContext) {
      await get().initAudio();
    }

    const updatedPiano = get().piano;
    const updatedCtx = get().audioContext;
    if (!updatedPiano || !updatedCtx) return;
    
    if (updatedCtx.state === 'suspended') {
        await updatedCtx.resume();
    }
    await Tone.start();
    
    // 2. Check if the user released the key during the asynchronous wait time
    if (!get().pressedNotes[interval] && !durationMs) {
      return; // Released before we could play it
    }
    
    // Stop the note if it is already playing to avoid overlap
    const { playingNodes } = get();
    if (playingNodes[interval]) {
        playingNodes[interval].stop();
    }

    // Base note C4 = MIDI 60. Interval 1 represents C4.
    const midiNote = 60 + interval - 1; 
    
    try {
      const options = durationMs ? { duration: durationMs / 1000 } : undefined;
      const node = updatedPiano.play(midiNote.toString(), updatedCtx.currentTime, options);
      
      // Double check in case it was released just as we triggered play
      if (!get().pressedNotes[interval] && !durationMs) {
        node.stop();
        return;
      }

      set(state => ({
        playingNodes: { ...state.playingNodes, [interval]: node }
      }));
    } catch (e) {
      // Error playing note
    }
  },

  stopNote: (interval: number) => {
    set(state => ({
      pressedNotes: { ...state.pressedNotes, [interval]: false }
    }));

    const { playingNodes } = get();
    if (playingNodes[interval]) {
        playingNodes[interval].stop();
        
        set(state => {
          const newNodes = { ...state.playingNodes };
          delete newNodes[interval];
          return { playingNodes: newNodes };
        });
    }
  },

  stopPreview: () => {
    set(state => ({ arpeggioId: state.arpeggioId + 1 }));
  },

  playPreview: async (rootIdx: number, scaleIntervals: number[]) => {
    const currentId = get().arpeggioId + 1;
    set({ arpeggioId: currentId });
    const { playNote, isAudioReady } = get();
    
    if (!isAudioReady || scaleIntervals.length === 0) return;
    
    const bpm = useCircuitTracksStore.getState().bpm || 120;
    const eighthNoteMs = 30000 / bpm; // 1/8th note duration
    
    const playSequence = async (forward: boolean) => {
      const sequenceType = useCircuitTracksStore.getState().previewSequence;
      let targetDegrees: number[] = [];
      if (sequenceType === '1-3-5') {
        targetDegrees = [0, 2, 4];
      } else if (sequenceType === 'full') {
        targetDegrees = Array.from({ length: scaleIntervals.length }, (_, i) => i);
      } else if (sequenceType === '1-3-5-7-9') {
        targetDegrees = [0, 2, 4, 6, 8];
      } else if (sequenceType === '1-3-5-7-9-11') {
        targetDegrees = [0, 2, 4, 6, 8, 10];
      } else {
        targetDegrees = [0, 2, 4];
      }
      
      const degrees = forward ? targetDegrees : [...targetDegrees].reverse().slice(1);
      const arpMode = useCircuitTracksStore.getState().previewArpMode;
      
      let degreesToPlay = [...degrees];
      if (arpMode === 'random') {
        degreesToPlay = degreesToPlay.sort(() => Math.random() - 0.5);
      }
      
      for (const degree of degreesToPlay) {
        if (get().arpeggioId !== currentId) return false;
        
        const octaveOffset = Math.floor(degree / scaleIntervals.length);
        const wrappedDegree = degree % scaleIntervals.length;
        
        const chromaticOffset = scaleIntervals[wrappedDegree]! - 1 + (octaveOffset * 12);
        const interval = rootIdx + chromaticOffset + 1;
        
        // Prevent going out of piano bounds (MIDI notes 0-127 typically, but piano samples might be 21-108)
        const midiNote = 60 + interval - 1;
        if (midiNote <= 108) {
           const sustain = useCircuitTracksStore.getState().previewSustain;
           playNote(interval, sustain === 'off' ? eighthNoteMs : undefined);
        }
        
        await new Promise(resolve => setTimeout(resolve, eighthNoteMs));
      }
      return true;
    };
    
    do {
      let continued = await playSequence(true);
      if (!continued) break;
      
      const currentArpMode = useCircuitTracksStore.getState().previewArpMode;
      if (currentArpMode === 'up-down') {
         continued = await playSequence(false);
         if (!continued) break;
      }
    } while (useCircuitTracksStore.getState().previewLoop === 'continuous');
  }
}));
