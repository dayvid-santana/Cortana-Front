import { Link } from "@tanstack/react-router";
import { FileText, GitCompare, HelpCircle, ListChecks, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { shortHash } from "@/lib/formatting/commit";
import { resolveFileViewerTarget, type SourceReference } from "@/lib/utils/citation-navigation";
import { cn } from "@/lib/utils/cn";

const kindIcon: Record<SourceReference["kind"], LucideIcon> = {
  document: FileText,
  document_diff: GitCompare,
  code: FileText,
  decision: ListChecks,
  question: HelpCircle,
  conversation: MessageSquare,
};

interface SourceCitationProps {
  projectId: string;
  source: SourceReference;
}

export function SourceCitation({ projectId, source }: SourceCitationProps) {
  const Icon = kindIcon[source.kind];
  const target = resolveFileViewerTarget(source);

  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[12px]",
        target
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border bg-surface-muted text-muted-foreground",
      )}
    >
      <Icon size={11} aria-hidden="true" />
      {source.label}
    </span>
  );

  if (!target) {
    return (
      <Tooltip content="This citation is missing the information needed to open it.">
        <span aria-disabled="true">{chip}</span>
      </Tooltip>
    );
  }

  return (
    <Link
      to="/projects/$projectId/files"
      params={{ projectId }}
      search={{
        path: target.path,
        commit: target.commit,
        ...(target.startLine !== undefined ? { startLine: target.startLine } : {}),
        ...(target.endLine !== undefined ? { endLine: target.endLine } : {}),
        view: "source",
      }}
      title={`Open ${target.path} at ${shortHash(target.commit)}`}
    >
      {chip}
    </Link>
  );
}
