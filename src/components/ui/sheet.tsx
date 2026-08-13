import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const SheetRoot = BaseDrawer.Root;
export const SheetTrigger = BaseDrawer.Trigger;
export const SheetClose = BaseDrawer.Close;

interface SheetContentProps {
  title: string;
  side?: "left" | "right" | "bottom";
  children: ReactNode;
  className?: string;
}

const sideClasses: Record<NonNullable<SheetContentProps["side"]>, string> = {
  left: "inset-y-0 left-0 h-full w-[85vw] max-w-sm border-r",
  right: "inset-y-0 right-0 h-full w-[85vw] max-w-sm border-l",
  bottom: "inset-x-0 bottom-0 max-h-[80vh] w-full border-t",
};

export function SheetContent({ title, side = "left", children, className }: SheetContentProps) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="fixed inset-0 z-40 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <BaseDrawer.Popup
        className={cn(
          "border-border bg-surface fixed z-50 flex flex-col p-3 shadow-lg outline-none",
          sideClasses[side],
          className,
        )}
      >
        <BaseDrawer.Title className="visually-hidden">{title}</BaseDrawer.Title>
        {children}
      </BaseDrawer.Popup>
    </BaseDrawer.Portal>
  );
}
