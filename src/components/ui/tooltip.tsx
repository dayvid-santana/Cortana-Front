import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const TooltipProvider = BaseTooltip.Provider;

interface SimpleTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/** Standard label tooltip: hover/focus reveal, positioned relative to trigger. */
export function Tooltip({ content, children, side = "top", className }: SimpleTooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={<span className="inline-flex" />}>
        {children}
      </BaseTooltip.Trigger>
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup
            className={cn(
              "border-border bg-surface text-foreground z-50 rounded-sm border px-2 py-1 text-[12px] shadow-md",
              className,
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
