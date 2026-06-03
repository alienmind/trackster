import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageIndex, Notification, SampleFile } from '../types';

interface UIState {
  activePage: PageIndex;
  activeMainView: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton' | 'soundtoys';
  selectedPadIndex: number | null;
  selectedPads: number[];
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

  confirmModal: {
    isOpen: boolean;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    destructive?: boolean;
  };

  setActiveMainView: (view: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton' | 'soundtoys') => void;
  setActivePage: (page: PageIndex) => void;
  selectPad: (index: number | null, shiftKey?: boolean, ctrlKey?: boolean) => void;
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

  showConfirmModal: (options: Omit<UIState['confirmModal'], 'isOpen'>) => void;
  closeConfirmModal: () => void;

  deferredPrompt: any | null;
  setDeferredPrompt: (prompt: any | null) => void;
}

const storeCreator: StateCreator<UIState> = (set) => ({
  activePage: 0,
  activeMainView: 'overview',
  selectedPadIndex: null,
  selectedPads: [],
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
  confirmModal: {
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  },

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

  selectPad: (index, shiftKey, ctrlKey) => {
    set((state) => {
      if (index === null) {
        return { selectedPadIndex: null, selectedPads: [] };
      }

      if (ctrlKey) {
        const isSelected = state.selectedPads.includes(index);
        return {
          selectedPadIndex: index,
          selectedPads: isSelected
            ? state.selectedPads.filter(p => p !== index)
            : [...state.selectedPads, index],
        };
      }

      if (shiftKey && state.selectedPadIndex !== null) {
        const start = Math.min(state.selectedPadIndex, index);
        const end = Math.max(state.selectedPadIndex, index);
        const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return {
          selectedPadIndex: index, // keep the latest click as anchor
          selectedPads: Array.from(new Set([...state.selectedPads, ...range])),
        };
      }

      return {
        selectedPadIndex: index,
        selectedPads: [index],
      };
    });
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

  showConfirmModal: (options) => set({ confirmModal: { ...options, isOpen: true } }),
  closeConfirmModal: () => set((state) => ({ confirmModal: { ...state.confirmModal, isOpen: false } })),

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
