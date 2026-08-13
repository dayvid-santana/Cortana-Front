import { useEffect } from "react";

import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

/**
 * Syncs the persisted theme preference to `data-theme` on <html>. "system"
 * removes the attribute entirely so the prefers-color-scheme media query in
 * tokens.css governs — see that file for the light/dark variable sets.
 */
export function ThemeSync(): null {
  const theme = useUiPreferencesStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return null;
}
