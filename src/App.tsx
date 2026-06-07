import { useEffect, useState } from 'react';
import { useUIStore } from './stores/useUIStore';
import { PAGES } from './utils/constants';
import { useCircuitTracksStore } from './stores/useCircuitTracksStore';
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
import CommitDialog from './components/Core/CommitDialog/CommitDialog';
import ConfirmModal from './components/Core/ConfirmModal/ConfirmModal';
import DuplicateScanModal from './components/Core/DuplicateScanModal/DuplicateScanModal';
import MonitorDeviceModal from './components/Core/MonitorDeviceModal/MonitorDeviceModal';
import { SidebarProvider, useSidebar } from './components/Core/ui/sidebar';
import { AppSidebar } from './components/Core/AppSidebar/AppSidebar';
import DocumentationDrawer from './components/Core/DocumentationDrawer/DocumentationDrawer';
import { TagBadge } from './components/Core/TagBadge/TagBadge';
import * as Icons from 'lucide-react';
import React from 'react';

import OverviewTab from './components/Overview/OverviewTab';
import WIPPage from './components/Core/WIPPage/WIPPage';
import SoundToysLayout from './components/devices/SoundToys/SoundToysLayout';
import { HARDWARE_LIBRARY } from './devices';

// Floating hamburger button that opens the sidebar on mobile/tablet,
// and toggles the icon-collapsed sidebar on desktop. Hides itself when the
// mobile sheet sidebar is already open so it never overlaps the menu.
// Reserves the documentation drawer's width on the main view so the device
// layout doesn't sit behind it, and auto-collapses the desktop sidebar to
// claw back even more space. Lives inside SidebarProvider so it can use
// useSidebar(). When the doc closes, the sidebar stays collapsed; users can
// reopen it via the floating hamburger.
function DocAwareLayoutEffects() {
  const activeDoc = useUIStore((s) => s.activeDoc);
  const { state, setOpen, isMobile } = useSidebar();

  // Auto-collapse the desktop sidebar when a doc opens.
  React.useEffect(() => {
    if (activeDoc && !isMobile && state === 'expanded') {
      setOpen(false);
    }
  }, [activeDoc, isMobile, state, setOpen]);

  return null;
}

function DocAwareMainView({ children }: { children: React.ReactNode }) {
  const activeDoc = useUIStore((s) => s.activeDoc);
  // Drawer is `min(800px, 90vw)` per DocumentationDrawer.tsx. Mirror that here.
  // We use marginRight (not paddingRight) so existing flex/overflow children layout naturally.
  const drawerWidth = activeDoc ? 'min(800px, 90vw)' : '0px';
  return (
    <div
      className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      style={{ marginRight: drawerWidth }}
    >
      {children}
    </div>
  );
}

function FloatingMenuButton() {
  const { isMobile, openMobile, state, toggleSidebar } = useSidebar();
  // Hide while the mobile sheet is open (the sheet has its own close button)
  if (isMobile && openMobile) return null;
  // On desktop, only show when sidebar is collapsed to icons; on mobile/tablet,
  // always show because the sidebar lives in a Sheet that needs an external trigger.
  const visible = isMobile || state === 'collapsed';
  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={toggleSidebar}
      className="fixed top-2 left-1.5 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/85 backdrop-blur text-foreground shadow-lg hover:bg-accent hover:text-accent-foreground active:scale-95 transition"
    >
      <Icons.Menu className="h-5 w-5" />
    </button>
  );
}

export default function App() {
  const activePage = useUIStore((s) => s.activePage);
  const activeMainView = useUIStore((s) => s.activeMainView);
  
  const moveSlot = useCircuitTracksStore((s) => s.moveSlot);
  const movePackSlot = useCircuitTracksStore((s) => s.movePackSlot);

  const confirmModal = useUIStore((s) => s.confirmModal);
  const closeConfirmModal = useUIStore((s) => s.closeConfirmModal);

  const initAudioContext = useAudioStore((s) => s.initAudioContext);
  
  useEffect(() => {
    // Eagerly initialize AudioContext on the first user interaction
    // to prevent any playback lag when hitting the first sample.
    const handleInteraction = () => {
      initAudioContext();
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudioContext]);

  const [activeDragItem, setActiveDragItem] = useState<{ id: string, type: string, data: any } | null>(null);
  
  const activeTagItem = activeDragItem?.type === 'tag'
    ? useCircuitTracksStore.getState().tags.find(t => t.id === activeDragItem.data.tagId)
    : null;

  useEffect(() => {
    const pageConfig = PAGES.find((p) => p.index === activePage);
    if (pageConfig) {
      document.documentElement.style.setProperty('--accent', pageConfig.color);
    }
  }, [activePage]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      useUIStore.getState().setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);


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

    const selectedPads = useUIStore.getState().selectedPads;

    if (activeType === 'pad' && overType === 'staging') {
      const fromIndex = parseInt(active.id.toString().replace('pad-', ''), 10);
      const indicesToMove = selectedPads.includes(fromIndex) ? selectedPads : [fromIndex];
      useCircuitTracksStore.getState().copySlotsToStaging(indicesToMove);
      return;
    }

    if (activeType === 'unassigned' && overType === 'pad') {
      const targetIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      useCircuitTracksStore.getState().assignMultipleToSlots([active.data.current!.sample], targetIndex);
      return;
    }

    if (activeType === 'tag' && overType === 'pad') {
      const targetIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      useCircuitTracksStore.getState().assignTagToSlot(active.data.current!.tagId, targetIndex);
      return;
    }

    if (activeType === 'pad' && overType === 'pad' && active.id !== over.id) {
      const fromIndex = parseInt(active.id.toString().replace('pad-', ''), 10);
      const toIndex = parseInt(over.id.toString().replace('pad-', ''), 10);
      
      const indicesToMove = selectedPads.includes(fromIndex) ? selectedPads : [fromIndex];
      if (indicesToMove.length > 1) {
        useCircuitTracksStore.getState().moveSlots(indicesToMove, toIndex);
      } else {
        moveSlot(fromIndex, toIndex);
      }
    }
  };

  const activeHardware = HARDWARE_LIBRARY[activeMainView];
  const DeviceLayout = activeHardware?.layoutComponent;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans h-screen overflow-hidden" onClick={initAudioContext}>
        <SidebarProvider>
          <AppSidebar />
          <FloatingMenuButton />
          <div className="flex flex-1 overflow-hidden min-h-0 relative z-0">
            {/* Main View Container - reserves doc-drawer width when a doc is open */}
            <DocAwareLayoutEffects />
            <DocAwareMainView>
              <div className="flex-1 flex-col overflow-auto bg-neutral-900" style={{ display: activeMainView === 'overview' ? 'flex' : 'none' }}>
                <OverviewTab />
              </div>
              {activeMainView === 'soundtoys' ? (
                <SoundToysLayout />
              ) : activeMainView !== 'overview' && DeviceLayout ? (
                <React.Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">Loading device...</div>}>
                  <DeviceLayout />
                </React.Suspense>
              ) : activeMainView !== 'overview' ? (
                <WIPPage deviceId={activeMainView} />
              ) : null}
            </DocAwareMainView>

            <DocumentationDrawer />
          </div>
        </SidebarProvider>

        {/* Modals & Overlays */}
        <CommitDialog />
        <DuplicateScanModal />
        <MonitorDeviceModal />
        <ConfirmModal 
          isOpen={confirmModal.isOpen} 
          title={confirmModal.title} 
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          destructive={confirmModal.destructive}
          onConfirm={() => {
            confirmModal.onConfirm();
            closeConfirmModal();
          }}
          onCancel={closeConfirmModal}
        />

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
                <div className="relative">
                  {useUIStore.getState().selectedPads.length > 1 && useUIStore.getState().selectedPads.includes(activeDragItem.data.index) && (
                    <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-lg z-10">
                      {useUIStore.getState().selectedPads.length}
                    </div>
                  )}
                  <div className="h-24 w-[110px] bg-muted border-2 border-primary rounded-md p-2 flex flex-col items-center justify-center shadow-2xl relative">
                    <div className="absolute left-2 top-2 text-xs text-muted-foreground font-mono">{activeDragItem.data.index}</div>
                    <div className="flex h-full flex-col items-center justify-center pt-3 gap-1">
                      {useCircuitTracksStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag) ? (
                        <TagBadge tag={useCircuitTracksStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag)!} />
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                      <div className="w-full truncate text-center text-xs font-medium text-foreground px-1">
                        {activeDragItem.data.sample.displayName}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeDragItem.type === 'unassigned' && activeDragItem.data.sample && (
                <div className="flex items-center gap-2 p-2 rounded-md border-2 border-primary bg-muted shadow-2xl min-w-[150px]">
                  {useCircuitTracksStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag) ? (
                    <TagBadge tag={useCircuitTracksStore.getState().tags.find(t => t.id === activeDragItem.data.sample?.tag)!} compact={true} />
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
