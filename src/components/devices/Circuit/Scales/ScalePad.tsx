import { memo } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { usePianoAudioStore } from '../../../../stores/usePianoAudioStore';
import { DISABLED_ROOT_PADS, ROOT_PAD_NAMES, SCALE_MODES, getAllowedPads, CHROMATIC_PADS } from './scalesData';

interface ScalePadProps {
  index: number;
}

const ScalePad = memo(function ScalePad({ index }: ScalePadProps) {
  const { activeRootNote, setActiveRootNote, activeScaleType, setActiveScaleType } = useCircuitTracksStore();
  const { playPreview } = usePianoAudioStore();

  const isRootSection = index < 16;
  const isScaleSection = index >= 16;

  // Root section logic
  const isDisabledRoot = isRootSection && DISABLED_ROOT_PADS.includes(index);
  const isAllowedRoot = isRootSection && !isDisabledRoot;
  const isActiveRoot = isRootSection && index === activeRootNote;
  
  // Scale section logic
  const scaleData = isScaleSection ? SCALE_MODES[index] : null;
  const isActiveScale = isScaleSection && index === activeScaleType;
  
  // Note allowance logic
  const allowedPads = getAllowedPads(activeRootNote, activeScaleType);
  const isNoteInScale = isRootSection && allowedPads.includes(index);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRootSection && isAllowedRoot) {
      (e.target as Element).setPointerCapture(e.pointerId);
      setActiveRootNote(index);
      
      const rootIdx = CHROMATIC_PADS.indexOf(index);
      const scale = SCALE_MODES[activeScaleType];
      if (rootIdx !== -1 && scale) {
        playPreview(rootIdx, scale.intervals);
      }
    } else if (isScaleSection && scaleData) {
      setActiveScaleType(index);
      
      const rootIdx = CHROMATIC_PADS.indexOf(activeRootNote);
      if (rootIdx !== -1) {
        playPreview(rootIdx, scaleData.intervals);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isRootSection && isAllowedRoot) {
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  // Determine appearance
  let bgClass = 'bg-neutral-800 border-dashed border-neutral-700/50 text-white/50 opacity-50';
  let innerText = '';
  let shadowClass = '';
  
  if (isRootSection) {
    if (!isDisabledRoot) {
      innerText = ROOT_PAD_NAMES[index] || '';
      if (isActiveRoot) {
        bgClass = 'bg-pink-500 text-white font-bold brightness-125 border-2 border-white z-10';
        shadowClass = 'shadow-[0_0_15px_rgba(236,72,153,0.8),inset_0_0_10px_rgba(255,255,255,0.6)]';
      } else if (isNoteInScale) {
        bgClass = 'bg-pink-900/80 text-pink-200 border border-pink-700/50';
        shadowClass = 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]';
      } else {
        bgClass = 'bg-neutral-800 text-neutral-400 border border-neutral-700';
      }
    }
  } else if (isScaleSection && scaleData) {
    innerText = scaleData.name;
    if (isActiveScale) {
      bgClass = 'bg-cyan-500 text-white font-bold brightness-125 border-2 border-white z-10';
      shadowClass = 'shadow-[0_0_15px_rgba(6,182,212,0.8),inset_0_0_10px_rgba(255,255,255,0.6)]';
    } else {
      bgClass = 'bg-cyan-900/50 text-cyan-200 border border-cyan-800/50';
      shadowClass = 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]';
    }
  }

  const isClickable = (isRootSection && isAllowedRoot) || (isScaleSection && scaleData);

  return (
    <div
      onPointerDown={isClickable ? handlePointerDown : undefined}
      onPointerUp={isClickable ? handlePointerUp : undefined}
      onPointerCancel={isClickable ? handlePointerUp : undefined}
      className={`
        relative w-full aspect-square rounded-sm transition-all duration-150 outline-none focus:outline-none flex flex-col items-center justify-center p-1 text-center leading-tight touch-none
        ${bgClass}
        ${shadowClass}
        ${isClickable ? 'cursor-pointer hover:brightness-110 active:translate-y-[2px] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]' : 'cursor-default pointer-events-none'}
      `}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${isRootSection ? 'text-pink-300/40' : 'text-cyan-300/40'}`}>
        {index.toString().padStart(2, '0')}
      </div>
      
      {innerText && (
        <span className="text-[11px] md:text-[13px] font-bold drop-shadow-md select-none mt-2 pointer-events-none">
          {innerText}
        </span>
      )}
    </div>
  );
});

export default ScalePad;
