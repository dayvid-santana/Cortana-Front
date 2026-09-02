import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCortanaAgents,
  getCortanaHealth,
  getCortanaSession,
  getJob,
  postAgentAsk,
  postAgentContext,
  postAgentDebug,
  postAgentReview,
  postAgentTest,
  postArchitectureApproval,
  postGitCommitPlan,
  postJobCancel,
  postJobCleanup,
  postJobResume,
  postTaskPlan,
  postTaskPlanStart,
} from "@/lib/api/cortana/client";
import type {
  AgentAskRequest,
  AgentContextRequest,
  AgentDebugRequest,
  AgentJob,
  AgentReviewRequest,
  AgentTestRequest,
  ArchitectureApprovalRequest,
  GitCommitPlanRequest,
  JobStartRequest,
  TaskPlanRequest,
} from "@/lib/api/cortana/types";
import { ACTIVE_JOB_STATUSES } from "@/lib/api/cortana/types";

export const cortanaKeys = {
  health: ["cortana", "health"] as const,
  session: ["cortana", "session"] as const,
  agents: ["cortana", "agents"] as const,
  job: (jobId: string) => ["cortana", "job", jobId] as const,
};

const HEALTH_POLL_INTERVAL_MS = 15_000;
const JOB_POLL_INTERVAL_MS = 2_000;

export function useCortanaHealth() {
  return useQuery({
    queryKey: cortanaKeys.health,
    queryFn: () => getCortanaHealth(),
    refetchInterval: HEALTH_POLL_INTERVAL_MS,
    retry: 1,
  });
}

export function useCortanaSession() {
  return useQuery({
    queryKey: cortanaKeys.session,
    queryFn: () => getCortanaSession(),
    retry: 1,
  });
}

/** GET /agents is the source of truth for name/description/mode/command — never hardcode this list. */
export function useCortanaAgents() {
  return useQuery({
    queryKey: cortanaKeys.agents,
    queryFn: () => getCortanaAgents(),
  });
}

// The read/analysis actions below run without an extra confirmation step per
// the product spec — only /agent/task (useAgentTask) is gated by a
// confirmation modal in the UI layer.

export function useAgentContext() {
  return useMutation({
    mutationFn: (body: AgentContextRequest) => postAgentContext(body),
  });
}

export function useAgentAsk() {
  return useMutation({
    mutationFn: (body: AgentAskRequest) => postAgentAsk(body),
  });
}

export function useAgentReview() {
  return useMutation({
    mutationFn: (body: AgentReviewRequest) => postAgentReview(body),
  });
}

export function useAgentTest() {
  return useMutation({
    mutationFn: (body: AgentTestRequest) => postAgentTest(body),
  });
}

export function useAgentDebug() {
  return useMutation({
    mutationFn: (body: AgentDebugRequest) => postAgentDebug(body),
  });
}

export function useGitCommitPlan() {
  return useMutation({
    mutationFn: (body: GitCommitPlanRequest) => postGitCommitPlan(body),
  });
}

// Task execution: plan -> optional architecture approval -> start -> poll job.
// See docs/orchestration.md in dev-agent — POST /agent/task is deprecated and
// always rejected, so this is the only working path for a mutating task.

export function useCreateTaskPlan() {
  return useMutation({
    mutationFn: (body: TaskPlanRequest) => postTaskPlan(body),
  });
}

export function useApproveArchitecture() {
  return useMutation({
    mutationFn: ({ planId, ...body }: ArchitectureApprovalRequest & { planId: string }) =>
      postArchitectureApproval(planId, body),
  });
}

export function useStartTaskPlan() {
  return useMutation({
    mutationFn: ({ planId, ...body }: JobStartRequest & { planId: string }) =>
      postTaskPlanStart(planId, body),
  });
}

/** Polls GET /assistant/jobs/{id} until the job leaves queued/running. */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: cortanaKeys.job(jobId ?? ""),
    queryFn: () => getJob(jobId as string),
    enabled: jobId !== undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status !== undefined && !ACTIVE_JOB_STATUSES.has(status)
        ? false
        : JOB_POLL_INTERVAL_MS;
    },
    retry: 1,
  });
}

/**
 * cancel/resume/cleanup all return the job's new state directly — write it into the
 * useJob cache immediately rather than waiting for the next poll. This matters most for
 * resume and cleanup: both can fire from a non-active status (blocked, or any terminal
 * status), where useJob's refetchInterval has already turned itself off, so without this
 * the UI would keep showing the stale pre-mutation state until an unrelated refetch.
 */
function useJobCacheWriter() {
  const queryClient = useQueryClient();
  return (job: AgentJob) => queryClient.setQueryData(cortanaKeys.job(job.id), job);
}

export function useCancelJob() {
  const writeJobCache = useJobCacheWriter();
  return useMutation({
    mutationFn: (jobId: string) => postJobCancel(jobId),
    onSuccess: writeJobCache,
  });
}

export function useResumeJob() {
  const writeJobCache = useJobCacheWriter();
  return useMutation({
    mutationFn: (jobId: string) => postJobResume(jobId),
    onSuccess: writeJobCache,
  });
}

export function useCleanupJob() {
  const writeJobCache = useJobCacheWriter();
  return useMutation({
    mutationFn: (jobId: string) => postJobCleanup(jobId),
    onSuccess: writeJobCache,
  });
}
