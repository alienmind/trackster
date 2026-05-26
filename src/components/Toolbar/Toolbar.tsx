import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useDroppable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { del } from 'idb-keyval';
import DisclaimerModal from '../DisclaimerModal/DisclaimerModal';

export default function Toolbar() {
  const { rootHandle, activePack, workspaceMode, setWorkspaceMode } = useFileSystemStore();
  const { activeMainView, setActiveMainView } = useUIStore();

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
    <div className="h-16 flex-none border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
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

        {rootHandle && (
          <div className="flex bg-muted p-1 rounded-md">
            <button
              ref={setPacksRef}
              onClick={() => setActiveMainView('packs')}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'packs' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                isOverPacks && "ring-2 ring-primary bg-primary/10"
              )}
            >
              Pack Organizer
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
              Sample Organizer
            </button>
          </div>
        )}
        
        {rootHandle && workspaceMode && (
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
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
    </div>
  );
}
