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
  commandPaletteOpen: boolean;
  voiceModeEnabled: boolean;
  voiceAutoSend: boolean;
  voiceLanguage: string;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setContextPanelOpen: (open: boolean) => void;
  setContextPanelWidth: (width: number) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setVoiceModeEnabled: (enabled: boolean) => void;
  setVoiceAutoSend: (enabled: boolean) => void;
  setVoiceLanguage: (language: string) => void;
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
      commandPaletteOpen: false,
      voiceModeEnabled: false,
      voiceAutoSend: true,
      voiceLanguage: "pt-BR",
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
      setCommandPaletteOpen: (open) => {
        set({ commandPaletteOpen: open });
      },
      setVoiceModeEnabled: (enabled) => {
        set({ voiceModeEnabled: enabled });
      },
      setVoiceAutoSend: (enabled) => {
        set({ voiceAutoSend: enabled });
      },
      setVoiceLanguage: (language) => {
        set({ voiceLanguage: language });
      },
    }),
    {
      name: "devmate.ui-preferences",
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        contextPanelOpen: state.contextPanelOpen,
        contextPanelWidth: state.contextPanelWidth,
        diffViewMode: state.diffViewMode,
        voiceModeEnabled: state.voiceModeEnabled,
        voiceAutoSend: state.voiceAutoSend,
        voiceLanguage: state.voiceLanguage,
      }),
    },
  ),
);
