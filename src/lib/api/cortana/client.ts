import { CortanaApiError, CortanaNetworkError } from "@/lib/api/cortana/errors";
import type { CortanaProblem } from "@/lib/api/cortana/errors";
import type {
  AgentAskRequest,
  AgentContextRequest,
  AgentDebugRequest,
  AgentJob,
  AgentReviewRequest,
  AgentTestRequest,
  ArchitectureApprovalRequest,
  CortanaAgent,
  CortanaAgentResponse,
  CortanaHealth,
  CortanaSession,
  GitCommitPlanRequest,
  JobStartRequest,
  TaskPlan,
  TaskPlanRequest,
} from "@/lib/api/cortana/types";

/**
 * Cortana is a local-only agent-runner service. It is never proxied and
 * never mocked through the app's own /api/v1 origin — the frontend talks to
 * it directly at a fixed loopback address, which must never be pointed at a
 * remote host. The base URL is only configurable in dev builds, for
 * developers running Cortana on a non-default local port.
 */
const DEFAULT_BASE_URL = "http://127.0.0.1:8765";
/** Cheap, no-Codex calls: health/session/agent-list, and job-status polling. */
const DEFAULT_TIMEOUT_MS = 20_000;
/**
 * Every read-only agent action (context/ask/review/test/debug/commit-plan) still runs a
 * real Codex CLI invocation server-side — a review of a real diff has been measured at
 * ~110s. 20s made every real call look like a timeout; this is generous enough for that
 * without being as long as a full write pipeline.
 */
const AGENT_ACTION_TIMEOUT_MS = 180_000;
/** Starting a task plan can create a worktree and run Codex end to end — the whole write pipeline. */
const TASK_START_TIMEOUT_MS = 300_000;

function resolveBaseUrl(): string {
  if (import.meta.env.DEV) {
    const override = import.meta.env.VITE_CORTANA_API_BASE_URL?.trim();
    if (override) return override.replace(/\/$/, "");
  }
  return DEFAULT_BASE_URL;
}

export interface CortanaRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function request<TResponse>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
  options: CortanaRequestOptions = {},
): Promise<TResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("Timed out", "TimeoutError"));
  }, timeoutMs);

  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener("abort", onExternalAbort);
  }

  let response: Response;
  try {
    response = await globalThis.fetch(`${resolveBaseUrl()}${path}`, {
      method: init.method,
      signal: controller.signal,
      ...(init.body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(init.body) }
        : {}),
    });
  } catch (cause) {
    if (controller.signal.aborted) {
      const cancelledByCaller = externalSignal?.aborted === true;
      throw new CortanaNetworkError(
        cancelledByCaller ? "aborted" : "timeout",
        cancelledByCaller
          ? "The request was cancelled."
          : `Cortana did not respond within ${Math.round(timeoutMs / 1000)}s.`,
      );
    }
    const message = cause instanceof Error ? cause.message : "Unknown network failure";
    throw new CortanaNetworkError("network", message);
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }

  const rawText = await response.text();
  let payload: unknown;
  if (rawText.length > 0) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      throw new CortanaApiError(
        response.ok
          ? { title: "Cortana returned an invalid response", status: response.status }
          : { title: "Request failed", status: response.status, detail: rawText.slice(0, 500) },
      );
    }
  }

  if (!response.ok) {
    throw new CortanaApiError(extractProblem(payload, response.status));
  }

  return (payload ?? {}) as TResponse;
}

function extractProblem(payload: unknown, status: number): CortanaProblem {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const title =
      firstString(record.title, record.error, record.detail, record.message) ?? "Request failed";
    const detail = firstString(record.detail, record.message);
    return detail !== undefined ? { title, status, detail } : { title, status };
  }
  return { title: "Request failed", status };
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function normalizeAgentList(payload: unknown): CortanaAgent[] {
  if (Array.isArray(payload)) return payload as CortanaAgent[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as CortanaAgent[];
    if (Array.isArray(record.agents)) return record.agents as CortanaAgent[];
  }
  return [];
}

export function getCortanaHealth(options?: CortanaRequestOptions): Promise<CortanaHealth> {
  return request<CortanaHealth>("/health", { method: "GET" }, options);
}

export function getCortanaSession(options?: CortanaRequestOptions): Promise<CortanaSession> {
  return request<CortanaSession>("/session", { method: "GET" }, options);
}

export async function getCortanaAgents(options?: CortanaRequestOptions): Promise<CortanaAgent[]> {
  const payload = await request<unknown>("/agents", { method: "GET" }, options);
  return normalizeAgentList(payload);
}

export function postAgentContext(
  body: AgentContextRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/agent/context",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

export function postAgentAsk(
  body: AgentAskRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/agent/ask",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

export function postAgentReview(
  body: AgentReviewRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/agent/review",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

export function postAgentTest(
  body: AgentTestRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/agent/test",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

export function postAgentDebug(
  body: AgentDebugRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/agent/debug",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

export function postGitCommitPlan(
  body: GitCommitPlanRequest,
  options?: CortanaRequestOptions,
): Promise<CortanaAgentResponse> {
  return request<CortanaAgentResponse>(
    "/git/commit-plan",
    { method: "POST", body },
    { timeoutMs: AGENT_ACTION_TIMEOUT_MS, ...options },
  );
}

/**
 * Task execution is a plan → (optional architecture approval) → start → poll job flow.
 * POST /agent/task is deprecated and always rejected by Cortana — never call it.
 */
export function postTaskPlan(
  body: TaskPlanRequest,
  options?: CortanaRequestOptions,
): Promise<TaskPlan> {
  return request<TaskPlan>("/assistant/task-plans", { method: "POST", body }, options);
}

export function postArchitectureApproval(
  planId: string,
  body: ArchitectureApprovalRequest,
  options?: CortanaRequestOptions,
): Promise<TaskPlan> {
  return request<TaskPlan>(
    `/assistant/task-plans/${encodeURIComponent(planId)}/architecture-approval`,
    { method: "POST", body },
    options,
  );
}

/** The only mutating, potentially file-altering action — always confirmed by the UI first. */
export function postTaskPlanStart(
  planId: string,
  body: JobStartRequest,
  options?: CortanaRequestOptions,
): Promise<AgentJob> {
  return request<AgentJob>(
    `/assistant/task-plans/${encodeURIComponent(planId)}/start`,
    { method: "POST", body },
    { timeoutMs: TASK_START_TIMEOUT_MS, ...options },
  );
}

export function getJob(jobId: string, options?: CortanaRequestOptions): Promise<AgentJob> {
  return request<AgentJob>(
    `/assistant/jobs/${encodeURIComponent(jobId)}`,
    { method: "GET" },
    options,
  );
}

export function postJobCancel(jobId: string, options?: CortanaRequestOptions): Promise<AgentJob> {
  return request<AgentJob>(
    `/assistant/jobs/${encodeURIComponent(jobId)}/cancel`,
    { method: "POST", body: {} },
    options,
  );
}

export function postJobResume(jobId: string, options?: CortanaRequestOptions): Promise<AgentJob> {
  return request<AgentJob>(
    `/assistant/jobs/${encodeURIComponent(jobId)}/resume`,
    { method: "POST", body: {} },
    { timeoutMs: TASK_START_TIMEOUT_MS, ...options },
  );
}

export function postJobCleanup(jobId: string, options?: CortanaRequestOptions): Promise<AgentJob> {
  return request<AgentJob>(
    `/assistant/jobs/${encodeURIComponent(jobId)}/cleanup`,
    { method: "POST", body: { confirmed_cleanup: true } },
    options,
  );
}
