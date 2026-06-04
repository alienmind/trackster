import { useEffect, useState } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { SCALE_MODES, ROOT_PAD_NAMES } from './scalesData';
import * as Icons from 'lucide-react';
import PianoKeyboard from './PianoKeyboard';

export default function ScalesDrawer() {
  const { deviceMode, activeRootNote, activeScaleType } = useCircuitTracksStore();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'description' | 'piano'>('description');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (deviceMode === 'scales') {
      timer = setTimeout(() => setIsOpen(true), 150);
    } else {
      setIsOpen(false);
    }
    return () => clearTimeout(timer);
  }, [deviceMode]);

  const scaleData = SCALE_MODES[activeScaleType];
  const rootName = ROOT_PAD_NAMES[activeRootNote] || 'C';

  const handleToggleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const track = e.currentTarget;
    track.setPointerCapture(e.pointerId);
    const rect = track.getBoundingClientRect();
    
    const updateMode = (clientY: number) => {
      const midPoint = rect.top + rect.height / 2;
      setViewMode(clientY < midPoint ? 'description' : 'piano');
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
             style={{ top: viewMode === 'description' ? '4px' : 'calc(100% - 20px)' }}
           />
        </div>
        
        <div className="flex flex-col justify-between h-16 py-0.5">
           <span 
             onClick={() => setViewMode('description')} 
             className={`text-[11px] font-bold cursor-pointer transition-colors ${viewMode === 'description' ? 'text-cyan-400 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
           >
             Mode Description
           </span>
           <span 
             onClick={() => setViewMode('piano')} 
             className={`text-[11px] font-bold cursor-pointer transition-colors ${viewMode === 'piano' ? 'text-cyan-400 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
           >
             Piano Keyboard
           </span>
        </div>
      </div>

      {scaleData && (
        <div className="flex flex-col items-center justify-start text-center max-w-[500px] mx-auto w-full h-full pt-6">
          <div className="flex items-center gap-3 mb-2 text-cyan-400">
            <Icons.Music size={28} />
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
              {rootName} {scaleData.name}
            </h2>
          </div>

          {/* Content Area - Vertically Centered */}
          <div className="flex-1 flex flex-col items-center justify-center w-full pb-8">
            {viewMode === 'description' ? (
              <p className="text-neutral-300 text-[15px] font-medium leading-relaxed px-8">
                {scaleData.description}
              </p>
            ) : (
              <div className="w-full flex justify-center">
                <PianoKeyboard />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Visual Drawer Handle */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/20" />
    </div>
  );
}
