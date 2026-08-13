import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface BranchBadgeProps {
  branch: string;
  className?: string;
}

export function BranchBadge({ branch, className }: BranchBadgeProps) {
  return (
    <span
      className={cn(
        "border-border bg-surface-muted text-foreground inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[12px]",
        className,
      )}
    >
      <GitBranch size={12} aria-hidden="true" />
      {branch}
    </span>
  );
}
