import { apiClient, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type DecisionFilters = {
  status?: components["schemas"]["DecisionStatus"];
  explicitness?: components["schemas"]["DecisionExplicitness"];
};

export const decisionKeys = {
  all: (projectId: string) => ["projects", projectId, "decisions"] as const,
  list: (projectId: string, filters: DecisionFilters) =>
    [...decisionKeys.all(projectId), "list", filters] as const,
  detail: (projectId: string, decisionId: string) =>
    [...decisionKeys.all(projectId), "detail", decisionId] as const,
};

export async function fetchDecisions(projectId: string, filters: DecisionFilters) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/decisions", {
      params: { path: { projectId }, query: filters },
    }),
  );
}

export async function fetchDecision(projectId: string, decisionId: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/decisions/{decisionId}", {
      params: { path: { projectId, decisionId } },
    }),
  );
}
