import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageIndex, Notification, SampleFile } from '../types';

interface UIState {
  activePage: PageIndex;
  activeMainView: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'daw' | 'soundtoys';
  selectedPadIndex: number | null;
  selectedPads: number[];
  isCommitDialogOpen: boolean;
  notifications: Notification[];

  isLeftPaneCollapsed: boolean;
  selectedFile: SampleFile | null;
  activeDoc: { url: string; type: 'pdf' | 'md' } | null;

  activeDocSection: string | null;
  hoveredDocSection: string | null;

  helpMode: boolean;

  isDuplicateModalOpen: boolean;
  duplicateClusters: SampleFile[][];

  isMobileDrawerOpen: boolean;
  isOscilloscopeOpen: boolean;

  sidebarSectionStates: Record<string, boolean>;

  confirmModal: {
    isOpen: boolean;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    destructive?: boolean;
  };

  setActiveMainView: (view: 'circuit' | 'overview' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'daw' | 'soundtoys') => void;
  setActivePage: (page: PageIndex) => void;
  selectPad: (index: number | null, shiftKey?: boolean, ctrlKey?: boolean) => void;
  openCommitDialog: () => void;
  closeCommitDialog: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  toggleLeftPane: () => void;
  setSelectedFile: (file: SampleFile | null) => void;
  setActiveDoc: (doc: { url: string; type: 'pdf' | 'md' } | null) => void;

  setActiveDocSection: (sectionId: string | null) => void;
  setHoveredDocSection: (sectionId: string | null) => void;

  setHelpMode: (enabled: boolean) => void;
  toggleHelpMode: () => void;

  openDuplicateModal: (clusters: SampleFile[][]) => void;
  closeDuplicateModal: () => void;

  setMobileDrawerOpen: (isOpen: boolean) => void;

  showConfirmModal: (options: Omit<UIState['confirmModal'], 'isOpen'>) => void;
  closeConfirmModal: () => void;

  deferredPrompt: any | null;
  setDeferredPrompt: (prompt: any | null) => void;
  setSidebarSectionState: (sectionId: string, isOpen: boolean) => void;
  setOscilloscopeOpen: (isOpen: boolean) => void;
}

const storeCreator: StateCreator<UIState> = (set) => ({
  activePage: 0,
  activeMainView: 'overview',
  selectedPadIndex: null,
  selectedPads: [],
  isCommitDialogOpen: false,
  notifications: [],
  isLeftPaneCollapsed: false,
  selectedFile: null,
  activeDoc: null,

  activeDocSection: null,
  hoveredDocSection: null,

  helpMode: false,

  isDuplicateModalOpen: false,
  duplicateClusters: [],
  isMobileDrawerOpen: false,
  isOscilloscopeOpen: false,
  confirmModal: {
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  },

  sidebarSectionStates: {},

  deferredPrompt: null,

  setActiveMainView: (view) => set((state) => {
    return { 
      activeMainView: view, 
      activeDoc: null, 
      helpMode: false, 
      activeDocSection: null, 
      hoveredDocSection: null,
      isOscilloscopeOpen: view === 'circuit' ? state.isOscilloscopeOpen : false
    };
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
  setSelectedFile: (file) => set({ selectedFile: file }),
  setActiveDoc: (doc) => set(() => {
    if (doc === null) {
      return { activeDoc: null, activeDocSection: null, helpMode: false, hoveredDocSection: null };
    }
    return { activeDoc: doc, activeDocSection: null };
  }),

  setActiveDocSection: (sectionId) => set({ activeDocSection: sectionId }),
  setHoveredDocSection: (sectionId) => set((state) => {
    // Hover highlights are part of the inline-help affordance. Suppress them
    // entirely when help mode is off so devices behave like normal hardware.
    if (!state.helpMode) {
      return state.hoveredDocSection === null ? state : { hoveredDocSection: null };
    }
    return { hoveredDocSection: sectionId };
  }),

  setHelpMode: (enabled) => set({ helpMode: enabled }),
  toggleHelpMode: () => set((state) => ({ helpMode: !state.helpMode })),

  openDuplicateModal: (clusters) => set({ isDuplicateModalOpen: true, duplicateClusters: clusters }),
  closeDuplicateModal: () => set({ isDuplicateModalOpen: false, duplicateClusters: [] }),

  showConfirmModal: (options) => set({ confirmModal: { ...options, isOpen: true } }),
  closeConfirmModal: () => set((state) => ({ confirmModal: { ...state.confirmModal, isOpen: false } })),

  setMobileDrawerOpen: (isOpen) => set({ isMobileDrawerOpen: isOpen }),
  setOscilloscopeOpen: (isOpen) => set({ isOscilloscopeOpen: isOpen }),

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),

  setSidebarSectionState: (sectionId, isOpen) => set((state) => ({
    sidebarSectionStates: {
      ...state.sidebarSectionStates,
      [sectionId]: isOpen
    }
  }))
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
        sidebarSectionStates: state.sidebarSectionStates
      })
    }
  )
);
