import { Monitor, Moon, Sun } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import type { Theme } from "@/stores/ui-preferences-store";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";
import { cn } from "@/lib/utils/cn";

const order: Theme[] = ["light", "dark", "system"];
const icons: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const theme = useUiPreferencesStore((state) => state.theme);
  const setTheme = useUiPreferencesStore((state) => state.setTheme);
  const Icon = icons[theme];

  return (
    <Tooltip content={`Theme: ${theme}`}>
      <button
        type="button"
        onClick={() => setTheme(order[(order.indexOf(theme) + 1) % order.length] ?? "system")}
        aria-label={`Theme: ${theme}. Click to change.`}
        className={cn(
          "text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-sm",
        )}
      >
        <Icon size={15} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
