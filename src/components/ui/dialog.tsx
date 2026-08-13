import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

interface DialogContentProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Hides the title visually while keeping it for screen readers (e.g. command palette). */
  visuallyHideTitle?: boolean;
}

export function DialogContent({
  title,
  description,
  children,
  className,
  visuallyHideTitle,
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <BaseDialog.Popup
        className={cn(
          "border-border bg-surface fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border p-4 shadow-lg outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <BaseDialog.Title
              className={cn("text-sm font-semibold", visuallyHideTitle && "visually-hidden")}
            >
              {title}
            </BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="text-muted-foreground mt-0.5 text-xs">
                {description}
              </BaseDialog.Description>
            ) : null}
          </div>
          <BaseDialog.Close
            aria-label="Close dialog"
            className="text-muted-foreground hover:bg-surface-muted hover:text-foreground rounded-sm p-1"
          >
            <X size={16} aria-hidden="true" />
          </BaseDialog.Close>
        </div>
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
