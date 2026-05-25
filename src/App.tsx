import { useEffect, useState } from 'react';
import { useUIStore } from './stores/useUIStore';
import { PAGES } from './utils/constants';
import { useFileSystemStore } from './stores/useFileSystemStore';
import { useAudioStore } from './stores/useAudioStore';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import SortableGrid from './components/Grid/SortableGrid';
import PageTabs from './components/PageTabs/PageTabs';
import StatusBar from './components/StatusBar/StatusBar';
import CommitDialog from './components/CommitDialog/CommitDialog';
import BrowserWarning from './components/BrowserWarning/BrowserWarning';
import PacksSidebar from './components/PacksSidebar/PacksSidebar';
import StagingArea from './components/StagingArea/StagingArea';
import Oscilloscope from './components/Oscilloscope/Oscilloscope';
import FileInspector from './components/FileInspector/FileInspector';
import RightPane from './components/RightPane/RightPane';
import Toolbar from './components/Toolbar/Toolbar';
import { TagBadge } from './components/TagBadge/TagBadge';
import logoUrl from '../doc/trackster-logo.png';
import * as Icons from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const isSupported = 'showDirectoryPicker' in window;
  const activePage = useUIStore((s) => s.activePage);
  const rootHandle = useFileSystemStore((s) => s.rootHandle);
  const activePack = useFileSystemStore((s) => s.activePack);
  const moveSlot = useFileSystemStore((s) => s.moveSlot);
  const assignToSlot = useFileSystemStore((s) => s.assignToSlot);
  const copyToPack = useFileSystemStore((s) => s.copyToPack);
  const slots = useFileSystemStore((s) => s.slots);
  
  const initAudioContext = useAudioStore((s) => s.initAudioContext);
  const [activeDragItem, setActiveDragItem] = useState<{ id: string, type: string, data: any } | null>(null);
  const activeTagItem = activeDragItem?.type === 'tag' 
    ? useFileSystemStore.getState().tags.find(t => t.id === activeDragItem.data.tagId)
    : null;

  useEffect(() => {
    const pageConfig = PAGES.find((p) => p.index === activePage);
    if (pageConfig) {
      document.documentElement.style.setProperty('--accent', pageConfig.color);
    }
  }, [activePage]);

  if (!isSupported) {
    return <BrowserWarning />;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem({
      id: event.active.id.toString(),
      type: event.active.data.current?.type,
      data: event.active.data.current,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (overType === 'pack') {
      const targetPack = over.data.current?.packName;
      if (targetPack && targetPack !== activePack) {
        if (activeType === 'unassigned') {
          copyToPack(active.data.current!.sample, targetPack);
        } else if (activeType === 'pad') {
          const index = parseInt(active.id.toString().replace('pad-', ''), 10);
          const sample = slots[index]?.sample;
          if (sample) copyToPack(sample, targetPack);
        }
      }
      return;
    }

    if (activeType === 'unassigned' && overType === 'pad') {
      const targetIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      assignToSlot(active.data.current!.sample, targetIndex);
      return;
    }

    if (activeType === 'tag' && overType === 'pad') {
      const targetIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      useFileSystemStore.getState().assignTagToSlot(active.data.current!.tagId, targetIndex);
      return;
    }

    if (activeType === 'pad' && overType === 'pad' && active.id !== over.id) {
      const fromIndex = parseInt(active.id.toString().replace('pad-', ''), 10);
      const toIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      moveSlot(fromIndex, toIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans h-screen overflow-hidden" onClick={initAudioContext}>
        {/* Header */}
        <div className="h-14 flex-none border-b border-border bg-card flex items-center px-4 justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoUrl} alt="Trackster Logo" className="h-8 w-auto" />
            <div className="flex items-baseline space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">🎛️ Tracks(ter)</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline-block">🎛️ Tracks management tool</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <a 
              href="https://github.com/alienmind/trackster" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              <Icons.GitBranch size={14} />
              GitHub
            </a>
            <a 
              href="https://components.novationmusic.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              <Icons.ExternalLink size={14} />
              Novation Components
            </a>
            <ThemeToggle />
          </div>
        </div>

        <Toolbar />

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Pane: Packs Sidebar */}
          <PacksSidebar />

          {/* Center Pane */}
          <main className="flex-1 flex flex-col min-w-0">
            <div className="p-4 flex flex-col h-full">
              {!rootHandle ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Icons.FolderOpen size={48} className="opacity-20" />
                  <h2 className="text-xl font-semibold">No SD Card Selected</h2>
                  <p>Open your 🎛️ Tracks SD Card root folder to begin.</p>
                </div>
              ) : !activePack ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <h2 className="text-xl font-semibold">Select a Pack</h2>
                  <p>Choose a pack from the sidebar to view its samples.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 h-48 bg-card rounded-md border border-border flex gap-2 p-2">
                    <div className="flex-1 min-w-[250px]"><FileInspector /></div>
                    <div className="flex-1 relative"><Oscilloscope /></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                    <PageTabs />
                    <div className="p-6 flex-1 overflow-y-auto bg-background/30">
                      <SortableGrid />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Bottom Pane: Staging Area */}
            <StagingArea />
          </main>

          {/* Right Pane: dynamic */}
          <RightPane />
        </div>

        {/* Footer */}
        <StatusBar />
        
        <CommitDialog />
        
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeDragItem ? (
            <div className="opacity-80 scale-105 transition-transform pointer-events-none">
              {activeDragItem.type === 'pad' && activeDragItem.data.sample && (
                <div className="h-24 w-[110px] bg-muted border-2 border-primary rounded-md p-2 flex flex-col items-center justify-center shadow-2xl relative">
                  <div className="absolute left-2 top-2 text-xs text-muted-foreground font-mono">{activeDragItem.data.index}</div>
                  <div className="flex h-full flex-col items-center justify-center pt-3 gap-1">
                    {useFileSystemStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag) ? (
                      <TagBadge tag={useFileSystemStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag)!} />
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                    <div className="w-full truncate text-center text-xs font-medium text-foreground px-1">
                      {activeDragItem.data.sample.displayName}
                    </div>
                  </div>
                </div>
              )}
              {activeDragItem.type === 'unassigned' && activeDragItem.data.sample && (
                <div className="flex items-center gap-2 p-2 rounded-md border-2 border-primary bg-muted shadow-2xl min-w-[150px]">
                  {useFileSystemStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag) ? (
                    <TagBadge tag={useFileSystemStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag)!} compact={true} />
                  ) : (
                    <div className="w-6 h-6" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{activeDragItem.data.sample.displayName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{activeDragItem.data.sample.sourcePath || 'Root'}</div>
                  </div>
                </div>
              )}
              {activeDragItem.type === 'tag' && activeTagItem && (
                <TagBadge tag={activeTagItem} className="shadow-2xl opacity-100" />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
