
import PianoKeyboard from '../Core/PianoKeyboard/PianoKeyboard';
import { useCircuitTracksStore } from '../../stores/useCircuitTracksStore';
import { getAllowedPads } from '../devices/Circuit/Scales/scalesData';
import { Button } from '../Core/ui/button';

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
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end bg-card border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-2xl pt-4 pb-6 px-8"
      style={{
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div className="flex justify-between items-center w-full max-w-2xl mb-4">
        <h3 className="text-card-foreground font-bold text-lg">Select Note Override</h3>
        <Button 
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          Close
        </Button>
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
        
        <div className="text-muted-foreground text-sm h-6">
          {selectedNoteName ? (
             <span>Overriding step with <strong className="text-primary">{selectedNoteName}</strong></span>
          ) : (
             <span>Click a key to override the sequence note</span>
          )}
        </div>
        
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => onNoteSelect(null)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Clear Override
        </Button>
      </div>
    </div>
  );
}
