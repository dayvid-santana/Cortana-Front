/**
 * Types for the local Cortana agent-runner API (http://127.0.0.1:8765).
 *
 * Cortana is a lightweight local backend, not the contract-first DevMate API
 * in ../schema.d.ts. Its response shapes for agent actions are intentionally
 * modeled loosely (index signatures) rather than pinned to exact field
 * names: the frontend must render only what the API actually returns and
 * never fabricate structure it can't confirm.
 */

export interface CortanaAgent {
  name: string;
  description: string;
  mode: string;
  command: string;
}

export interface CortanaHealth {
  status: string;
  [key: string]: unknown;
}

export interface CortanaSession {
  [key: string]: unknown;
}

export interface AgentContextRequest {
  cwd: string;
  objective: string;
}

export interface AgentAskRequest {
  cwd: string;
  objective: string;
}

export interface AgentReviewRequest {
  cwd: string;
  staged: boolean;
}

export interface AgentTestRequest {
  cwd: string;
}

export interface AgentDebugRequest {
  cwd: string;
  objective: string;
}

export interface GitCommitPlanRequest {
  cwd: string;
}

/** POST /assistant/task-plans body — same shape as AgentAskRequest/AgentContextRequest. */
export interface TaskPlanRequest {
  cwd: string;
  objective: string;
}

/** A plan created by /assistant/task-plans. No write has happened yet. */
export interface TaskPlan {
  id: string;
  project_root: string;
  project_name: string;
  objective: string;
  base_branch: string;
  relevant_files: string[];
  warnings: string[];
  architecture_decision_required: boolean;
  architecture_approved: boolean;
  architecture_decision: string | null;
  requires_confirmation: boolean;
  created_at: string;
}

/** POST /assistant/task-plans/{id}/architecture-approval body. decision must be 10-1000 chars. */
export interface ArchitectureApprovalRequest {
  decision: string;
}

/** POST /assistant/task-plans/{id}/start body. */
export interface JobStartRequest {
  confirmed_write: boolean;
}

export type JobStatus =
  "queued" | "running" | "completed" | "partially_completed" | "failed" | "cancelled" | "blocked";

/** A completed sub-agent step inside a job's results. Field names are not guaranteed by contract. */
export interface JobSubAgentResult {
  agent?: string;
  summary?: string;
  files_read?: string[];
  files_changed?: string[];
  tests_executed?: string[];
  warnings?: string[];
  architecture_decision_required?: boolean;
  next_actions?: string[];
  [key: string]: unknown;
}

/** GET /assistant/jobs/{id} response. Created by /assistant/task-plans/{id}/start. */
export interface AgentJob {
  id: string;
  plan_id: string;
  project_root: string;
  objective: string;
  status: JobStatus;
  phase: string | null;
  branch: string | null;
  worktree_path: string | null;
  worktree_removed: boolean;
  results: JobSubAgentResult[];
  diff: string | null;
  error: string | null;
  cancellation_requested: boolean;
  resumable: boolean;
  resume_attempts: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

/** queued/running are the only statuses a job can still transition out of on its own. */
export const ACTIVE_JOB_STATUSES: ReadonlySet<JobStatus> = new Set(["queued", "running"]);

/** Every non-active status accepts POST /assistant/jobs/{id}/cleanup. */
export const CLEANABLE_JOB_STATUSES: ReadonlySet<JobStatus> = new Set([
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
  "blocked",
]);

export interface ArchitectureDecisionOption {
  id?: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
}

/** Present when Cortana can't proceed without a human architectural call. */
export interface CortanaArchitectureDecision {
  architecture_decision_required: true;
  question?: string;
  summary?: string;
  options?: ArchitectureDecisionOption[];
  [key: string]: unknown;
}

/** A completed agent/action result. Field names are not guaranteed by contract. */
export interface CortanaAgentResult {
  architecture_decision_required?: false;
  [key: string]: unknown;
}

export type CortanaAgentResponse = CortanaArchitectureDecision | CortanaAgentResult;

export function isArchitectureDecisionRequired(
  response: CortanaAgentResponse,
): response is CortanaArchitectureDecision {
  return (
    typeof response === "object" &&
    response !== null &&
    (response as { architecture_decision_required?: unknown }).architecture_decision_required ===
      true
  );
}
