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

export interface AgentTaskRequest {
  cwd: string;
  objective: string;
}

export interface GitCommitPlanRequest {
  cwd: string;
}

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
