import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageIndex, Notification, SampleFile } from '../types';

interface UIState {
  activePage: PageIndex;
  activeMainView: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton' | 'soundtoys';
  selectedPadIndex: number | null;
  isCommitDialogOpen: boolean;
  notifications: Notification[];

  isLeftPaneCollapsed: boolean;
  isRightPaneCollapsed: boolean;
  selectedFile: SampleFile | null;
  activeDoc: { url: string; type: 'pdf' | 'md' } | null;
  rightPaneWidth: number;
  isDeviceMinimized: boolean;

  isDuplicateModalOpen: boolean;
  duplicateClusters: SampleFile[][];

  isMobileDrawerOpen: boolean;

  setActiveMainView: (view: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton' | 'soundtoys') => void;
  setActivePage: (page: PageIndex) => void;
  selectPad: (index: number | null) => void;
  openCommitDialog: () => void;
  closeCommitDialog: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  toggleLeftPane: () => void;
  toggleRightPane: () => void;
  setRightPaneCollapsed: (collapsed: boolean) => void;
  setSelectedFile: (file: SampleFile | null) => void;
  setActiveDoc: (doc: { url: string; type: 'pdf' | 'md' } | null) => void;
  setRightPaneWidth: (width: number) => void;
  setDeviceMinimized: (minimized: boolean) => void;

  openDuplicateModal: (clusters: SampleFile[][]) => void;
  closeDuplicateModal: () => void;

  setMobileDrawerOpen: (isOpen: boolean) => void;

  deferredPrompt: any | null;
  setDeferredPrompt: (prompt: any | null) => void;
}

const storeCreator: StateCreator<UIState> = (set) => ({
  activePage: 0,
  activeMainView: 'overview',
  selectedPadIndex: null,
  isCommitDialogOpen: false,
  notifications: [],
  isLeftPaneCollapsed: false,
  isRightPaneCollapsed: true,
  selectedFile: null,
  activeDoc: null,
  rightPaneWidth: 400,
  isDeviceMinimized: false,

  isDuplicateModalOpen: false,
  duplicateClusters: [],
  isMobileDrawerOpen: false,

  deferredPrompt: null,

  setActiveMainView: (view) => set((state) => {
    let rightPaneCollapsed = state.isRightPaneCollapsed;
    if (view === 'circuit') {
      rightPaneCollapsed = false; // Always open for circuit tracks
    } else if (!state.activeDoc) {
      rightPaneCollapsed = true; // Collapse for other views if no doc is open
    }
    return { activeMainView: view, activeDoc: null, isRightPaneCollapsed: rightPaneCollapsed };
  }),
  setActivePage: (page) => {
    set({ activePage: page });
    // Side effect to update css variable can be handled here or in a component
  },

  selectPad: (index) => {
    set({ selectedPadIndex: index });
  },

  openCommitDialog: () => set({ isCommitDialogOpen: true }),
  closeCommitDialog: () => set({ isCommitDialogOpen: false }),

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  toggleLeftPane: () => set((state) => ({ isLeftPaneCollapsed: !state.isLeftPaneCollapsed })),
  toggleRightPane: () => set((state) => ({ isRightPaneCollapsed: !state.isRightPaneCollapsed })),
  setRightPaneCollapsed: (collapsed) => set({ isRightPaneCollapsed: collapsed }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setActiveDoc: (doc) => set((state) => {
    let newWidth = state.rightPaneWidth;
    if (doc && typeof window !== 'undefined') {
      const halfWidth = window.innerWidth * 0.5;
      if (newWidth < halfWidth) {
        newWidth = halfWidth;
      }
    }
    
    let shouldCollapse = false;
    if (!doc && state.activeMainView !== 'circuit') {
      shouldCollapse = true;
    }
    
    return { 
      activeDoc: doc, 
      isRightPaneCollapsed: doc ? false : shouldCollapse, 
      isDeviceMinimized: false, 
      rightPaneWidth: newWidth 
    };
  }),
  setRightPaneWidth: (width) => set({ rightPaneWidth: width }),
  setDeviceMinimized: (minimized) => set({ isDeviceMinimized: minimized }),

  openDuplicateModal: (clusters) => set({ isDuplicateModalOpen: true, duplicateClusters: clusters }),
  closeDuplicateModal: () => set({ isDuplicateModalOpen: false, duplicateClusters: [] }),
  setMobileDrawerOpen: (isOpen) => set({ isMobileDrawerOpen: isOpen }),

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt })
});

export const useUIStore = create<UIState>()(
  (persist as unknown as (config: StateCreator<UIState>, options: any) => StateCreator<UIState>)(
    storeCreator,
    {
      name: 'trackster-ui-storage',
      partialize: (state: any) => ({
        activePage: state.activePage,
        activeMainView: state.activeMainView,
        isLeftPaneCollapsed: state.isLeftPaneCollapsed,
        isRightPaneCollapsed: state.isRightPaneCollapsed,
        rightPaneWidth: state.rightPaneWidth
      })
    }
  )
);
