import { useUIStore } from '../../stores/useUIStore';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { formatBytes } from '../../utils/formatters';
import { TagBadge } from '../TagBadge/TagBadge';
import * as Icons from 'lucide-react';

export default function FileInspector() {
  const selectedFile = useUIStore((s) => s.selectedFile);
  const tags = useFileSystemStore((s) => s.tags);
  const assignTagToSlot = useFileSystemStore((s) => s.assignTagToSlot);
  const selectedPadIndex = useUIStore((s) => s.selectedPadIndex);
  const slots = useFileSystemStore((s) => s.slots);
  
  // Derive the current tag from the slot if possible, so it updates immediately
  const activeSlot = (selectedPadIndex !== null && selectedPadIndex !== -1) ? slots[selectedPadIndex] : null;

  if (!selectedFile) {
    if (activeSlot && !activeSlot.sample) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-50 border border-dashed border-border rounded bg-muted/30">
          <Icons.Disc size={24} className="mb-2" />
          <span className="text-center px-4 font-medium">Empty slot</span>
          <span className="text-center px-4 text-xs mt-1">Pad {activeSlot.index}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-50 border border-dashed border-border rounded bg-muted/30">
        <Icons.MousePointerClick size={24} className="mb-2" />
        <span className="text-center px-4">Select a file to view the details</span>
      </div>
    );
  }

  const currentTagId = activeSlot?.sample?.tag || selectedFile.tag;
  const fileTag = tags.find(t => t.id === currentTagId);
  
  // Note: we can't easily manage tags for unassigned files right now unless we add a specific function for it.
  // The user said "Tags should be equally manageable from that view".
  
  return (
    <div className="flex flex-col h-full bg-card rounded border border-border p-2 text-xs overflow-y-auto">
      <div className="font-semibold mb-2 text-foreground break-all" title={selectedFile.originalFilename || selectedFile.displayName || selectedFile.fileHandle?.name}>
        {selectedFile.originalFilename || selectedFile.displayName || selectedFile.fileHandle?.name || 'Unknown file'}
      </div>
      <div className="text-muted-foreground truncate mb-2 text-[10px]" title={selectedFile.sourcePath}>
        {selectedFile.sourcePath || 'Root path'}
      </div>
      
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.HardDrive size={12} />
          <span>{formatBytes(selectedFile.size || 0)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.FileAudio size={12} />
          <span>WAV</span>
        </div>
      </div>
      
      <div className="flex-1 mt-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Assign Tag</div>
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => {
                if (selectedPadIndex !== null && selectedPadIndex !== -1) {
                  assignTagToSlot(tag.id, selectedPadIndex);
                  // Update the UI store copy so the inspector stays synced
                  useUIStore.getState().setSelectedFile({ ...selectedFile, tag: tag.id });
                }
              }}
              className={`p-1 rounded transition-colors ${fileTag?.id === tag.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : 'opacity-70 hover:opacity-100'}`}
              title={tag.label}
            >
              <TagBadge tag={tag} compact={true} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
