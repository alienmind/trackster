import { create } from 'zustand';

interface GrindStore {
  activeDocSection: string | null;
  setActiveDocSection: (sectionId: string | null) => void;
}

export const useGrindStore = create<GrindStore>((set) => ({
  activeDocSection: null,
  setActiveDocSection: (sectionId) => set({ activeDocSection: sectionId }),
}));
