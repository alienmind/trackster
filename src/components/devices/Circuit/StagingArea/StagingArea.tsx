import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { SampleFile } from '../../../../types';
import clsx from 'clsx';
import { useUIStore } from '../../../../stores/useUIStore';
import { TagBadge } from '../../../Core/TagBadge/TagBadge';
import * as Icons from 'lucide-react';

interface DraggableSampleProps {
  sample: SampleFile;
}

function DraggableSample({ sample }: DraggableSampleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unassigned-${sample.originalFilename}`,
    data: { type: 'unassigned', sample }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : 1,
  };

  const tagDef = useCircuitTracksStore((s) => s.tags.find((t: any) => t.id === sample.tag));
  
  const playSlot = useCircuitTracksStore((s) => s.playSlot);
  const setSelectedFile = useUIStore((s) => s.setSelectedFile);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        playSlot(-1, sample.fileHandle);
        setSelectedFile(sample);
        useUIStore.getState().selectPad(-1);
      }}
      className={clsx(
        "flex items-center gap-2 p-2 rounded-md border bg-muted cursor-grab hover:border-border min-w-0 w-full touch-none outline-none focus:outline-none",
        isDragging ? "opacity-50 ring-2 ring-primary" : "border-border"
      )}
    >
      {tagDef ? (
        <TagBadge tag={tagDef} compact={true} />
      ) : (
        <div className="w-6 h-6" />
      )}
      <div className="flex flex-col min-w-0">
        <div className="text-sm font-medium truncate text-foreground">{sample.displayName}</div>
        <div className="text-[10px] text-muted-foreground truncate">{sample.sourcePath || 'Root'}</div>
      </div>
    </div>
  );
}

export default function StagingArea() {
  const unassignedFiles = useCircuitTracksStore((s) => s.unassignedFiles);
  const rootHandle = useCircuitTracksStore((s) => s.rootHandle);
  const clearUnassigned = useCircuitTracksStore((s) => s.clearUnassigned);

  const { setNodeRef, isOver } = useDroppable({
    id: 'staging-area',
    data: { type: 'staging' }
  });

  if (!rootHandle) return null;

  const handleClearStaging = () => {
    if (unassignedFiles.length === 0) return;
    const count = unassignedFiles.length;
    useUIStore.getState().showConfirmModal({
      title: "Clear Staging Area",
      description: `Are you sure you want to completely remove ${count} file${count === 1 ? '' : 's'} from your SD Card?\n\nThis cannot be undone.`,
      confirmText: count === 1 ? "Delete File" : `Delete ${count} Files`,
      cancelText: "Cancel",
      destructive: true,
      onConfirm: () => {
        clearUnassigned();
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="flex-none border-b border-border flex items-center justify-between px-4 h-14 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full min-w-[24px] text-center">
            {unassignedFiles.length}
          </span>
          <h2 className="font-semibold text-sm">Staging Area</h2>
        </div>
        <button
          type="button"
          onClick={handleClearStaging}
          disabled={unassignedFiles.length === 0}
          title={unassignedFiles.length === 0 ? 'Staging Area is empty' : 'Remove all files in the Staging Area from the SD Card'}
          className="p-1.5 rounded text-muted-foreground enabled:hover:text-red-500 enabled:hover:bg-red-500/10 enabled:cursor-pointer disabled:opacity-40 transition-colors"
        >
          <Icons.Trash2 size={16} />
        </button>
      </div>
      
      <div className="px-4 py-2 bg-muted/50 border-b border-border text-[10px] text-muted-foreground leading-tight">
        <span className="font-semibold text-primary/80">NOTE:</span> These files are fully considered by automatic sample management (Duplicate Scan and Auto Arrange) and can exceed 64 items. Drag pads here to copy them for exchange!
      </div>

      <div 
        ref={setNodeRef}
        className={clsx(
          "flex-1 overflow-y-auto p-2 flex flex-col gap-2 transition-colors",
          isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : ""
        )}
      >
        {unassignedFiles.length === 0 ? (
          <div className="text-[11px] text-muted-foreground m-auto text-center px-4 pt-10">No unassigned files in this pack.</div>
        ) : (
          unassignedFiles.map(f => (
            <DraggableSample key={f.originalFilename} sample={f} />
          ))
        )}
      </div>
    </div>
  );
}
