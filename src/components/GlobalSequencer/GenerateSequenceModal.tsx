import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../Core/ui/dialog';
import { Button } from '../Core/ui/button';
import { SequenceMode, ArpMode, getSequenceNoteForStep } from './sequenceUtils';
import { useSequencerStore } from '../../stores/useSequencerStore';

interface GenerateSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
}

export default function GenerateSequenceModal({ isOpen, onClose, trackId }: GenerateSequenceModalProps) {
  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('full');
  const [arpMode, setArpMode] = useState<ArpMode>('up');
  const [rollingBass, setRollingBass] = useState(false);
  const { patternSize, setStep } = useSequencerStore();

  const handleGenerate = () => {
    for (let i = 0; i < patternSize; i++) {
      let active = false;
      
      // Determine if step is active based on rolling bass or default behavior
      if (rollingBass) {
        // Continuous 16th notes
        active = true;
      } else {
        // Default sparse arpeggiator feel (e.g. active every 2nd or 4th step, or based on arpmode)
        // Let's just make it active on every 2nd step to sound rhythmic
        active = i % 2 === 0;
      }

      const note = getSequenceNoteForStep(i, sequenceMode, arpMode);
      setStep(trackId, i, active, note || "C");
    }
    
    // Clear the rest of the 64 steps if patternSize < 64
    for (let i = patternSize; i < 64; i++) {
      setStep(trackId, i, false, undefined);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Generate Sequence</DialogTitle>
          <DialogDescription>
            Generate a static pattern for this track based on the global Circuit Tracks scale.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Arp Type</label>
            <select 
              className="bg-muted border border-border text-foreground text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={arpMode}
              onChange={(e) => setArpMode(e.target.value as ArpMode)}
            >
              <option value="up">Up</option>
              <option value="up-down">Up-Down</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sequence Mode</label>
            <select 
              className="bg-muted border border-border text-foreground text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={sequenceMode}
              onChange={(e) => setSequenceMode(e.target.value as SequenceMode)}
            >
              <option value="full">Full Scale</option>
              <option value="1-3-5">1-3-5</option>
              <option value="1-3-5-7-9">1-3-5-7-9</option>
              <option value="1-3-5-7-9-11">1-3-5-7-9-11</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group mt-2">
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${rollingBass ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${rollingBass ? 'translate-x-5' : ''}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground transition-colors">Rolling Bass</span>
              <span className="text-[10px] text-muted-foreground">Continuous 16th notes</span>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={rollingBass} 
              onChange={(e) => setRollingBass(e.target.checked)} 
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
