import { apiClient, unwrap } from "@/lib/api/client";

export const fileKeys = {
  tree: (projectId: string, commit: string) =>
    ["projects", projectId, "files", "tree", commit] as const,
  content: (
    projectId: string,
    commit: string,
    path: string,
    range?: { startLine?: number; endLine?: number },
  ) => ["projects", projectId, "files", "content", commit, path, range] as const,
  diff: (projectId: string, commit: string, path: string) =>
    ["projects", projectId, "files", "diff", commit, path] as const,
};

export async function fetchFileTree(projectId: string, commit: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/files", {
      params: { path: { projectId }, query: { commit } },
    }),
  );
}

export async function fetchFileContent(
  projectId: string,
  commit: string,
  path: string,
  range?: { startLine?: number; endLine?: number },
) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/files/content", {
      params: { path: { projectId }, query: { commit, path, ...range } },
    }),
  );
}

export async function fetchFileDiff(projectId: string, commit: string, path: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/files/diff", {
      params: { path: { projectId }, query: { commit, path } },
    }),
  );
}
