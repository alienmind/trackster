import { create } from 'zustand';

interface AudioState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  lastPlayedBuffer: AudioBuffer | null;
  lastPlayedStartTime: number | null;
  setLastPlayed: (buffer: AudioBuffer | null, startTime: number | null) => void;
  initAudioContext: () => void;

  isMonitoring: boolean;
  mediaStream: MediaStream | null;
  mediaStreamSource: MediaStreamAudioSourceNode | null;
  startMonitoring: (deviceId: string) => Promise<void>;
  stopMonitoring: () => void;
}

import * as Tone from 'tone';

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,
  lastPlayedBuffer: null,
  lastPlayedStartTime: null,

  setLastPlayed: (buffer, startTime) => set({ lastPlayedBuffer: buffer, lastPlayedStartTime: startTime }),

  isMonitoring: false,
  mediaStream: null,
  mediaStreamSource: null,

  initAudioContext: () => {
    if (!get().audioContext) {
      const ctx = Tone.getContext().rawContext as AudioContext;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 16384;
      // Do not connect analyser to destination, it's just a passive visualizer endpoint!
      
      try {
        Tone.Destination.connect(analyser as any);
        // Explicitly connect to destination just in case the analyser connection overrides the default
        Tone.Destination.connect(ctx.destination as any);
      } catch (e) {
        console.error("Failed to connect Tone.Destination to analyser", e);
      }
      
      set({ audioContext: ctx, analyser });
    }
  },

  startMonitoring: async (deviceId: string) => {
    const { audioContext, initAudioContext } = get();
    if (!audioContext) {
      initAudioContext();
    }
    const ctx = get().audioContext!;
    const analyserNode = get().analyser!;

    // Clean up any existing monitoring
    get().stopMonitoring();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      set({
        isMonitoring: true,
        mediaStream: stream,
        mediaStreamSource: source
      });
    } catch (err) {
      console.error('Error starting audio monitor:', err);
    }
  },

  stopMonitoring: () => {
    const { mediaStream, mediaStreamSource } = get();
    
    if (mediaStreamSource) {
      mediaStreamSource.disconnect();
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    set({
      isMonitoring: false,
      mediaStream: null,
      mediaStreamSource: null
    });
  }
}));
