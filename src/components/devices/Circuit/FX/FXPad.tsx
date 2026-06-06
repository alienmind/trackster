import { memo } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { FX_PRESETS } from './fxData';

interface FXPadProps {
  index: number;
}

const FXPad = memo(function FXPad({ index }: FXPadProps) {
  const fxIndex = index % 32;
  const preset = FX_PRESETS.find(p => p.id === fxIndex);

  const { activeDelayId, setActiveDelayId, activeReverbId, setActiveReverbId } = useCircuitTracksStore();

  const isActive = !!preset;
  const isDelay = preset?.type === 'delay';
  const isSelected = isDelay ? activeDelayId === fxIndex : activeReverbId === fxIndex;

  const colorClass = isActive 
    ? (isDelay 
        ? (isSelected ? 'bg-amber-500 text-amber-950 border border-amber-400' : 'bg-amber-400 text-amber-950 border border-amber-500/50 hover:bg-amber-300')
        : (isSelected ? 'bg-orange-500 text-orange-950 border border-orange-400' : 'bg-orange-400 text-orange-950 border border-orange-500/50 hover:bg-orange-300')
      )
    : 'bg-neutral-800 border border-neutral-700/50 text-white/20 opacity-30';

  const handleClick = () => {
    if (!preset) return;
    if (isDelay) {
      setActiveDelayId(fxIndex);
    } else {
      setActiveReverbId(fxIndex);
    }
  };

  return (
    <div
      onClick={handleClick}
      title={preset?.desc || "Unused in FX Selection"}
      className={`
        relative w-full aspect-square rounded-sm transition-all duration-75 cursor-default touch-none outline-none focus:outline-none group
        ${colorClass}
        ${isActive ? 'shadow-[inset_0_2px_10px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.5)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] active:translate-y-[2px] hover:brightness-110 cursor-pointer' : ''}
        ${isSelected ? 'ring-2 ring-white/50 brightness-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}
      `}
    >
      <div className={`absolute left-1.5 top-1.5 text-[9px] font-mono font-bold leading-none ${isActive ? 'text-black/50' : 'text-neutral-500'}`}>
        {fxIndex.toString().padStart(2, '0')}
      </div>
      
      {isActive && (
        <div className="flex h-full flex-col items-center justify-center pt-2 pointer-events-none">
          <div className="w-full text-center text-[10px] font-bold px-1 leading-tight drop-shadow-sm">
            {preset.title}
          </div>
        </div>
      )}
      {!isActive && (
        <div className="flex h-full flex-col items-center justify-center pointer-events-none">
           <div className="text-[9px] uppercase opacity-50 mt-2 text-center leading-none">Unused</div>
        </div>
      )}
    </div>
  );
});

export default FXPad;

