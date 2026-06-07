import { useEffect, useState } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { usePianoAudioStore } from '../../../../stores/usePianoAudioStore';
import { SCALE_MODES, ROOT_PAD_NAMES } from './scalesData';
import * as Icons from 'lucide-react';
import PianoKeyboard from '../../../Core/PianoKeyboard/PianoKeyboard';
import { getAllowedPads } from './scalesData';

export default function ScalesDrawer() {
  const { 
    deviceMode, activeRootNote, activeScaleType, 
    scalesViewMode, setScalesViewMode,
    previewSustain, setPreviewSustain
  } = useCircuitTracksStore();
  const { isLoadingAudio, initAudio, stopPreview } = usePianoAudioStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (deviceMode === 'scales') {
      timer = setTimeout(() => {
        setIsOpen(true);
        initAudio();
      }, 150);
    } else {
      setIsOpen(false);
      stopPreview();
    }
    return () => {
      clearTimeout(timer);
      stopPreview();
    };
  }, [deviceMode, initAudio, stopPreview]);

  const scaleData = SCALE_MODES[activeScaleType];
  const rootName = ROOT_PAD_NAMES[activeRootNote] || 'C';

  const handleToggleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const track = e.currentTarget;
    track.setPointerCapture(e.pointerId);
    const rect = track.getBoundingClientRect();
    
    const updateMode = (clientY: number) => {
      const midPoint = rect.top + rect.height / 2;
      setScalesViewMode(clientY < midPoint ? 'description' : 'piano');
    };
    
    updateMode(e.clientY);
    
    const onMove = (moveEvent: PointerEvent) => updateMode(moveEvent.clientY);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };



  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-end bg-neutral-900 border-b border-neutral-700 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-2xl pt-4 pb-6 px-8"
      style={{
        height: '264px',
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Left Vertical Toggle */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-4">
        <div 
          className="relative w-6 h-16 bg-neutral-800/80 rounded-full border border-white/5 shadow-inner p-1 cursor-ns-resize touch-none"
          onPointerDown={handleToggleDrag}
        >
           <div 
             className="absolute left-1 w-4 h-4 bg-cyan-500 rounded-full shadow-md transition-all duration-300 ease-out"
             style={{ top: scalesViewMode === 'description' ? '4px' : 'calc(100% - 20px)' }}
           />
        </div>
        
        <div className="flex flex-col justify-between h-16 py-0.5">
           <span 
             onClick={() => setScalesViewMode('description')} 
             className={`text-[11px] font-bold cursor-pointer transition-colors ${scalesViewMode === 'description' ? 'text-cyan-400 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
           >
             Mode Description
           </span>
           <span 
             onClick={() => setScalesViewMode('piano')} 
             className={`text-[11px] font-bold cursor-pointer transition-colors ${scalesViewMode === 'piano' ? 'text-cyan-400 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
           >
             Piano Keyboard
           </span>
        </div>
      </div>


      {scaleData && (
        <div className="flex flex-col items-center justify-start text-center max-w-[500px] mx-auto w-full h-full pt-6 relative">
          
          {scalesViewMode === 'piano' && isLoadingAudio && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm rounded-lg border border-neutral-800 mt-12 mb-4 pointer-events-none">
              <div className="flex items-center gap-2 text-pink-400 font-bold bg-neutral-900/80 px-4 py-2 rounded-full shadow-lg">
                <Icons.Loader2 size={16} className="animate-spin" />
                <span>Loading Piano Engine...</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-2 text-cyan-400">
            <Icons.Music size={28} />
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
              {rootName} {scaleData.name}
            </h2>
          </div>

          {/* Content Area - Vertically Centered */}
          <div className="flex-1 flex flex-col items-center justify-center w-full pb-8">
            {scalesViewMode === 'description' ? (
              <p className="text-neutral-300 text-[15px] font-medium leading-relaxed px-16">
                {scaleData.description}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full flex justify-center">
                  <PianoKeyboard 
                    activeRootNote={activeRootNote} 
                    allowedPads={getAllowedPads(activeRootNote, activeScaleType)}
                  />
                </div>
                
                {/* Sustain Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400">SUSTAIN</span>
                  <div 
                    className="relative w-16 h-6 bg-neutral-800/80 rounded-full border border-white/5 shadow-inner cursor-pointer"
                    onClick={() => setPreviewSustain(previewSustain === 'on' ? 'off' : 'on')}
                  >
                     <div 
                       className={`absolute top-0.5 bottom-0.5 w-[30px] rounded-full shadow-md transition-all duration-300 ease-out ${previewSustain === 'on' ? 'bg-pink-500 left-[calc(100%-32px)]' : 'bg-neutral-600 left-0.5'}`}
                     />
                     <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                       <span className={`text-[8px] font-bold z-10 ${previewSustain === 'off' ? 'text-white' : 'text-neutral-500'}`}>OFF</span>
                       <span className={`text-[8px] font-bold z-10 ${previewSustain === 'on' ? 'text-white' : 'text-neutral-500'}`}>ON</span>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
