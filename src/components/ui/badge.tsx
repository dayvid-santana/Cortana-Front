import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-muted text-foreground",
        docs: "border-docs-scope/30 bg-docs-scope/10 text-docs-scope",
        code: "border-code-scope/30 bg-code-scope/10 text-code-scope",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        danger: "border-danger/30 bg-danger/10 text-danger",
        outline: "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
