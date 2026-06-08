import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import { Badge } from '../../Core/ui/badge';
import * as Icons from 'lucide-react';
import { buildFilename } from '../../../utils/fileNaming';

export default function PendingChangesPane() {
  const { slotsByPack, packSlots, undo, historyByPack, activePack, applyTagsToFilenames, workspaceMode, packs, packHistory, deviceMode } = useCircuitTracksStore();
  const openCommitDialog = useUIStore((s) => s.openCommitDialog);

  // Compute the totals shown in the badge. The detailed preview lives in the
  // Commit dialog; the header here just shows the count and opens that dialog.
  let totalChanges = 0;

  const packOccurrences = new Map<string, string[]>();
  for (const s of packSlots) {
    if (s.pack) {
      const to = `${s.index.toString().padStart(2, '0')}_${s.pack.displayName}`;
      if (!packOccurrences.has(s.pack.originalDirname)) packOccurrences.set(s.pack.originalDirname, []);
      packOccurrences.get(s.pack.originalDirname)!.push(to);
    }
  }

  for (const original of packs) {
    const occurrences = packOccurrences.get(original);
    if (!occurrences || occurrences.length === 0) {
      totalChanges++; // pack deletion
    } else {
      if (occurrences[0] !== original) {
        totalChanges++; // pack rename
      }
      totalChanges += occurrences.length - 1; // pack copies
    }
  }

  for (const packName in slotsByPack) {
    const slots = slotsByPack[packName];
    if (!slots) continue;
    for (const s of slots) {
      if (s.sample) {
        const ext = s.sample.originalFilename.split('.').pop() || 'wav';
        const shouldApplyTag = applyTagsToFilenames || s.sample.hasOriginalTagPrefix || s.index !== s.sample.originalSlotIndex;
        const to = buildFilename(s.index, s.sample.displayName, shouldApplyTag ? s.sample.tag : undefined, ext);
        if (s.sample.originalFilename !== to) {
          totalChanges++;
        }
      }
    }
  }

  const history = activePack ? historyByPack[activePack] || [] : [];
  const canUndo = deviceMode === 'packs' ? packHistory.length > 0 : history.length > 0;

  return (
    <div className="flex flex-col flex-none overflow-hidden bg-card border-b border-border">
      <button
        type="button"
        onClick={openCommitDialog}
        disabled={totalChanges === 0 || workspaceMode === 'read'}
        title={
          workspaceMode === 'read'
            ? 'Cannot commit in Read-Only Mode'
            : totalChanges === 0
              ? 'No pending changes'
              : 'Review and commit pending changes'
        }
        className="flex-none border-b border-border flex items-center justify-between px-4 h-14 bg-muted/30 w-full text-left transition-colors enabled:hover:bg-muted/60 enabled:cursor-pointer disabled:cursor-default"
      >
        <div className="flex items-center gap-2">
          <Icons.ListChecks size={16} className="text-primary" />
          <h2 className="font-semibold text-sm">Pending Changes</h2>
        </div>

        <div className="flex items-center gap-2">
          {totalChanges > 0 && (
            <Badge variant="default" className="h-5 px-1.5 min-w-[20px] flex items-center justify-center">
              {totalChanges}
            </Badge>
          )}
        </div>
      </button>

      <div className="p-4 border-b border-border flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={undo}
          disabled={!canUndo}
        >
          <Icons.Undo className="mr-2" size={14} />
          Undo
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 font-bold shadow-sm"
          onClick={openCommitDialog}
          disabled={totalChanges === 0 || workspaceMode === 'read'}
          title={workspaceMode === 'read' ? 'Cannot commit in Read-Only Mode' : ''}
        >
          <Icons.Save className="mr-2" size={14} />
          Commit
        </Button>
      </div>
    </div>
  );
}
