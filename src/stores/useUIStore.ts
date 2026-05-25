import { create } from 'zustand';
import type { PageIndex, Notification } from '../types';

interface UIState {
  activePage: PageIndex;
  selectedPadIndex: number | null;
  isCommitDialogOpen: boolean;
  notifications: Notification[];

  setActivePage: (page: PageIndex) => void;
  selectPad: (index: number | null) => void;
  openCommitDialog: () => void;
  closeCommitDialog: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activePage: 0,
  selectedPadIndex: null,
  isCommitDialogOpen: false,
  notifications: [],

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
  }
}));
