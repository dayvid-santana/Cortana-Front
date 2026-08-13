import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  FileText,
  FolderGit2,
  GitCommitHorizontal,
  ListChecks,
  Mic,
  Moon,
  RadioTower,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: typeof FileText;
  run: () => void;
}

export function CommandPalette() {
  const open = useUiPreferencesStore((state) => state.commandPaletteOpen);
  const setOpen = useUiPreferencesStore((state) => state.setCommandPaletteOpen);
  const theme = useUiPreferencesStore((state) => state.theme);
  const setTheme = useUiPreferencesStore((state) => state.setTheme);
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const projectId = "projectId" in params ? params.projectId : undefined;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handleOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleOpenChange is re-created each render but only reads current `open`/refs; re-subscribing on every keystroke elsewhere would be wasteful and isn't needed since `open` is already the effect's dependency.
  }, [open]);

  const actions = useMemo<PaletteAction[]>(() => {
    const close = (fn: () => void) => () => {
      fn();
      setOpen(false);
    };
    const list: PaletteAction[] = [
      {
        id: "projects",
        label: "Open projects",
        icon: FolderGit2,
        run: close(() => navigate({ to: "/projects" })),
      },
      {
        id: "theme",
        label: `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
        icon: theme === "dark" ? Sun : Moon,
        run: close(() => setTheme(theme === "dark" ? "light" : "dark")),
      },
    ];
    if (projectId) {
      list.push(
        {
          id: "chat",
          label: "Go to Chat",
          icon: RadioTower,
          run: close(() => navigate({ to: "/projects/$projectId/chat", params: { projectId } })),
        },
        {
          id: "timeline",
          label: "Go to Timeline",
          icon: GitCommitHorizontal,
          run: close(() =>
            navigate({ to: "/projects/$projectId/timeline", params: { projectId } }),
          ),
        },
        {
          id: "files",
          label: "Go to Files",
          icon: FileText,
          run: close(() => navigate({ to: "/projects/$projectId/files", params: { projectId } })),
        },
        {
          id: "decisions",
          label: "Go to Decisions",
          icon: ListChecks,
          run: close(() =>
            navigate({ to: "/projects/$projectId/decisions", params: { projectId } }),
          ),
        },
        {
          id: "diagnostics",
          label: "Open diagnostics",
          icon: RadioTower,
          run: close(() =>
            navigate({ to: "/projects/$projectId/settings/diagnostics", params: { projectId } }),
          ),
        },
        {
          id: "voice",
          label: "Choose voice",
          icon: Mic,
          run: close(() =>
            navigate({ to: "/projects/$projectId/settings/speech", params: { projectId } }),
          ),
        },
      );
    }
    return list;
  }, [navigate, projectId, setOpen, setTheme, theme]);

  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <BaseDialog.Root open={open} onOpenChange={handleOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <BaseDialog.Popup className="border-border bg-surface fixed top-[20vh] left-1/2 z-50 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-md border shadow-lg outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <BaseDialog.Title className="visually-hidden">Command palette</BaseDialog.Title>
          <BaseDialog.Description className="visually-hidden">
            Search and run DevMate commands
          </BaseDialog.Description>
          <div className="border-border border-b p-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a command…"
              aria-label="Search commands"
            />
          </div>
          <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-6 text-center text-[13px]">
                No matching commands
              </li>
            ) : (
              filtered.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={action.run}
                    className="text-foreground hover:bg-surface-muted focus-visible:bg-surface-muted flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-[13px] focus-visible:outline-none"
                  >
                    <action.icon size={14} aria-hidden="true" className="text-muted-foreground" />
                    {action.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
