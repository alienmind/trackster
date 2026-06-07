
import PianoKeyboard from '../Core/PianoKeyboard/PianoKeyboard';
import { useCircuitTracksStore } from '../../stores/useCircuitTracksStore';
import { getAllowedPads } from '../devices/Circuit/Scales/scalesData';

interface PianoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteSelect: (note: string | null) => void;
  selectedNoteName: string | null;
}

export default function PianoDrawer({ isOpen, onClose, onNoteSelect, selectedNoteName }: PianoDrawerProps) {
  const { activeRootNote, activeScaleType } = useCircuitTracksStore();
  const allowedPads = getAllowedPads(activeRootNote, activeScaleType);

  // We could map the selectedNoteName to an index if needed, but the PianoKeyboard might just highlight it.
  // We'll let PianoKeyboard handle selection. For now, we just pass the allowed pads.

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end bg-neutral-900 border-t border-neutral-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-2xl pt-4 pb-6 px-8"
      style={{
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div className="flex justify-between items-center w-full max-w-2xl mb-4">
        <h3 className="text-white font-bold text-lg">Select Note Override</h3>
        <button 
          onClick={onClose}
          className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded text-sm transition-colors"
        >
          Close
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="w-full flex justify-center">
          <PianoKeyboard 
            activeRootNote={activeRootNote} 
            allowedPads={allowedPads}
            onKeyClick={(_, noteName) => {
              if (selectedNoteName === noteName) {
                // Toggle off
                onNoteSelect(null);
              } else {
                onNoteSelect(noteName);
              }
            }}
          />
        </div>
        
        <div className="text-neutral-400 text-sm h-6">
          {selectedNoteName ? (
             <span>Overriding step with <strong className="text-pink-400">{selectedNoteName}</strong></span>
          ) : (
             <span>Click a key to override the sequence note</span>
          )}
        </div>
        
        <button 
          onClick={() => onNoteSelect(null)}
          className="text-neutral-300 hover:text-pink-400 text-xs transition-colors"
        >
          Clear Override
        </button>
      </div>
    </div>
  );
}
