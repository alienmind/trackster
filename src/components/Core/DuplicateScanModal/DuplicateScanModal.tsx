import { useState, useEffect } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import type { SampleFile } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../Core/ui/dialog';
import { Button } from '../../Core/ui/button';
import { ScrollArea } from '../../Core/ui/scroll-area';

export default function DuplicateScanModal() {
  const isDuplicateModalOpen = useUIStore((s) => s.isDuplicateModalOpen);
  const duplicateClusters = useUIStore((s) => s.duplicateClusters);
  const closeDuplicateModal = useUIStore((s) => s.closeDuplicateModal);
  const removeFile = useCircuitTracksStore((s) => s.removeFile);
  const assignToSlot = useCircuitTracksStore((s) => s.assignToSlot);
  const playSlot = useCircuitTracksStore((s) => s.playSlot);

  // Store the selected originalFilename for each cluster index
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [localClusters, setLocalClusters] = useState<SampleFile[][]>([]);

  // Initialize selections when modal opens
  useEffect(() => {
    if (isDuplicateModalOpen && duplicateClusters.length > 0) {
      const initialSelections: Record<number, string> = {};
      duplicateClusters.forEach((cluster, index) => {
        if (cluster.length > 0) {
          initialSelections[index] = cluster[0]!.originalFilename;
        }
      });
      setSelections(initialSelections);
      setLocalClusters(duplicateClusters);
    } else if (!isDuplicateModalOpen) {
      setLocalClusters([]);
    }
  }, [isDuplicateModalOpen, duplicateClusters]);

  const handleRemoveFromCluster = (clusterIndex: number, originalFilename: string) => {
    setLocalClusters(prev => {
      const newClusters = [...prev];
      const cluster = newClusters[clusterIndex]!;
      const filtered = cluster.filter(s => s.originalFilename !== originalFilename);

      if (filtered.length < 2) {
        // If less than 2 items remain, it's no longer a duplicate cluster
        newClusters.splice(clusterIndex, 1);

        // Fix selections index shifting
        setSelections(prevSel => {
          const newSel: Record<number, string> = {};
          newClusters.forEach((c, idx) => {
            newSel[idx] = prevSel[idx >= clusterIndex ? idx + 1 : idx] || c[0]!.originalFilename;
          });
          return newSel;
        });
      } else {
        newClusters[clusterIndex] = filtered;
        // If we removed the selected one, select the first one
        if (selections[clusterIndex] === originalFilename) {
          setSelections(prevSel => ({
            ...prevSel,
            [clusterIndex]: filtered[0]!.originalFilename
          }));
        }
      }
      return newClusters;
    });
  };

  const handleApply = () => {
    localClusters.forEach((cluster, index) => {
      const keptFilename = selections[index];

      cluster.forEach((sample) => {
        if (sample.originalFilename === keptFilename) {
          // If it's the kept file, move it to the staging area (-1 slot)
          assignToSlot(sample, -1);
        } else {
          // If it's a discarded file, remove it from the workspace
          removeFile(sample);
        }
      });
    });

    closeDuplicateModal();
    useUIStore.getState().addNotification({
      type: 'success',
      message: 'Duplicates resolved and kept files moved to Staging Area.',
      autoDismissMs: 3000
    });
  };

  return (
    <Dialog open={isDuplicateModalOpen} onOpenChange={(open) => !open && closeDuplicateModal()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Resolve Duplicates</DialogTitle>
          <DialogDescription>
            We found {localClusters.length} group(s) of similar files that can be potentially be removed.
            Choose which one to keep in each group. The kept file will be moved to the Staging Area,
            and the rest will be removed from your workspace. After applying, you should click on
            <strong>Magic Sort</strong> to automatically rearrange the staged files into the available slots.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4 mt-2">
          <div className="space-y-6">
            {localClusters.map((cluster, index) => (
              <div key={index} className="border border-border rounded-md p-4 bg-background">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Cluster {index + 1} ({cluster.length} files)
                </h3>
                <div className="space-y-2">
                  {cluster.map((sample) => {
                    const isSelected = selections[index] === sample.originalFilename;
                    return (
                      <div
                        key={sample.originalFilename}
                        className={`flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer border ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}
                        onClick={() => {
                          setSelections({ ...selections, [index]: sample.originalFilename });
                          playSlot(-1, sample.fileHandle);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="font-mono text-sm">{sample.displayName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {(sample.size / 1024).toFixed(1)} KB
                          </span>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromCluster(index, sample.originalFilename);
                            }}
                          >
                            Not a duplicate
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 border-t border-border pt-4">
          <Button variant="default" onClick={closeDuplicateModal}>Cancel</Button>
          <Button onClick={handleApply}>Apply Resolutions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
