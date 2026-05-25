import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useUIStore } from '../../stores/useUIStore';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import clsx from 'clsx';
import * as Icons from 'lucide-react';

interface PackItemProps {
  packName: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function PackItem({ packName, isActive, isCollapsed, onClick }: PackItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `pack-${packName}`,
    data: { type: 'pack', packName }
  });

  const content = (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={clsx(
        'px-3 py-2 rounded-md cursor-pointer transition-colors flex items-center',
        isCollapsed ? 'justify-center' : 'gap-2',
        isActive ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-muted',
        isOver && !isActive && 'ring-2 ring-primary bg-muted text-foreground'
      )}
    >
      {isActive ? <Icons.FolderOpen size={16} /> : <Icons.Folder size={16} />}
      {!isCollapsed && <span className="truncate">{packName}</span>}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger className="w-full focus:outline-none">{content}</TooltipTrigger>
        <TooltipContent side="right">{packName}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function PacksSidebar() {
  const packs = useFileSystemStore((s) => s.packs);
  const activePack = useFileSystemStore((s) => s.activePack);
  const loadPack = useFileSystemStore((s) => s.loadPack);
  const rootHandle = useFileSystemStore((s) => s.rootHandle);
  
  const isCollapsed = useUIStore((s) => s.isLeftPaneCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleLeftPane);

  return (
    <div className={clsx(
      "flex-none border-r border-border bg-card flex flex-col h-full transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={clsx(
        "p-4 border-b border-border flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && <h2 className="font-semibold text-foreground truncate">SD Card Packs</h2>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse}
          className="flex-none h-8 w-8"
        >
          {isCollapsed ? <Icons.PanelLeftOpen size={18} /> : <Icons.PanelLeftClose size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-1">
          {rootHandle && packs.length === 0 && (
            <div className="text-sm text-muted-foreground text-center p-4">
              {isCollapsed ? "Empty" : "No packs found in 'Tracks' folder."}
            </div>
          )}
          
          {packs.map((packName) => (
            <PackItem 
              key={packName}
              packName={packName}
              isActive={packName === activePack}
              isCollapsed={isCollapsed}
              onClick={() => {
                if (packName !== activePack) loadPack(packName);
              }}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
