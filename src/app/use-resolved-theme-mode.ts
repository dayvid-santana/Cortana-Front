import { useEffect, useState } from "react";

import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolves "system" down to an actual "light"/"dark", tracking OS changes live. */
export function useResolvedThemeMode(): "light" | "dark" {
  const theme = useUiPreferencesStore((state) => state.theme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  if (theme === "system") {
    return systemDark ? "dark" : "light";
  }
  return theme;
}
