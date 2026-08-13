import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { NativeSelect } from "@/components/ui/select";
import type { DiffViewMode, Theme } from "@/stores/ui-preferences-store";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

export const Route = createFileRoute("/projects/$projectId/settings/general")({
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  const theme = useUiPreferencesStore((state) => state.theme);
  const setTheme = useUiPreferencesStore((state) => state.setTheme);
  const diffViewMode = useUiPreferencesStore((state) => state.diffViewMode);
  const setDiffViewMode = useUiPreferencesStore((state) => state.setDiffViewMode);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="General"
        description="Local display preferences, stored only in this browser."
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="theme-select" className="text-foreground text-[13px] font-medium">
          Theme
        </label>
        <NativeSelect
          id="theme-select"
          value={theme}
          onChange={(event) => setTheme(event.target.value as Theme)}
          className="w-48"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="diff-mode-select" className="text-foreground text-[13px] font-medium">
          Default diff view
        </label>
        <NativeSelect
          id="diff-mode-select"
          value={diffViewMode}
          onChange={(event) => setDiffViewMode(event.target.value as DiffViewMode)}
          className="w-48"
        >
          <option value="unified">Unified</option>
          <option value="split">Split</option>
        </NativeSelect>
        <p className="text-muted-foreground text-[12px]">
          Split view is not implemented in this MVP; unified is used regardless.
        </p>
      </div>
    </div>
  );
}
