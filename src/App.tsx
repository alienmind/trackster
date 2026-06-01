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
import StatusBar from './components/Core/StatusBar/StatusBar';
import CommitDialog from './components/Core/CommitDialog/CommitDialog';
import DuplicateScanModal from './components/Core/DuplicateScanModal/DuplicateScanModal';
import BrowserWarning from './components/Core/BrowserWarning/BrowserWarning';
import Toolbar from './components/Core/Toolbar/Toolbar';
import { TagBadge } from './components/Core/TagBadge/TagBadge';
import Logo from './components/Core/Logo';
import * as Icons from 'lucide-react';
import { ThemeToggle } from './components/Core/ThemeToggle';
import pkg from '../package.json';

import CircuitTracksLayout from './components/Circuit/CircuitTracksLayout';
import PendingChangesPane from './components/Core/PendingChangesPane/PendingChangesPane';
import OverviewTab from './components/Overview/OverviewTab';
import WIPPage from './components/Core/WIPPage/WIPPage';
import BehringerGrind from './components/Grind/BehringerGrind';

export default function App() {
  const isSupported = 'showDirectoryPicker' in window;
  const activePage = useUIStore((s) => s.activePage);
  const activeMainView = useUIStore((s) => s.activeMainView);
  
  const moveSlot = useFileSystemStore((s) => s.moveSlot);
  const movePackSlot = useFileSystemStore((s) => s.movePackSlot);
  const assignToSlot = useFileSystemStore((s) => s.assignToSlot);

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
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type) {
      setActiveDragItem({ id: active.id.toString(), type, data: active.data.current });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'packpad' && overType === 'packpad' && active.id !== over.id) {
      const fromIndex = parseInt(active.id.toString().replace('packpad-', ''), 10);
      const toIndex = parseInt(over.id.toString().replace('packpad-', ''), 10);
      movePackSlot(fromIndex, toIndex);
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
        <div className="hidden lg:flex h-16 flex-none border-b border-border bg-card items-center px-4 justify-between order-1">
          {/* Left part (logo) */}
          <div className="flex-1 flex items-center space-x-3">
            <Logo className="h-8 w-auto text-foreground" />
          </div>

          {/* Center part */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="flex items-baseline space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Tracks(ter)</h1>
              <span className="text-[10px] text-muted-foreground font-mono font-bold">v{pkg.version}</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block mt-0.5">Hybrid DAWless documentation and utility tool</span>
          </div>

          <div className="flex-1 flex items-center justify-end space-x-3">
            <a
              href="https://github.com/alienmind/trackster"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-md hover:bg-secondary whitespace-nowrap"
            >
              <Icons.GitBranch size={14} />
              GitHub
            </a>
            <a
              href="https://components.novationmusic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-md hover:bg-secondary whitespace-nowrap"
            >
              <Icons.ExternalLink size={14} />
              Novation Components
            </a>
            <ThemeToggle />
          </div>
        </div>

        <div className="order-3 md:order-2 flex-none z-20">
          <Toolbar />
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0 order-2 md:order-3 relative z-0">
          {activeMainView === 'overview' ? (
            <div className="flex-1 flex flex-col overflow-auto bg-neutral-900"><OverviewTab /></div>
          ) : activeMainView === 'circuit' ? (
            <CircuitTracksLayout />
          ) : activeMainView === 'grind' ? (
            <BehringerGrind />
          ) : (
            <WIPPage deviceName={activeMainView === 's1' ? 'Roland S-1' : activeMainView === 'minifreak' ? 'Arturia Minifreak' : activeMainView === 'flow8' ? 'Flow 8' : activeMainView === 'ableton' ? 'Ableton Live' : activeMainView} />
          )}
          {activeMainView !== 'overview' && <PendingChangesPane />}
        </div>

        {/* Footer */}
        <div className="order-4 md:order-4 hidden md:block">
          <StatusBar />
        </div>

        <CommitDialog />
        <DuplicateScanModal />

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeDragItem ? (
            <div className="opacity-80 scale-105 transition-transform pointer-events-none">
              {activeDragItem.type === 'packpad' && activeDragItem.data.current?.pack && (
                <div className="h-24 w-[110px] bg-muted border-2 border-primary rounded-md p-2 flex flex-col items-center justify-center shadow-2xl relative">
                  <Icons.Folder className="text-primary mb-1" size={24} />
                  <div className="w-full truncate text-center text-xs font-medium text-foreground px-1">
                    {activeDragItem.data.current.pack.displayName}
                  </div>
                </div>
              )}
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
