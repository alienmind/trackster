import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { formatBytes } from '../../../utils/formatters';
import { TagBadge } from '../../Core/TagBadge/TagBadge';
import * as Icons from 'lucide-react';

export default function FileInspector() {
  const selectedFile = useUIStore((s) => s.selectedFile);
  const tags = useCircuitTracksStore((s) => s.tags);
  const assignTagToSlot = useCircuitTracksStore((s) => s.assignTagToSlot);
  const renameFile = useCircuitTracksStore((s) => s.renameFile);
  const selectedPadIndex = useUIStore((s) => s.selectedPadIndex);
  const slots = useCircuitTracksStore((s) => s.slots);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleRenameSubmit = () => {
    if (!selectedFile || !editNameValue.trim()) {
      setIsEditingName(false);
      return;
    }
    renameFile(selectedFile, editNameValue.trim());
    useUIStore.getState().setSelectedFile({
      ...selectedFile,
      displayName: editNameValue.trim()
    });
    setIsEditingName(false);
  };

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
  
  const ext = selectedFile.originalFilename?.split('.').pop() || 'wav';
  const prefix = (selectedPadIndex !== null && selectedPadIndex >= 0) ? `${selectedPadIndex.toString().padStart(2, '0')}_` : '';
  const tagPrefix = (fileTag && fileTag.id !== 'unknown') ? `${fileTag.label}_` : '';
  
  return (
    <div className="flex flex-col h-full bg-card rounded border border-border p-2 text-xs overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => {
            const indexToPlay = (selectedPadIndex !== null && selectedPadIndex !== -1) ? selectedPadIndex : -1;
            useCircuitTracksStore.getState().playSlot(indexToPlay, selectedFile.fileHandle);
            useUIStore.getState().setOscilloscopeOpen(true);
          }}
          className="flex-shrink-0 p-1.5 bg-primary/20 hover:bg-primary/40 text-primary rounded-full transition-colors"
          title="Play sample"
        >
          <Icons.Play size={14} className="ml-0.5" />
        </button>

        <div 
          className="break-all cursor-pointer hover:bg-muted/50 p-1 rounded -ml-1 transition-colors flex-1 min-w-0" 
          title="Click to rename"
          onClick={() => {
            if (!isEditingName) {
              setEditNameValue(selectedFile.displayName);
              setIsEditingName(true);
            }
          }}
        >
          {isEditingName ? (
            <div className="flex items-center font-mono text-[11px]">
              {prefix && <span className="text-muted-foreground/50 select-none">{prefix}</span>}
              {tagPrefix && <span className="text-primary/70 font-bold select-none">{tagPrefix}</span>}
              <input
                ref={inputRef}
                type="text"
                className="bg-input text-foreground font-semibold border border-primary/50 rounded px-1 min-w-0 flex-1 outline-none h-5 mx-[1px]"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                onBlur={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-muted-foreground/50 select-none">.{ext}</span>
            </div>
          ) : (
            <div className="flex items-center font-mono text-[11px] flex-wrap">
              {prefix && <span className="text-muted-foreground/50 mr-[1px]">{prefix}</span>}
              {tagPrefix && <span className="text-primary/70 font-bold mr-[1px]">{tagPrefix}</span>}
              <span className="text-foreground font-semibold">{selectedFile.displayName}</span>
              <span className="text-muted-foreground/50 ml-[1px]">.{ext}</span>
            </div>
          )}
        </div>
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
