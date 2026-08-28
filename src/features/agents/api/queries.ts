import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getCortanaAgents,
  getCortanaHealth,
  getCortanaSession,
  postAgentAsk,
  postAgentContext,
  postAgentDebug,
  postAgentReview,
  postAgentTask,
  postAgentTest,
  postGitCommitPlan,
} from "@/lib/api/cortana/client";
import type {
  AgentAskRequest,
  AgentContextRequest,
  AgentDebugRequest,
  AgentReviewRequest,
  AgentTaskRequest,
  AgentTestRequest,
  GitCommitPlanRequest,
} from "@/lib/api/cortana/types";

export const cortanaKeys = {
  health: ["cortana", "health"] as const,
  session: ["cortana", "session"] as const,
  agents: ["cortana", "agents"] as const,
};

const HEALTH_POLL_INTERVAL_MS = 15_000;

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

export function useAgentTask() {
  return useMutation({
    mutationFn: (body: AgentTaskRequest) => postAgentTask(body),
  });
}
