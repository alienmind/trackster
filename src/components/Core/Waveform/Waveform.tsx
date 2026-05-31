import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useUIStore } from '../../../stores/useUIStore';
import { useAudioStore } from '../../../stores/useAudioStore';
import { PAGES } from '../../../utils/constants';

export default function Waveform() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  const selectedFile = useUIStore((s) => s.selectedFile);
  const activePage = useUIStore((s) => s.activePage);
  const currentlyPlayingSlot = useAudioStore((s) => s.currentlyPlayingSlot);

  // Initialize wavesurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const pageConfig = PAGES.find((p) => p.index === activePage);
    const waveColor = pageConfig ? pageConfig.color : '#ffffff';

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: `${waveColor}80`, // 50% opacity
      progressColor: waveColor,
      cursorColor: waveColor,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 'auto',
      normalize: true,
      interact: false,
    });

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);

  // Update waveColor on page change
  useEffect(() => {
    if (wavesurferRef.current) {
      const pageConfig = PAGES.find((p) => p.index === activePage);
      if (pageConfig) {
        const waveColor = pageConfig.color;
        wavesurferRef.current.setOptions({
          waveColor: `${waveColor}80`,
          progressColor: waveColor,
          cursorColor: waveColor,
        });
      }
    }
  }, [activePage]);

  // Load selected file audio
  useEffect(() => {
    if (!wavesurferRef.current) return;
    
    if (selectedFile) {
      selectedFile.fileHandle.getFile().then((file) => {
        const url = URL.createObjectURL(file);
        wavesurferRef.current?.load(url).then(() => {
          URL.revokeObjectURL(url);
          wavesurferRef.current?.setVolume(0); // Mute so we don't hear it twice
          
          // If this file is currently playing, start the wavesurfer playhead
          const { currentlyPlayingSlot } = useAudioStore.getState();
          if (
            (selectedFile.originalSlotIndex !== -1 && currentlyPlayingSlot === selectedFile.originalSlotIndex - 1) ||
            currentlyPlayingSlot === -1 // unassigned file is playing
          ) {
            wavesurferRef.current?.play();
          }
        });
      });
    } else {
      wavesurferRef.current.empty();
    }
  }, [selectedFile]);

  // Sync playback state
  useEffect(() => {
    if (wavesurferRef.current) {
      if (currentlyPlayingSlot !== null) {
        // If a file is playing, and it matches the selected file, play the visualizer
        if (
          selectedFile && (
            (selectedFile.originalSlotIndex !== -1 && currentlyPlayingSlot === selectedFile.originalSlotIndex - 1) ||
            (currentlyPlayingSlot === -1) // we don't have a way to perfectly match unassigned files right now, but assuming it's the selected one
          )
        ) {
          // ensure it's loaded before playing, if it's already loaded, play will work
          wavesurferRef.current.play().catch(() => {});
        }
      } else {
        wavesurferRef.current.stop();
      }
    }
  }, [currentlyPlayingSlot, selectedFile]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <div className="w-full h-full" ref={containerRef} />
      {!selectedFile && (
        <div className="absolute inset-0 pointer-events-none" />
      )}
    </div>
  );
}
