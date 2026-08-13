import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function NativeSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "border-border bg-background text-foreground focus-visible:ring-ring h-8 rounded-sm border px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
