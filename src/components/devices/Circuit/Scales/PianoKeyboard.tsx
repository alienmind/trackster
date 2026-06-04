import { memo } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { getAllowedPads } from './scalesData';

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

export default memo(function PianoKeyboard() {
  const { activeRootNote, activeScaleType, setActiveRootNote } = useCircuitTracksStore();
  const allowedPads = getAllowedPads(activeRootNote, activeScaleType);

  return (
    <div className="relative flex justify-center items-start mt-2 h-[120px] select-none">
      {PIANO_KEYS.map((key, i) => {
        const isWhite = key.type === 'white';
        const isAllowed = allowedPads.includes(key.padIndex);
        const isActiveRoot = key.padIndex === activeRootNote;

        // Position calculations for black keys
        // White keys are laid out with flex, black keys are absolute.
        // We have 7 white keys. Let's say each white key is 40px wide.
        const whiteKeyWidth = 44;
        const blackKeyWidth = 28;
        
        // Find which white key this black key follows
        const whiteIndex = PIANO_KEYS.slice(0, i).filter(k => k.type === 'white').length;
        
        if (isWhite) {
          return (
            <div
              key={key.note}
              onClick={() => isAllowed && setActiveRootNote(key.padIndex)}
              className={`
                relative h-full border border-black/80 rounded-b-md mx-[1px] transition-all duration-200 flex flex-col justify-end pb-2 items-center
                ${isAllowed ? 'cursor-pointer hover:bg-neutral-100 active:bg-neutral-300 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1)]' : 'opacity-30 cursor-not-allowed'}
                ${isActiveRoot ? 'bg-pink-100 border-pink-400' : 'bg-white'}
              `}
              style={{ width: `${whiteKeyWidth}px`, zIndex: 1 }}
            >
              <span className={`text-[10px] font-bold ${isActiveRoot ? 'text-pink-600' : 'text-neutral-500'}`}>
                {key.note}
              </span>
              {isActiveRoot && <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1" />}
            </div>
          );
        } else {
          // Black key
          const leftPos = (whiteIndex * (whiteKeyWidth + 2)) - (blackKeyWidth / 2);
          return (
            <div
              key={key.note}
              onClick={() => isAllowed && setActiveRootNote(key.padIndex)}
              className={`
                absolute top-0 h-[65%] border border-black rounded-b flex flex-col justify-end pb-2 items-center transition-all duration-200
                ${isAllowed ? 'cursor-pointer hover:bg-neutral-700 active:bg-neutral-600 shadow-[inset_0_-4px_10px_rgba(255,255,255,0.1)]' : 'opacity-30 cursor-not-allowed'}
                ${isActiveRoot ? 'bg-pink-900 border-pink-500' : 'bg-neutral-900'}
              `}
              style={{ width: `${blackKeyWidth}px`, left: `${leftPos}px`, zIndex: 2 }}
            >
               <span className={`text-[8px] font-bold ${isActiveRoot ? 'text-pink-300' : 'text-neutral-400'}`}>
                {key.note}
              </span>
              {isActiveRoot && <div className="w-1 h-1 rounded-full bg-pink-500 mt-1" />}
            </div>
          );
        }
      })}
    </div>
  );
});
