import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { useDecision } from "@/features/decisions/hooks/use-decisions";
import { shortHash } from "@/lib/formatting/commit";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/decisions/$decisionId")({
  component: DecisionDetailPage,
});

function DecisionDetailPage() {
  const { projectId, decisionId } = Route.useParams();
  const query = useDecision(projectId, decisionId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <Link
        to="/projects/$projectId/decisions"
        params={{ projectId }}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[13px]"
      >
        <ArrowLeft size={13} aria-hidden="true" /> Back to decisions
      </Link>

      {query.status === "pending" ? <LoadingState rows={3} label="Loading decision" /> : null}
      {query.status === "error" ? (
        <ErrorState problem={toDisplayProblem(query.error)} onRetry={() => void query.refetch()} />
      ) : null}

      {query.status === "success" ? (
        <article className="border-border flex flex-col gap-3 rounded-md border p-4">
          <h1 className="text-foreground text-base font-semibold">{query.data.title}</h1>
          <p className="text-muted-foreground text-[13px]">{query.data.description}</p>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success">{query.data.status}</Badge>
            <Badge variant="outline">{query.data.explicitness.replace("_", " ")}</Badge>
            <Badge variant="outline">Confidence: {query.data.confidence}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <dt className="text-muted-foreground">Origin commit</dt>
            <dd className="font-mono">{shortHash(query.data.commitHash)}</dd>
            {query.data.filePath ? (
              <>
                <dt className="text-muted-foreground">File</dt>
                <dd className="font-mono">
                  {query.data.filePath}
                  {query.data.heading ? ` · ${query.data.heading}` : ""}
                </dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">Created</dt>
            <dd title={formatAbsoluteTime(query.data.createdAt)}>
              {formatRelativeTime(query.data.createdAt)}
            </dd>
          </dl>

          {query.data.relatedQuestionIds && query.data.relatedQuestionIds.length > 0 ? (
            <div>
              <h2 className="text-muted-foreground text-[12px] font-semibold tracking-wide uppercase">
                Related questions
              </h2>
              <Link
                to="/projects/$projectId/questions"
                params={{ projectId }}
                className="text-accent mt-1 inline-block text-[13px] hover:underline"
              >
                View related open questions
              </Link>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
