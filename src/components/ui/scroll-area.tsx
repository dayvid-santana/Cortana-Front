import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface ScrollAreaProps extends ComponentProps<typeof BaseScrollArea.Viewport> {
  children: ReactNode;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root className="relative h-full overflow-hidden">
      <BaseScrollArea.Viewport className={cn("h-full w-full", className)} {...props}>
        {children}
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none p-0.5 opacity-0 transition-opacity select-none data-[hovering]:opacity-100 data-[scrolling]:opacity-100"
      >
        <BaseScrollArea.Thumb className="bg-border flex-1 rounded-full" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  );
}
