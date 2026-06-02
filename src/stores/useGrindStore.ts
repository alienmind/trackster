import { create } from 'zustand';

interface GrindStore {
  activeDocSection: string | null;
  hoveredDocSection: string | null;
  setActiveDocSection: (section: string | null) => void;
  setHoveredDocSection: (section: string | null) => void;
}

export const useGrindStore = create<GrindStore>((set) => ({
  activeDocSection: null,
  hoveredDocSection: null,
  setActiveDocSection: (section) => set({ activeDocSection: section }),
  setHoveredDocSection: (section) => set({ hoveredDocSection: section }),
}));
