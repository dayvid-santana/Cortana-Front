import { PanelRightClose } from "lucide-react";
import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

interface ContextPanelProps {
  title: string;
  children: ReactNode;
}

export function ContextPanel({ title, children }: ContextPanelProps) {
  const setContextPanelOpen = useUiPreferencesStore((state) => state.setContextPanelOpen);

  return (
    <aside aria-label={title} className="border-border bg-surface flex h-full flex-col border-l">
      <div className="border-border flex h-9 shrink-0 items-center justify-between border-b px-2.5">
        <h2 className="text-muted-foreground text-[12px] font-semibold tracking-wide uppercase">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setContextPanelOpen(false)}
          aria-label="Collapse context panel"
          className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded-sm"
        >
          <PanelRightClose size={14} aria-hidden="true" />
        </button>
      </div>
      <ScrollArea className="flex-1 p-2.5">{children}</ScrollArea>
    </aside>
  );
}
