import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import clsx from 'clsx';

export default function Toolbar() {
  const { openRootDirectory, rootHandle, activePack } = useFileSystemStore();
  const { activeMainView, setActiveMainView } = useUIStore();

  const hasPack = !!activePack;

  return (
    <div className="h-16 flex-none border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
            <Button 
              variant="default"
              onClick={openRootDirectory}
              className="font-semibold shadow-md"
            >
              <Icons.HardDrive className="mr-2" size={16} />
              {rootHandle ? 'Mount SD Card' : 'Open SD Card'}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Select the root directory of your SD Card (or the 'Tracks' folder directly).
          </TooltipContent>
        </Tooltip>

        {rootHandle && (
          <div className="flex bg-muted p-1 rounded-md">
            <button
              onClick={() => setActiveMainView('packs')}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'packs' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pack Organizer
            </button>
            <button
              onClick={() => hasPack && setActiveMainView('samples')}
              disabled={!hasPack}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                activeMainView === 'samples' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
            >
              Sample Organizer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
