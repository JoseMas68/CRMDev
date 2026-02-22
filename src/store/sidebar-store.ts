import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    setCollapse: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setCollapse: (value) => set({ isCollapsed: value }),
        }),
        {
            name: "crm-sidebar-storage",
        }
    )
);
