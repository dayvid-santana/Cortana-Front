import { GitCommitHorizontal } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { shortHash } from "@/lib/formatting/commit";
import { cn } from "@/lib/utils/cn";

interface CommitBadgeProps {
  commitHash: string;
  subject?: string;
  className?: string;
}

export function CommitBadge({ commitHash, subject, className }: CommitBadgeProps) {
  const badge = (
    <span
      className={cn(
        "border-border bg-surface-muted text-foreground inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[12px]",
        className,
      )}
    >
      <GitCommitHorizontal size={12} aria-hidden="true" />
      {shortHash(commitHash)}
    </span>
  );
  return subject ? <Tooltip content={subject}>{badge}</Tooltip> : badge;
}
