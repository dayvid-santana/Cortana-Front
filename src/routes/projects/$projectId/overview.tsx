import { createFileRoute, Link } from "@tanstack/react-router";
import { GitCommitHorizontal, ListChecks, MessageSquare, RefreshCw, Volume2 } from "lucide-react";

import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCommit } from "@/features/commits/hooks/use-commit";
import { useDecisions } from "@/features/decisions/hooks/use-decisions";
import { useProject, useProjectStatus } from "@/features/projects/hooks/use-project";
import { useScanProject } from "@/features/projects/hooks/use-scan-project";
import { useQuestions } from "@/features/questions/hooks/use-questions";
import { commitSubject } from "@/lib/formatting/commit";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";

export const Route = createFileRoute("/projects/$projectId/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const status = useProjectStatus(projectId);
  const commit = useCommit(projectId, project.data?.activeCommitHash);
  const decisions = useDecisions(projectId, { status: "active" });
  const questions = useQuestions(projectId, { status: "open" });
  const scan = useScanProject(projectId);

  if (!project.data) {
    return (
      <div className="p-4">
        <LoadingState rows={4} label="Loading overview" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <PageHeader
        title="Overview"
        description="Operational summary for the active commit."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => scan.mutate()}
            disabled={scan.isPending}
          >
            <RefreshCw
              size={13}
              aria-hidden="true"
              className={scan.isPending ? "animate-spin" : ""}
            />
            {scan.isPending ? "Scanning…" : "Scan project"}
          </Button>
        }
      />

      <section className="border-border rounded-md border p-3">
        <h2 className="text-muted-foreground text-[12px] font-semibold tracking-wide uppercase">
          Active commit
        </h2>
        {commit.data ? (
          <>
            <p className="text-foreground mt-1.5 text-[14px] font-medium">
              {commitSubject(commit.data.subject)}
            </p>
            <p className="text-muted-foreground mt-0.5 font-mono text-[12px]">
              {commit.data.shortHash} · {commit.data.author} ·{" "}
              <time
                dateTime={commit.data.authoredAt}
                title={formatAbsoluteTime(commit.data.authoredAt)}
              >
                {formatRelativeTime(commit.data.authoredAt)}
              </time>
            </p>
            {commit.data.summary ? (
              <p className="text-muted-foreground mt-2 text-[13px]">{commit.data.summary}</p>
            ) : null}
            {commit.data.changedDocPaths && commit.data.changedDocPaths.length > 0 ? (
              <p className="text-foreground mt-2 text-[13px]">
                Docs changed:{" "}
                <span className="font-mono text-[12px]">
                  {commit.data.changedDocPaths.join(", ")}
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground mt-1.5 text-[13px]">
            No active commit yet — run a scan.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border-border rounded-md border p-3">
          <p className="text-muted-foreground text-[12px]">Last scan</p>
          <p className="text-foreground mt-1 text-[13px] font-medium">
            {project.data.lastScanAt ? formatRelativeTime(project.data.lastScanAt) : "Never"}
          </p>
        </div>
        <div className="border-border rounded-md border p-3">
          <p className="text-muted-foreground text-[12px]">Provider</p>
          <p className="text-foreground mt-1 text-[13px] font-medium">
            {status.data?.defaultProvider ?? "—"}
          </p>
        </div>
        <div className="border-border rounded-md border p-3">
          <p className="text-muted-foreground text-[12px]">Voice</p>
          <p className="text-foreground mt-1 text-[13px] font-medium">
            {status.data?.defaultVoice ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border-border rounded-md border p-3">
          <p className="text-muted-foreground text-[12px]">Active decisions</p>
          <p className="text-foreground mt-1 text-lg font-semibold">
            {decisions.data?.items.length ?? "—"}
          </p>
        </div>
        <div className="border-border rounded-md border p-3">
          <p className="text-muted-foreground text-[12px]">Open questions</p>
          <p className="text-foreground mt-1 text-lg font-semibold">
            {questions.data?.items.length ?? "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/projects/$projectId/chat"
          params={{ projectId }}
          search={{
            scope: "docs",
            ...(project.data.activeCommitHash ? { commit: project.data.activeCommitHash } : {}),
          }}
          className={buttonVariants({ size: "sm" })}
        >
          <MessageSquare size={13} aria-hidden="true" /> Chat about this commit
        </Link>
        <Link
          to="/projects/$projectId/files"
          params={{ projectId }}
          search={{
            view: "diff",
            ...(project.data.activeCommitHash ? { commit: project.data.activeCommitHash } : {}),
            path: commit.data?.changedDocPaths?.[0] ?? "",
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <GitCommitHorizontal size={13} aria-hidden="true" /> View changes
        </Link>
        <Link
          to="/projects/$projectId/decisions"
          params={{ projectId }}
          search={{ status: "active" }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ListChecks size={13} aria-hidden="true" /> Open decisions
        </Link>
        {commit.data?.changedDocPaths?.[0] ? (
          <Link
            to="/projects/$projectId/files"
            params={{ projectId }}
            search={{
              view: "source",
              commit: project.data.activeCommitHash ?? "",
              path: commit.data.changedDocPaths[0],
            }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Volume2 size={13} aria-hidden="true" /> Listen to changed docs
          </Link>
        ) : null}
      </div>
    </div>
  );
}
