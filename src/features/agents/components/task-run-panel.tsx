import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { AgentResultPanel } from "@/features/agents/components/agent-result-panel";
import { AgentTaskConfirmDialog } from "@/features/agents/components/agent-task-confirm-dialog";
import {
  useApproveArchitecture,
  useCancelJob,
  useCleanupJob,
  useCreateTaskPlan,
  useJob,
  useResumeJob,
  useStartTaskPlan,
} from "@/features/agents/api/queries";
import { toDisplayCortanaProblem } from "@/lib/api/cortana/errors";
import type { AgentJob, CortanaAgentResult, TaskPlan } from "@/lib/api/cortana/types";
import { ACTIVE_JOB_STATUSES, CLEANABLE_JOB_STATUSES } from "@/lib/api/cortana/types";

interface TaskRunPanelProps {
  cwd: string;
  objective: string;
  canSubmit: boolean;
}

const DECISION_MIN = 10;
const DECISION_MAX = 1000;

const JOB_STATUS_LABEL: Record<AgentJob["status"], string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  partially_completed: "Partially completed",
  failed: "Failed",
  cancelled: "Cancelled",
  blocked: "Blocked",
};

export function TaskRunPanel({ cwd, objective, canSubmit }: TaskRunPanelProps) {
  const [plan, setPlan] = useState<TaskPlan | undefined>(undefined);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [cleanupConfirming, setCleanupConfirming] = useState(false);

  const createPlan = useCreateTaskPlan();
  const approveArchitecture = useApproveArchitecture();
  const startPlan = useStartTaskPlan();
  const job = useJob(jobId);
  const cancelJob = useCancelJob();
  const resumeJob = useResumeJob();
  const cleanupJob = useCleanupJob();

  function reset() {
    setPlan(undefined);
    setJobId(undefined);
    setConfirmOpen(false);
    setDecision("");
    setCleanupConfirming(false);
    createPlan.reset();
    approveArchitecture.reset();
    startPlan.reset();
  }

  function requestPlan() {
    if (!canSubmit) return;
    createPlan.mutate({ cwd, objective }, { onSuccess: (created) => setPlan(created) });
  }

  function submitDecision() {
    if (!plan || decision.trim().length < DECISION_MIN) return;
    approveArchitecture.mutate(
      { planId: plan.id, decision: decision.trim() },
      { onSuccess: (updated) => setPlan(updated) },
    );
  }

  function confirmStart() {
    if (!plan) return;
    startPlan.mutate(
      { planId: plan.id, confirmed_write: true },
      {
        onSuccess: (created) => {
          setConfirmOpen(false);
          setJobId(created.id);
        },
      },
    );
  }

  const needsArchitectureDecision =
    plan !== undefined && plan.architecture_decision_required && !plan.architecture_approved;
  const planReadyToStart = plan !== undefined && !needsArchitectureDecision && jobId === undefined;

  // Step 1: no plan yet.
  if (plan === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          onClick={requestPlan}
          disabled={!canSubmit || createPlan.isPending}
          variant="danger"
        >
          {createPlan.isPending ? "Planning…" : "Plan task"}
        </Button>
        {createPlan.isPending ? <LoadingState rows={2} label="Creating task plan" /> : null}
        {createPlan.isError ? (
          <ErrorState problem={toDisplayCortanaProblem(createPlan.error)} onRetry={requestPlan} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">plan {plan.id}</Badge>
        <Badge variant="outline">base: {plan.base_branch}</Badge>
      </div>

      {plan.warnings.length > 0 ? (
        <ul className="border-warning/30 bg-warning/5 text-warning flex flex-col gap-1 rounded-sm border p-2 text-[12px]">
          {plan.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {needsArchitectureDecision ? (
        <div className="border-warning/30 bg-warning/5 flex flex-col gap-2 rounded-sm border p-3">
          <p className="text-warning text-[13px] font-medium">
            This task touches a structural concern. Record the architectural decision before it can
            run.
          </p>
          <Textarea
            rows={3}
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            placeholder={`Explain the decision (${DECISION_MIN}-${DECISION_MAX} characters)…`}
            disabled={approveArchitecture.isPending}
          />
          <div>
            <Button
              size="sm"
              onClick={submitDecision}
              disabled={
                approveArchitecture.isPending ||
                decision.trim().length < DECISION_MIN ||
                decision.trim().length > DECISION_MAX
              }
            >
              {approveArchitecture.isPending ? "Recording…" : "Record decision"}
            </Button>
          </div>
          {approveArchitecture.isError ? (
            <ErrorState
              problem={toDisplayCortanaProblem(approveArchitecture.error)}
              onRetry={submitDecision}
            />
          ) : null}
        </div>
      ) : null}

      {planReadyToStart ? (
        <div>
          <Button onClick={() => setConfirmOpen(true)} variant="danger">
            Run task
          </Button>
          <AgentTaskConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            objective={plan.objective}
            cwd={plan.project_root}
            pending={startPlan.isPending}
            onConfirm={confirmStart}
          />
          {startPlan.isError ? (
            <ErrorState problem={toDisplayCortanaProblem(startPlan.error)} onRetry={confirmStart} />
          ) : null}
        </div>
      ) : null}

      {jobId !== undefined ? (
        <JobPanel
          jobId={jobId}
          job={job.data}
          isLoading={job.isLoading}
          isError={job.isError}
          error={job.error}
          onCancel={() => cancelJob.mutate(jobId)}
          cancelPending={cancelJob.isPending}
          onResume={() => resumeJob.mutate(jobId)}
          resumePending={resumeJob.isPending}
          onCleanup={() =>
            cleanupJob.mutate(jobId, { onSuccess: () => setCleanupConfirming(false) })
          }
          cleanupPending={cleanupJob.isPending}
          cleanupConfirming={cleanupConfirming}
          onCleanupRequest={() => setCleanupConfirming(true)}
          onCleanupCancel={() => setCleanupConfirming(false)}
        />
      ) : null}

      {jobId !== undefined &&
      job.data !== undefined &&
      !ACTIVE_JOB_STATUSES.has(job.data.status) ? (
        <div>
          <Button variant="outline" size="sm" onClick={reset}>
            Start another task
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface JobPanelProps {
  jobId: string;
  job: AgentJob | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onCancel: () => void;
  cancelPending: boolean;
  onResume: () => void;
  resumePending: boolean;
  onCleanup: () => void;
  cleanupPending: boolean;
  cleanupConfirming: boolean;
  onCleanupRequest: () => void;
  onCleanupCancel: () => void;
}

function JobPanel({
  jobId,
  job,
  isLoading,
  isError,
  error,
  onCancel,
  cancelPending,
  onResume,
  resumePending,
  onCleanup,
  cleanupPending,
  cleanupConfirming,
  onCleanupRequest,
  onCleanupCancel,
}: JobPanelProps) {
  if (isLoading && job === undefined) {
    return <LoadingState rows={3} label="Loading job status" />;
  }
  if (isError && job === undefined) {
    return <ErrorState problem={toDisplayCortanaProblem(error)} />;
  }
  if (job === undefined) return null;

  const isActive = ACTIVE_JOB_STATUSES.has(job.status);
  const canCleanup = CLEANABLE_JOB_STATUSES.has(job.status) && !job.worktree_removed;

  return (
    <div className="border-border flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">job {jobId}</Badge>
        <Badge variant={statusVariant(job.status)}>{JOB_STATUS_LABEL[job.status]}</Badge>
        {job.phase ? <Badge variant="outline">{job.phase}</Badge> : null}
        {job.branch ? (
          <span className="text-muted-foreground text-[12px]">{job.branch}</span>
        ) : null}
      </div>

      {isActive ? (
        <div>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={cancelPending}>
            {cancelPending ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      ) : null}

      {job.status === "blocked" && job.resumable ? (
        <div>
          <Button size="sm" onClick={onResume} disabled={resumePending}>
            {resumePending ? "Resuming…" : "Resume"}
          </Button>
        </div>
      ) : null}

      {job.error ? <p className="text-danger text-[13px]">{job.error}</p> : null}

      {job.results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {job.results.map((result, index) => (
            <AgentResultPanel
              key={`${result.agent ?? "result"}-${index}`}
              result={result as unknown as CortanaAgentResult}
            />
          ))}
        </div>
      ) : null}

      {job.diff ? (
        <details className="border-border rounded-sm border">
          <summary className="text-muted-foreground cursor-pointer px-2 py-1.5 text-[12px] font-medium">
            Diff
          </summary>
          <pre className="text-foreground max-h-96 overflow-auto px-2 pb-2 text-[11px]">
            {job.diff}
          </pre>
        </details>
      ) : null}

      {canCleanup ? (
        cleanupConfirming ? (
          <div className="border-warning/30 bg-warning/5 flex flex-col gap-2 rounded-sm border p-2">
            <p className="text-warning text-[13px]">
              This removes the worktree at {job.worktree_path ?? "the job's worktree"} and discards
              any uncommitted changes in it. The branch itself is kept.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCleanupCancel}
                disabled={cleanupPending}
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={onCleanup} disabled={cleanupPending}>
                {cleanupPending ? "Cleaning up…" : "Confirm cleanup"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button variant="outline" size="sm" onClick={onCleanupRequest}>
              Clean up worktree
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}

function statusVariant(status: AgentJob["status"]): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "partially_completed":
    case "blocked":
      return "warning";
    case "failed":
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}
