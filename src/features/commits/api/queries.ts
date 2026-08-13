import { apiClient, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type CommitFilters = {
  branch?: string;
  status?: components["schemas"]["CommitAnalysisStatus"];
};

export const commitKeys = {
  all: (projectId: string) => ["projects", projectId, "commits"] as const,
  list: (projectId: string, filters: CommitFilters) =>
    [...commitKeys.all(projectId), "list", filters] as const,
  detail: (projectId: string, commitHash: string) =>
    [...commitKeys.all(projectId), "detail", commitHash] as const,
};

export async function fetchCommits(
  projectId: string,
  params: CommitFilters & { cursor?: string; limit?: number },
) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/commits", {
      params: { path: { projectId }, query: params },
    }),
  );
}

export async function fetchCommit(projectId: string, commitHash: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/commits/{commitHash}", {
      params: { path: { projectId, commitHash } },
    }),
  );
}
