import { Link } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed, CircleX, FileText, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { components } from "@/lib/api/schema";
import { commitSubject } from "@/lib/formatting/commit";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";
import { cn } from "@/lib/utils/cn";

type Commit = components["schemas"]["Commit"];

interface CommitTimelineItemProps {
  projectId: string;
  commit: Commit;
  active?: boolean;
}

const statusIcon: Record<Commit["analysisStatus"], typeof CheckCircle2> = {
  analyzed: CheckCircle2,
  pending: CircleDashed,
  failed: CircleX,
};

export function CommitTimelineItem({ projectId, commit, active }: CommitTimelineItemProps) {
  const StatusIcon = statusIcon[commit.analysisStatus];

  return (
    <div
      className={cn(
        "border-border flex flex-col gap-1.5 border-b px-3 py-2.5 text-[13px]",
        active && "bg-surface-muted",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon
            size={14}
            aria-hidden="true"
            className={cn(
              commit.analysisStatus === "analyzed" && "text-success",
              commit.analysisStatus === "failed" && "text-danger",
              commit.analysisStatus === "pending" && "text-muted-foreground",
            )}
          />
          <span className="text-foreground truncate font-medium">
            {commitSubject(commit.subject)}
          </span>
        </div>
        <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
          {commit.shortHash}
        </span>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span>{commit.author}</span>
        <time dateTime={commit.authoredAt} title={formatAbsoluteTime(commit.authoredAt)}>
          {formatRelativeTime(commit.authoredAt)}
        </time>
        {commit.decisionsNew ? (
          <Badge variant="success">+{commit.decisionsNew} decision</Badge>
        ) : null}
        {commit.questionsOpen ? (
          <Badge variant="warning">{commit.questionsOpen} open question</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          to="/projects/$projectId/chat"
          params={{ projectId }}
          search={{ commit: commit.hash, scope: "docs" }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <MessageSquare size={13} aria-hidden="true" /> Chat
        </Link>
        <Link
          to="/projects/$projectId/files"
          params={{ projectId }}
          search={{
            commit: commit.hash,
            view: "diff",
            path: commit.changedDocPaths?.[0] ?? commit.changedCodePaths?.[0] ?? "",
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileText size={13} aria-hidden="true" /> Changes
        </Link>
      </div>
    </div>
  );
}
