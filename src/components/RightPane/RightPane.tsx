import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useUIStore } from '../../stores/useUIStore';
import { computeRenamePlan } from '../../utils/renamePlan';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import * as Icons from 'lucide-react';
import { TagBadge } from '../TagBadge/TagBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import clsx from 'clsx';
import { useState } from 'react';

function DraggableTag({ tag, onDeleteClick, isCollapsed }: { tag: any, onDeleteClick: (tagId: string) => void, isCollapsed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tag-${tag.id}`,
    data: { type: 'tag', tagId: tag.id },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  const content = (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <div {...attributes} {...listeners} className="w-full">
        <TagBadge tag={tag} isDragging={isDragging} compact={isCollapsed} className="cursor-grab active:cursor-grabbing mx-auto" />
      </div>
      {!isDragging && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(tag.id);
          }}
          className="absolute top-0 right-0 p-0.5 bg-background/80 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100 z-20"
        >
          <Icons.X size={10} />
        </button>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger className="focus:outline-none w-full">{content}</TooltipTrigger>
        <TooltipContent side="left">{tag.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function RightPane() {
  const tags = useFileSystemStore((s) => s.tags);
  const pendingChanges = useFileSystemStore((s) => s.pendingChanges);
  const slots = useFileSystemStore((s) => s.slots);
  const unassignedFiles = useFileSystemStore((s) => s.unassignedFiles);
  const openCommitDialog = useUIStore((s) => s.openCommitDialog);
  const addTag = useFileSystemStore((s) => s.addTag);
  const removeTag = useFileSystemStore((s) => s.removeTag);
  
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const isCollapsed = useUIStore((s) => s.isRightPaneCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleRightPane);

  const plan = pendingChanges > 0 ? computeRenamePlan(slots) : null;
  
  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim());
      setNewTagName('');
      setIsAddTagOpen(false);
    }
  };
  
  const computeAffectedFilesCount = (tagId: string) => {
    let count = 0;
    slots.forEach(slot => {
      if (slot.sample?.tag === tagId) count++;
    });
    unassignedFiles.forEach(file => {
      if (file.tag === tagId) count++;
    });
    return count;
  };
  
  const confirmDelete = () => {
    if (tagToDelete) {
      removeTag(tagToDelete);
      setTagToDelete(null);
    }
  };

  return (
    <div className={clsx(
      "flex-none border-l border-border bg-card flex flex-col h-full transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Pending Changes Tab / Header */}
      <div className={clsx(
        "p-4 border-b border-border bg-muted flex items-center",
        isCollapsed ? "flex-col gap-3 justify-center" : "justify-between"
      )}>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Icons.ListChecks size={18} />
          {!isCollapsed && "Pending Changes"}
        </h3>
        
        <div className="flex items-center gap-2">
          {pendingChanges > 0 && (
            <Badge variant="destructive" className="font-bold">
              {pendingChanges}
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse}
            className="flex-none h-8 w-8"
          >
            {isCollapsed ? <Icons.PanelRightOpen size={18} /> : <Icons.PanelRightClose size={18} />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <ScrollArea className="flex-1 p-4">
        {pendingChanges === 0 ? (
          <div className="text-sm text-muted-foreground text-center mt-4">
            No pending changes. Move samples to slots to see changes.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              You have {pendingChanges} files that will be renamed to match their current pad positions.
            </p>
            
            <ScrollArea className="flex-1 bg-background rounded border border-border p-2 text-xs font-mono max-h-48">
              <div className="flex flex-col gap-1">
                {plan?.operations.map(op => (
                  <div key={op.from} className="flex flex-col border-b border-border/50 pb-1 mb-1 last:border-0 last:mb-0">
                    <span className="text-red-400 line-through">{op.from}</span>
                    <span className="text-green-400">{op.to}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              onClick={openCommitDialog}
              className="w-full bg-primary hover:bg-primary hover:brightness-110 text-white font-bold shadow-md"
            >
              <Icons.Save className="mr-2" size={16} />
              Commit Changes
            </Button>
          </div>
        )}
      </ScrollArea>
      )}

    {/* Tags Section */}
      <div className={clsx(
        "border-t border-border flex flex-col",
        isCollapsed ? "flex-1" : "h-1/2"
      )}>
        <div className={clsx(
          "p-4 border-b border-border flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Tooltip>
            <TooltipTrigger className="focus:outline-none">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Icons.Tags size={18} />
                {!isCollapsed && "Tag Manager"}
              </h3>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="left">Tag Manager</TooltipContent>}
          </Tooltip>
          {!isCollapsed && (
            <Button variant="default" size="sm" onClick={() => setIsAddTagOpen(true)} className="h-8">
              <Icons.Plus size={14} className="mr-1" />
              Add Tag
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className={clsx(
            "grid gap-2 p-2",
            isCollapsed ? "grid-cols-1" : "grid-cols-2"
          )}>
            {tags.map(tag => (
              <DraggableTag key={tag.id} tag={tag} onDeleteClick={setTagToDelete} isCollapsed={isCollapsed} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Tag Name (e.g. Synth)" 
              value={newTagName} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)} 
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddTag()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="default" onClick={() => setIsAddTagOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this tag?</p>
            {tagToDelete && computeAffectedFilesCount(tagToDelete) > 0 && (
              <p className="mt-2 text-destructive font-semibold">
                Warning: {computeAffectedFilesCount(tagToDelete)} files are associated with this tag. They will lose this tag!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="default" onClick={() => setTagToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
