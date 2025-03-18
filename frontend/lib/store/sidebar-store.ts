import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: true, // Default state
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'sidebar-storage', // unique name for localStorage
    }
  )
); 