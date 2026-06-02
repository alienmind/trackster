import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { Button } from '../../Core/ui/button';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Core/ui/tooltip';

export default function SampleToolbar() {
  const { activePack, autoTag, autoArrange, applyTagsToFilenames, setApplyTagsToFilenames } = useCircuitTracksStore();
  const scanDuplicates = useCircuitTracksStore((s) => s.scanDuplicates);

  const hasPack = !!activePack;

  if (!hasPack) return null;

  return (
    <div className="h-14 flex-none border-b border-border bg-card/80 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md font-semibold text-foreground border border-border h-9">
          <Icons.FolderOpen size={16} />
          <span>{activePack}</span>
        </div>

        <Tooltip>
          <TooltipTrigger render={<div className="inline-flex focus:outline-none" />}>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                autoTag();
                autoArrange();
              }}
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
          <TooltipTrigger render={<div className="inline-flex focus:outline-none" />}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scanDuplicates()}
            >
              <Icons.Search className="mr-2" size={16} />
              Scan Dupes
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Scan the active pack for identical sample files to save space.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<div className="inline-flex focus:outline-none" />}>
            <Button
              variant="state"
              data-state={applyTagsToFilenames ? 'active' : 'inactive'}
              size="sm"
              onClick={() => setApplyTagsToFilenames(!applyTagsToFilenames)}
            >
              <Icons.Tag className="mr-2" size={16} />
              Tags in Filenames
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle whether tags (like BD_) are physically added to the actual file names.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center space-x-2">
        {/* Undo and Commit moved to PendingChangesPane */}
      </div>
    </div>
  );
}
