import { apiClient, unwrap } from "@/lib/api/client";

export const chatKeys = {
  threads: (projectId: string, commit?: string) =>
    ["projects", projectId, "threads", commit ?? "all"] as const,
  messages: (threadId: string) => ["threads", threadId, "messages"] as const,
};

export async function fetchThreads(projectId: string, commit?: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/threads", {
      params: { path: { projectId }, query: commit ? { commit } : {} },
    }),
  );
}

export async function fetchThreadMessages(projectId: string, threadId: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/threads/{threadId}/messages", {
      params: { path: { projectId, threadId } },
    }),
  );
}

export async function createChatRun(
  projectId: string,
  input: { threadId?: string; commitHash: string; scope: "docs" | "code"; message: string },
) {
  return unwrap(
    apiClient.POST("/projects/{projectId}/chat/runs", {
      params: { path: { projectId } },
      body: input,
    }),
  );
}

export async function cancelChatRun(runId: string) {
  return unwrap(apiClient.POST("/runs/{runId}/cancel", { params: { path: { runId } } }));
}
