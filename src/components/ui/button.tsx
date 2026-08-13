import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-surface-muted",
        ghost: "bg-transparent hover:bg-surface-muted",
        danger: "bg-danger text-danger-foreground hover:opacity-90",
      },
      size: {
        sm: "h-7 px-2",
        md: "h-8 px-3",
        icon: "h-7 w-7 shrink-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
