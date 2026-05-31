import { useEffect, useState } from 'react';
import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import { useUIStore } from '../../../stores/useUIStore';
import type { RenamePlan } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../Core/ui/dialog';
import { Button } from '../../Core/ui/button';
import { ScrollArea } from '../../Core/ui/scroll-area';

export default function CommitDialog() {
  const isCommitDialogOpen = useUIStore((s) => s.isCommitDialogOpen);
  const closeCommitDialog = useUIStore((s) => s.closeCommitDialog);
  const commitChanges = useFileSystemStore((s) => s.commitChanges);
  const executeRenamePlan = useFileSystemStore((s) => s.executeRenamePlan);
  
  const [plan, setPlan] = useState<RenamePlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isCommitDialogOpen) {
      commitChanges().then(setPlan);
    } else {
      setPlan(null);
    }
  }, [isCommitDialogOpen, commitChanges]);

  const handleExecute = async () => {
    if (!plan) return;
    setIsExecuting(true);
    await executeRenamePlan(plan);
    setIsExecuting(false);
    closeCommitDialog();
  };

  return (
    <Dialog open={isCommitDialogOpen} onOpenChange={(open) => !open && closeCommitDialog()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-xl font-bold">Review Changes</DialogTitle>
          {plan && (
            <span className="bg-secondary px-3 py-1 rounded-full text-sm font-mono shrink-0">
              {plan.operations.length} operations
            </span>
          )}
        </DialogHeader>
        
        <ScrollArea className="mt-4 border border-border rounded-md flex-1 min-h-0">
          <div className="p-4 space-y-2">
            {!plan || plan.operations.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">No changes to commit.</div>
            ) : (
              plan.operations.map((op, i) => (
                <div key={i} className="flex items-center space-x-4 bg-muted p-3 rounded text-sm font-mono border border-border min-w-0">
                  <div className="flex-1 text-destructive line-through opacity-80 truncate" title={op.from}>{op.from}</div>
                  <div className="text-muted-foreground shrink-0">→</div>
                  <div className="flex-1 text-green-500 truncate" title={op.to}>{op.to}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-6">
          <Button
            variant="default"
            onClick={closeCommitDialog}
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={isExecuting || !plan || plan.operations.length === 0}
            className="bg-primary hover:bg-primary hover:brightness-110 text-white font-bold"
          >
            {isExecuting ? 'Executing...' : 'Execute Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
