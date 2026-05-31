import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Core/ui/tooltip';
import { useDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { del } from 'idb-keyval';
import DisclaimerModal from '../../Core/DisclaimerModal/DisclaimerModal';
import { useOverviewStore, DEFAULT_NODES, DEFAULT_CONNECTIONS, DEFAULT_LOGICAL_CONNECTIONS } from '../../../stores/useOverviewStore';

export default function Toolbar() {
  const { rootHandle, activePack, workspaceMode, setWorkspaceMode } = useFileSystemStore();
  const { activeMainView, setActiveMainView } = useUIStore();
  
  const resetLayout = useOverviewStore(s => s.resetLayout);
  const autoArrange = useOverviewStore(s => s.autoArrange);
  const saveLayout = useOverviewStore(s => s.saveLayout);
  const copyLayout = useOverviewStore(s => s.copyLayout);
  const routingMode = useOverviewStore(s => s.routingMode);
  const setRoutingMode = useOverviewStore(s => s.setRoutingMode);

  const hasPack = !!activePack;
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const { isOver: isOverPacks, setNodeRef: setPacksRef } = useDroppable({
    id: 'view-switcher-packs',
  });

  const { isOver: isOverSamples, setNodeRef: setSamplesRef } = useDroppable({
    id: 'view-switcher-samples',
  });

  useEffect(() => {
    if (sessionStorage.getItem('autoOpenDisclaimer') === 'true') {
      sessionStorage.removeItem('autoOpenDisclaimer');
      setIsDisclaimerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isOverPacks && activeMainView !== 'packs') {
      const t = setTimeout(() => setActiveMainView('packs'), 500);
      return () => clearTimeout(t);
    }
  }, [isOverPacks, activeMainView, setActiveMainView]);

  useEffect(() => {
    if (isOverSamples && hasPack && activeMainView !== 'samples') {
      const t = setTimeout(() => setActiveMainView('samples'), 500);
      return () => clearTimeout(t);
    }
  }, [isOverSamples, hasPack, activeMainView, setActiveMainView]);

  return (
    <div className="flex flex-col flex-none w-full border-b border-border bg-card">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">


          <div className="flex bg-muted p-1 rounded-md">
            <button
              onClick={() => setActiveMainView('overview')}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'overview' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => rootHandle && setActiveMainView('packs')}
              disabled={!rootHandle}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                (activeMainView === 'packs' || activeMainView === 'samples') ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
            >
              Circuit Tracks
            </button>
          </div>

          {(activeMainView === 'packs' || activeMainView === 'samples') && (
            <Tooltip>
              <TooltipTrigger className="focus:outline-none ml-2">
                <Button
                  variant="default"
                  onClick={() => setIsDisclaimerOpen(true)}
                  className="font-semibold shadow-md"
                >
                  <Icons.HardDrive className="mr-2" size={16} />
                  Mount SD Card
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Select the root directory of your SD Card (or the 'Tracks' folder directly).
              </TooltipContent>
            </Tooltip>
          )}
          
          {rootHandle && workspaceMode && (activeMainView === 'packs' || activeMainView === 'samples') && (
            <div className="flex items-center ml-2">
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className={clsx(
                      "font-bold",
                      workspaceMode === 'read' ? "text-green-600 border-green-600 hover:bg-green-50" : "text-destructive border-destructive hover:bg-destructive/10"
                    )}
                    onClick={async () => {
                      if (workspaceMode === 'read') {
                        if (window.confirm("Switch to Read/Write mode? This is dangerous and allows modifying files on the SD card.")) {
                          await setWorkspaceMode('readwrite');
                        }
                      } else {
                        await setWorkspaceMode('read');
                      }
                    }}
                  >
                    {workspaceMode === 'read' ? (
                      <><Icons.ShieldCheck className="mr-2 h-4 w-4" /> Read-Only</>
                    ) : (
                      <><Icons.AlertTriangle className="mr-2 h-4 w-4" /> Read/Write</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {workspaceMode === 'read' 
                    ? "Currently in safe Read-Only mode. Click to enable Write access." 
                    : "Currently in dangerous Read/Write mode. Click to switch to safe Read-Only mode."}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger className="focus:outline-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to clear your workspace cache? This will reset the app and reload.")) {
                    await del('trackster-storage');
                    await del('trackster-ui-storage');
                    sessionStorage.setItem('autoOpenDisclaimer', 'true');
                    window.location.reload();
                  }
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Icons.Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Clear Workspace Cache
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {(activeMainView === 'packs' || activeMainView === 'samples') && (
        <div className="h-12 px-4 flex items-center bg-card/50 border-t border-border/50 gap-4">
          <div className="flex bg-muted p-1 rounded-md">
            <button
              ref={setPacksRef}
              onClick={() => rootHandle && setActiveMainView('packs')}
              disabled={!rootHandle}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'packs' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50",
                isOverPacks && rootHandle && "ring-2 ring-primary bg-primary/10"
              )}
            >
              Packs
            </button>
            <button
              ref={setSamplesRef}
              onClick={() => hasPack && setActiveMainView('samples')}
              disabled={!hasPack}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'samples' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50",
                isOverSamples && hasPack && "ring-2 ring-primary bg-primary/10"
              )}
            >
              Samples
            </button>
          </div>
        </div>
      )}
      
      {activeMainView === 'overview' && (
        <div className="h-12 px-4 flex items-center justify-between bg-card/50 border-t border-border/50 gap-2">
           <div className="flex bg-muted p-1 rounded-md">
             <button
               onClick={() => setRoutingMode('physical')}
               className={clsx(
                 "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                 routingMode === 'physical' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50"
               )}
             >
               Physical Cabling
             </button>
             <button
               onClick={() => setRoutingMode('logical')}
               className={clsx(
                 "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                 routingMode === 'logical' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50"
               )}
             >
               Logical MIDI Routing
             </button>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="secondary" size="sm" onClick={() => resetLayout(DEFAULT_NODES, DEFAULT_CONNECTIONS, DEFAULT_LOGICAL_CONNECTIONS)}>
               <Icons.RefreshCw size={14} className="mr-2" /> Reset
             </Button>
             <Button variant="secondary" size="sm" onClick={() => autoArrange({ circuit: 350, grind: 200, s1: 300, minifreak: 400, flow8: 300, ableton: 350 })}>
               <Icons.LayoutGrid size={14} className="mr-2" /> Rearrange
             </Button>
             <Button variant="default" size="sm" onClick={saveLayout} onDoubleClick={copyLayout}>
               <Icons.Save size={14} className="mr-2" /> Save
             </Button>
           </div>
        </div>
      )}
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
    </div>
  );
}
