import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { SampleFile } from '../../../../types';
import clsx from 'clsx';
import { useUIStore } from '../../../../stores/useUIStore';
import { TagBadge } from '../../../Core/TagBadge/TagBadge';

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

  if (!rootHandle) return null;

  return (
    <div className="flex flex-col mt-4 border border-border/50 rounded-lg overflow-hidden flex-1 min-h-[200px] bg-black/20">
      <div className="px-3 py-2 border-b border-border/50 bg-black/40 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Staging Area</div>
        <div className="text-xs font-mono text-muted-foreground">{unassignedFiles.length}</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {unassignedFiles.length === 0 ? (
          <div className="text-[11px] text-muted-foreground m-auto text-center px-4">No unassigned files in this pack.</div>
        ) : (
          unassignedFiles.map(f => (
            <DraggableSample key={f.originalFilename} sample={f} />
          ))
        )}
      </div>
    </div>
  );
}
