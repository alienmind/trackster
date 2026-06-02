import { useEffect, useRef } from 'react';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import { ScrollArea } from '../../Core/ui/scroll-area';
import { Badge } from '../../Core/ui/badge';
import * as Icons from 'lucide-react';
import { buildFilename } from '../../../utils/fileNaming';

export default function PendingChangesPane() {
  const { slotsByPack, packSlots, undo, historyByPack, activePack, applyTagsToFilenames, workspaceMode } = useCircuitTracksStore();
  const openCommitDialog = useUIStore((s) => s.openCommitDialog);
  const isCollapsed = useUIStore((s) => s.isRightPaneCollapsed);

  // Compute all rename plans to show in the UI
  const packRenames = [];
  let totalSampleRenames = 0;
  const sampleRenamesByPack: Record<string, any[]> = {};

  for (const s of packSlots) {
    if (s.pack) {
      const to = `${s.index.toString().padStart(2, '0')}_${s.pack.displayName}`;
      if (s.pack.originalDirname !== to) {
        packRenames.push({ from: s.pack.originalDirname, to });
      }
    }
  }

  for (const packName in slotsByPack) {
    const slots = slotsByPack[packName];
    if (!slots) continue;
    const renames = [];
    for (const s of slots) {
      if (s.sample) {
        const ext = s.sample.originalFilename.split('.').pop() || 'wav';
        const shouldApplyTag = applyTagsToFilenames || s.sample.hasOriginalTagPrefix || s.index !== s.sample.originalSlotIndex;
        const to = buildFilename(s.index, s.sample.displayName, shouldApplyTag ? s.sample.tag : undefined, ext);
        if (s.sample.originalFilename !== to) {
          renames.push({ from: s.sample.originalFilename, to });
        }
      }
    }
    if (renames.length > 0) {
      sampleRenamesByPack[packName] = renames;
      totalSampleRenames += renames.length;
    }
  }

  const totalChanges = packRenames.length + totalSampleRenames;
  const history = activePack ? historyByPack[activePack] || [] : [];
  const canUndo = history.length > 0;

  const prevTotalChanges = useRef(totalChanges);
  const setRightPaneCollapsed = useUIStore((s) => s.setRightPaneCollapsed);

  useEffect(() => {
    if (prevTotalChanges.current === 0 && totalChanges > 0) {
      if (isCollapsed && setRightPaneCollapsed) setRightPaneCollapsed(false);
    } else if (prevTotalChanges.current > 0 && totalChanges === 0) {
      if (!isCollapsed && setRightPaneCollapsed) setRightPaneCollapsed(true);
    }
    prevTotalChanges.current = totalChanges;
  }, [totalChanges, isCollapsed, setRightPaneCollapsed]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card border-b border-border">
      <div className="flex-none border-b border-border flex items-center justify-between px-4 h-14 bg-muted/30">
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
      </div>

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
          variant="default"
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

      <ScrollArea className="flex-1">
        {totalChanges === 0 ? (
          <div className="p-8 text-center flex flex-col items-center text-muted-foreground">
            <Icons.CheckCircle2 className="mb-3 opacity-20" size={32} />
            <p className="text-sm">No pending changes.</p>
            <p className="text-xs mt-1 opacity-70">Move or rename packs and samples to see changes here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {packRenames.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Folder size={12} /> Pack Renames
                </h3>
                <ul className="space-y-2">
                  {packRenames.map((r, i) => (
                    <li key={i} className="text-sm bg-muted/50 p-2 rounded-md border border-border">
                      <div className="text-xs text-muted-foreground line-through opacity-70">{r.from}</div>
                      <div className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                        <Icons.ArrowRight size={10} className="text-primary" /> {r.to}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.entries(sampleRenamesByPack).map(([packName, renames]) => (
              <div key={packName} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.FolderOpen size={12} /> {packName} Samples
                </h3>
                <ul className="space-y-2">
                  {renames.map((r, i) => (
                    <li key={i} className="text-sm bg-muted/50 p-2 rounded-md border border-border">
                      <div className="text-xs text-muted-foreground line-through opacity-70">{r.from}</div>
                      <div className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                        <Icons.ArrowRight size={10} className="text-primary" /> {r.to}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
