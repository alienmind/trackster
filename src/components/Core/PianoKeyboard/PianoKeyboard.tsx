import { memo, useState } from 'react';
import { usePianoAudioStore } from '../../../stores/usePianoAudioStore';

const PIANO_KEYS = [
  { note: 'C', type: 'white', padIndex: 8 },
  { note: 'C#', type: 'black', padIndex: 1 },
  { note: 'D', type: 'white', padIndex: 9 },
  { note: 'D#', type: 'black', padIndex: 2 },
  { note: 'E', type: 'white', padIndex: 10 },
  { note: 'F', type: 'white', padIndex: 11 },
  { note: 'F#', type: 'black', padIndex: 4 },
  { note: 'G', type: 'white', padIndex: 12 },
  { note: 'G#', type: 'black', padIndex: 5 },
  { note: 'A', type: 'white', padIndex: 13 },
  { note: 'A#', type: 'black', padIndex: 6 },
  { note: 'B', type: 'white', padIndex: 14 },
];

function PianoKey({ 
  note, type, i, whiteIndex, 
  isAllowed, isActiveRoot, onClick
}: { 
  note: string, type: string, i: number, whiteIndex: number, 
  isAllowed: boolean, isActiveRoot: boolean, onClick?: () => void
}) {
  const [isPressed, setIsPressed] = useState(false);
  const { playNote, stopNote } = usePianoAudioStore();
  const isPlaying = usePianoAudioStore((s: any) => Object.keys(s.playingNodes).some(k => (parseInt(k, 10) - 1) % 12 === i));

  const handlePress = (e: React.PointerEvent) => {
    if (!isAllowed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPressed(true);
    playNote(i + 1);
    onClick?.();
  };

  const handleRelease = (e: React.PointerEvent) => {
    setIsPressed(false);
    stopNote(i + 1);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if pointer capture was already released
    }
  };

  const isWhite = type === 'white';
  const whiteKeyWidth = 44;
  const blackKeyWidth = 28;

  if (isWhite) {
    return (
      <div
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerCancel={handleRelease}
        className={`
          relative h-full border border-black/80 rounded-b-md mx-[1px] transition-all duration-100 flex flex-col justify-end pb-2 items-center
          ${isAllowed ? 'cursor-pointer hover:bg-neutral-100 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1)]' : 'opacity-30 cursor-not-allowed'}
          ${isActiveRoot ? 'bg-pink-100 border-pink-400' : 'bg-white'}
        `}
        style={{ 
          width: `${whiteKeyWidth}px`, 
          zIndex: 1,
          transformOrigin: 'top center',
          transform: (isPressed && isAllowed) || isPlaying ? 'scaleY(0.97)' : 'scaleY(1)',
          backgroundColor: (isPressed && isAllowed) || isPlaying ? '#fbcfe8' : undefined
        }}
      >
        <span className={`text-[10px] font-bold select-none ${isActiveRoot ? 'text-pink-600' : 'text-neutral-500'}`}>
          {note}
        </span>
        {isActiveRoot && <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1" />}
      </div>
    );
  } else {
    const leftPos = (whiteIndex * (whiteKeyWidth + 2)) - (blackKeyWidth / 2);
    return (
      <div
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerCancel={handleRelease}
        className={`
          absolute top-0 h-[65%] border border-black rounded-b flex flex-col justify-end pb-2 items-center transition-all duration-100
          ${isAllowed ? 'cursor-pointer hover:bg-neutral-700 shadow-[inset_0_-4px_10px_rgba(255,255,255,0.1)]' : 'opacity-30 cursor-not-allowed'}
          ${isActiveRoot ? 'bg-pink-900 border-pink-500' : 'bg-neutral-900'}
        `}
        style={{ 
          width: `${blackKeyWidth}px`, 
          left: `${leftPos}px`, 
          zIndex: 2,
          transformOrigin: 'top center',
          transform: (isPressed && isAllowed) || isPlaying ? 'scaleY(0.95)' : 'scaleY(1)',
          backgroundColor: (isPressed && isAllowed) || isPlaying ? '#db2777' : undefined
        }}
      >
         <span className={`text-[8px] font-bold select-none ${isActiveRoot ? 'text-pink-300' : 'text-neutral-400'}`}>
          {note}
        </span>
        {isActiveRoot && <div className="w-1 h-1 rounded-full bg-pink-500 mt-1" />}
      </div>
    );
  }
}

export interface PianoKeyboardProps {
  allowedPads: number[];
  activeRootNote: number;
  selectedNoteIndex?: number | null; // Provide an index (0-11) if a note is currently selected
  onKeyClick?: (noteIndex: number, noteName: string) => void;
}

export default memo(function PianoKeyboard({ 
  allowedPads, 
  activeRootNote,
  selectedNoteIndex = null,
  onKeyClick
}: PianoKeyboardProps) {
  return (
    <div className="relative flex justify-center items-start mt-2 h-[120px] select-none touch-none">
      {PIANO_KEYS.map((key, i) => {
        const whiteIndex = PIANO_KEYS.slice(0, i).filter(k => k.type === 'white').length;
        
        return (
          <PianoKey
            key={key.note}
            note={key.note}
            type={key.type}
            i={i}
            whiteIndex={whiteIndex}
            isAllowed={allowedPads.includes(key.padIndex)}
            isActiveRoot={key.padIndex === activeRootNote || i === selectedNoteIndex}
            onClick={() => onKeyClick?.(i, key.note)}
          />
        );
      })}
    </div>
  );
});
