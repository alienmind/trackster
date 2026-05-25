import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { SampleFile } from '../../types';
import clsx from 'clsx';
import { useAudioStore } from '../../stores/useAudioStore';
import { useUIStore } from '../../stores/useUIStore';
import { TagBadge } from '../TagBadge/TagBadge';

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

  const tagDef = useFileSystemStore((s) => s.tags.find((t: any) => t.id === sample.tag));
  
  const playSlot = useAudioStore((s) => s.playSlot);
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
        "flex items-center gap-2 p-2 rounded-md border bg-muted cursor-grab hover:border-border min-w-[150px] touch-none outline-none focus:outline-none",
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
  const unassignedFiles = useFileSystemStore((s) => s.unassignedFiles);
  const rootHandle = useFileSystemStore((s) => s.rootHandle);

  if (!rootHandle) return null;

  return (
    <div className="h-40 border-t border-border bg-card flex flex-col flex-none">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Staging Area (Unassigned Files)</div>
        <div className="text-xs text-muted-foreground">{unassignedFiles.length} files</div>
      </div>
      
      <div className="flex-1 overflow-x-auto p-4 flex items-start gap-3">
        {unassignedFiles.length === 0 ? (
          <div className="text-sm text-muted-foreground m-auto">No unassigned files in this pack.</div>
        ) : (
          unassignedFiles.map(f => (
            <DraggableSample key={f.originalFilename} sample={f} />
          ))
        )}
      </div>
    </div>
  );
}
