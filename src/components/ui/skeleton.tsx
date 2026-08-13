import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      className={cn(
        "bg-surface-muted animate-pulse rounded-sm motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
