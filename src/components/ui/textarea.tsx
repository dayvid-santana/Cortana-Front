import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-sm border px-2 py-1.5 text-[13px] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
