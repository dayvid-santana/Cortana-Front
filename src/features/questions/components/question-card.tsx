import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/schema";
import { shortHash } from "@/lib/formatting/commit";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";
import { resolveFileViewerTarget } from "@/lib/utils/citation-navigation";

type Question = components["schemas"]["Question"];

const statusVariant: Record<Question["status"], "warning" | "success" | "outline"> = {
  open: "warning",
  resolved: "success",
  dismissed: "outline",
};

export function QuestionCard({ projectId, question }: { projectId: string; question: Question }) {
  const target =
    question.filePath && question.commitHash
      ? resolveFileViewerTarget({
          id: question.id,
          kind: "question",
          path: question.filePath,
          commitHash: question.commitHash,
          ...(question.startLine !== undefined ? { startLine: question.startLine } : {}),
          ...(question.endLine !== undefined ? { endLine: question.endLine } : {}),
          ...(question.heading !== undefined ? { heading: question.heading } : {}),
          label: question.filePath,
          valid: true,
        })
      : null;

  return (
    <li className="border-border border-b px-3 py-3 text-[13px] last:border-b-0">
      <p className="text-foreground font-medium">{question.question}</p>
      {question.resolution ? (
        <p className="text-muted-foreground mt-1 text-[13px]">{question.resolution}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={statusVariant[question.status]}>{question.status}</Badge>
        {target ? (
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
            className="text-accent font-mono text-[12px] hover:underline"
          >
            {question.filePath}
            {question.heading ? ` · ${question.heading}` : ""}
          </Link>
        ) : null}
        <span className="text-muted-foreground font-mono text-[12px]">
          {shortHash(question.commitHash)}
        </span>
        <time
          dateTime={question.createdAt}
          title={formatAbsoluteTime(question.createdAt)}
          className="text-muted-foreground text-[12px]"
        >
          {formatRelativeTime(question.createdAt)}
        </time>
      </div>
    </li>
  );
}
