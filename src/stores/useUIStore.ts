import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageIndex, Notification, SampleFile } from '../types';

interface UIState {
  activePage: PageIndex;
  activeMainView: 'circuit' | 'overview';
  selectedPadIndex: number | null;
  isCommitDialogOpen: boolean;
  notifications: Notification[];

  isLeftPaneCollapsed: boolean;
  isRightPaneCollapsed: boolean;
  selectedFile: SampleFile | null;

  isDuplicateModalOpen: boolean;
  duplicateClusters: SampleFile[][];

  setActiveMainView: (view: 'circuit' | 'overview') => void;
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

  openDuplicateModal: (clusters: SampleFile[][]) => void;
  closeDuplicateModal: () => void;
}

const storeCreator: StateCreator<UIState> = (set) => ({
  activePage: 0,
  activeMainView: 'overview',
  selectedPadIndex: null,
  isCommitDialogOpen: false,
  notifications: [],
  isLeftPaneCollapsed: false,
  isRightPaneCollapsed: false,
  selectedFile: null,

  isDuplicateModalOpen: false,
  duplicateClusters: [],

  setActiveMainView: (view) => set({ activeMainView: view }),
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

  openDuplicateModal: (clusters) => set({ isDuplicateModalOpen: true, duplicateClusters: clusters }),
  closeDuplicateModal: () => set({ isDuplicateModalOpen: false, duplicateClusters: [] })
});

export const useUIStore = create<UIState>()(
  (persist as unknown as (config: StateCreator<UIState>, options: any) => StateCreator<UIState>)(
    storeCreator,
    {
      name: 'trackster-ui-storage',
      partialize: (state: any) => ({
        isLeftPaneCollapsed: state.isLeftPaneCollapsed,
        isRightPaneCollapsed: state.isRightPaneCollapsed
      })
    }
  )
);
