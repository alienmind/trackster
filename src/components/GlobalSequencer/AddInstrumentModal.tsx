import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Core/ui/dialog';
import { Button } from '../Core/ui/button';
import { useOverviewStore } from '../../stores/useOverviewStore';
import { useSequencerStore } from '../../stores/useSequencerStore';
import { HARDWARE_LIBRARY } from '../../devices';
import { useState } from 'react';
import { getAssignableChannelKeys } from './sequenceUtils';


interface AddInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInstrumentModal({ isOpen, onClose }: AddInstrumentModalProps) {
  const overviewStore = useOverviewStore();
  const { trackAssignments, addTrack } = useSequencerStore();
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  const assignedSet = new Set(Object.values(trackAssignments).filter(Boolean));

  // Build options
  const options: { value: string; label: string }[] = [];
  
  Object.values(overviewStore.nodes)
    .filter(n => n.type !== 'daw' && n.type !== 'flow8')
    .forEach(node => {
      const blueprint = HARDWARE_LIBRARY[node.type];
      const model = blueprint?.model || node.type;

      getAssignableChannelKeys(node, blueprint).forEach(channelKey => {
        const val = `${node.id}:${channelKey}`;
        if (!assignedSet.has(val)) {
          options.push({
            value: val,
            label: `${model} (${channelKey})`
          });
        }
      });
    });


  const handleAdd = () => {
    if (selectedAssignment) {
      addTrack(selectedAssignment);
      onClose();
      setSelectedAssignment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>Add Instrument Track</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <label className="text-sm font-medium">Select Instrument Channel</label>
          {options.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No available instruments to assign.</div>
          ) : (
            <select
              className="bg-background border border-border rounded text-sm p-2 w-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              <option value="" disabled>-- Select an instrument --</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!selectedAssignment} onClick={handleAdd}>Add Track</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
