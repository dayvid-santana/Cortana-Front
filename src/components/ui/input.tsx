import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      className={cn(
        "border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-full rounded-sm border px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
