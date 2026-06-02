import { useEffect, useRef } from 'react';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import { ScrollArea } from '../../Core/ui/scroll-area';
import { Badge } from '../../Core/ui/badge';
import * as Icons from 'lucide-react';
import { buildFilename } from '../../../utils/fileNaming';
import { cn } from '../../../lib/utils';

export default function PendingChangesPane() {
  const { slotsByPack, packSlots, undo, historyByPack, activePack, applyTagsToFilenames, workspaceMode } = useCircuitTracksStore();
  const openCommitDialog = useUIStore((s) => s.openCommitDialog);
  const isCollapsed = useUIStore((s) => s.isRightPaneCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleRightPane);

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
    <>
      {/* Mobile Floating Toggle Button */}
      <div className="md:hidden absolute top-4 right-4 z-50">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleCollapse}
          className="rounded-full shadow-xl bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 relative h-10 w-10"
        >
          {!isCollapsed ? (
            <Icons.X size={20} />
          ) : (
            <>
              <Icons.ListChecks size={20} />
              {totalChanges > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-neutral-900">
                  {totalChanges}
                </span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={toggleCollapse}
        />
      )}

      {/* Main Drawer Container */}
      <div className={cn(
        "bg-card flex flex-col h-full overflow-hidden flex-none transition-all duration-300 ease-in-out z-40",
        "border-l border-border md:relative",
        isCollapsed 
          ? "hidden md:flex md:w-16" 
          : "absolute right-0 top-0 bottom-0 w-80 md:w-80 max-w-[85vw] shadow-2xl md:shadow-none animate-in slide-in-from-right md:animate-none pt-16 md:pt-0"
      )}>
        <div className={cn(
          "flex-none border-b border-border flex items-center bg-muted/30",
          isCollapsed ? "flex-col justify-center gap-2 py-4 h-auto" : "justify-between px-4 h-14"
        )}>
        <div className="flex items-center gap-2">
          <Icons.ListChecks size={16} className={cn("text-primary", isCollapsed && "mb-2")} />
          {!isCollapsed && <h2 className="font-semibold text-sm">Pending Changes</h2>}
        </div>
        
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "gap-2")}>
          {totalChanges > 0 && (
            <Badge variant="default" className="h-5 px-1.5 min-w-[20px] flex items-center justify-center">
              {totalChanges}
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse}
            className="flex-none h-8 w-8 hidden md:flex"
          >
            {isCollapsed ? <Icons.PanelRightOpen size={16} /> : <Icons.PanelRightClose size={16} />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>

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
      </>
      )}
      </div>
    </>
  );
}
