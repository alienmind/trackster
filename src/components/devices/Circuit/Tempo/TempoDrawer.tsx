import { useEffect, useState, useRef } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';

export default function TempoDrawer() {
  const { deviceMode, bpm, setBpm } = useCircuitTracksStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(bpm.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (deviceMode === 'tempo') {
      setInputValue(bpm.toString());
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 150);
    } else {
      setIsOpen(false);
    }
    return () => clearTimeout(timer);
  }, [deviceMode, bpm]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 999) {
      setBpm(parsed);
    }
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
      <div className="flex flex-col items-center justify-center w-full h-full pb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-cyan-400 drop-shadow-md mb-6">
          Tempo
        </h2>
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            className="w-48 bg-neutral-800 text-white text-7xl font-bold text-center rounded-xl border-2 border-cyan-500/50 focus:border-cyan-400 focus:outline-none p-4 shadow-inner"
          />
          <span className="text-neutral-500 font-bold mb-6 text-xl">BPM</span>
        </div>
        <p className="text-neutral-400 mt-6 max-w-sm">
          Type the exact tempo or tap any other function to close this drawer.
        </p>
      </div>
      
      {/* Visual Drawer Handle */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/20" />
    </div>
  );
}
