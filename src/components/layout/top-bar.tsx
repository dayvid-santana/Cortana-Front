import { Link } from "@tanstack/react-router";
import { PanelLeft, SlidersHorizontal } from "lucide-react";

import { BranchBadge } from "@/features/commits/components/branch-badge";
import { CommitBadge } from "@/features/commits/components/commit-badge";
import { ConnectionIndicator } from "@/components/navigation/connection-indicator";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { commitSubject } from "@/lib/formatting/commit";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

interface TopBarProps {
  projectName?: string;
  projectId?: string;
  branch?: string;
  commitHash?: string;
  commitSubjectText?: string;
}

export function TopBar({
  projectName,
  projectId,
  branch,
  commitHash,
  commitSubjectText,
}: TopBarProps) {
  const toggleSidebar = useUiPreferencesStore((state) => state.toggleSidebar);
  const setCommandPaletteOpen = useUiPreferencesStore((state) => state.setCommandPaletteOpen);

  return (
    <header className="border-border bg-surface flex h-11 shrink-0 items-center gap-2 border-b px-2 text-[13px]">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-sm lg:hidden"
      >
        <PanelLeft size={15} aria-hidden="true" />
      </button>

      <Link to="/projects" className="text-foreground shrink-0 font-semibold">
        DevMate
      </Link>

      {projectName && projectId ? (
        <>
          <span className="text-muted-foreground">|</span>
          <Link
            to="/projects/$projectId/overview"
            params={{ projectId }}
            className="text-foreground shrink-0 truncate font-medium hover:underline"
          >
            {projectName}
          </Link>
          {branch ? <BranchBadge branch={branch} /> : null}
          {commitHash ? (
            <CommitBadge
              commitHash={commitHash}
              {...(commitSubjectText ? { subject: commitSubjectText } : {})}
            />
          ) : null}
          {commitSubjectText ? (
            <span className="text-muted-foreground hidden min-w-0 flex-1 truncate md:inline">
              {commitSubject(commitSubjectText, 60)}
            </span>
          ) : (
            <span className="flex-1" />
          )}
        </>
      ) : (
        <span className="flex-1" />
      )}

      <ConnectionIndicator />

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="border-border text-muted-foreground hover:bg-surface-muted hidden items-center gap-1.5 rounded-sm border px-2 py-1 text-[12px] sm:inline-flex"
      >
        <SlidersHorizontal size={12} aria-hidden="true" />
        Commands
        <kbd className="border-border bg-surface rounded-sm border px-1 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>

      <ThemeToggle />
    </header>
  );
}
