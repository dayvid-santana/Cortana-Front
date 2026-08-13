import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type DiffViewMode = "unified" | "split";

interface UiPreferencesState {
  theme: Theme;
  sidebarCollapsed: boolean;
  contextPanelOpen: boolean;
  contextPanelWidth: number;
  diffViewMode: DiffViewMode;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setContextPanelOpen: (open: boolean) => void;
  setContextPanelWidth: (width: number) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
}

/**
 * Persists only transient UI layout/preference state (see module docblock
 * in stores/README-equivalent guidance across the app). Never add project
 * content, messages, or credentials to this store.
 */
export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      contextPanelOpen: true,
      contextPanelWidth: 320,
      diffViewMode: "unified",
      setTheme: (theme) => {
        set({ theme });
      },
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setContextPanelOpen: (open) => {
        set({ contextPanelOpen: open });
      },
      setContextPanelWidth: (width) => {
        set({ contextPanelWidth: Math.min(Math.max(width, 240), 560) });
      },
      setDiffViewMode: (mode) => {
        set({ diffViewMode: mode });
      },
    }),
    {
      name: "devmate.ui-preferences",
      version: 1,
    },
  ),
);
