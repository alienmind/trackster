import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
import * as Icons from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function Toolbar() {
  const { activePack, autoTag, autoArrange, undo, history, pendingChanges } = useFileSystemStore();
  const scanDuplicates = useAudioStore((s) => s.scanDuplicates);
  const slots = useFileSystemStore((s) => s.slots);
  const openCommitDialog = useUIStore((s) => s.openCommitDialog);

  const openRootDirectory = useFileSystemStore((s) => s.openRootDirectory);
  const rootHandle = useFileSystemStore((s) => s.rootHandle);

  const hasPack = !!activePack;

  return (
    <div className="h-16 flex-none border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
            <Button 
              variant="default"
              onClick={openRootDirectory}
              className="font-semibold shadow-md"
            >
              <Icons.HardDrive className="mr-2" size={16} />
              {rootHandle ? 'Change SD Card' : 'Open SD Card'}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Select the root directory of your SD Card (or the 'Tracks' folder directly).
          </TooltipContent>
        </Tooltip>
        
        {hasPack && (
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md font-semibold text-foreground border border-border h-10">
            <Icons.FolderOpen size={16} />
            <span>{activePack}</span>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
            <Button
              variant="secondary"
              onClick={() => {
                autoTag();
                autoArrange();
              }}
              disabled={!hasPack}
            >
              <Icons.Wand2 className="mr-2" size={16} />
              Magic Sort
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Automatically tag and arrange unassigned files based on their names.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
            <Button
              variant="secondary"
              onClick={() => scanDuplicates(slots)}
              disabled={!hasPack}
            >
              <Icons.Search className="mr-2" size={16} />
              Scan Dupes
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Scan the active pack for identical sample files to save space.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={undo}
          disabled={history.length === 0}
        >
          <Icons.Undo className="mr-2" size={16} />
          Undo
        </Button>
        <Button
          variant="default"
          onClick={openCommitDialog}
          disabled={pendingChanges === 0}
          className="font-bold"
        >
          <Icons.Save className="mr-2" size={16} />
          Commit
        </Button>
      </div>
    </div>
  );
}
