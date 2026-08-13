import { apiClient, unwrap } from "@/lib/api/client";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
  status: (projectId: string) => [...projectKeys.detail(projectId), "status"] as const,
};

export async function fetchProjects() {
  return unwrap(apiClient.GET("/projects", {}));
}

export async function fetchProject(projectId: string) {
  return unwrap(apiClient.GET("/projects/{projectId}", { params: { path: { projectId } } }));
}

export async function fetchProjectStatus(projectId: string) {
  return unwrap(apiClient.GET("/projects/{projectId}/status", { params: { path: { projectId } } }));
}

export async function createProject(input: { path: string; name?: string | undefined }) {
  const body: { path: string; name?: string } = { path: input.path };
  if (input.name !== undefined) body.name = input.name;
  return unwrap(apiClient.POST("/projects", { body }));
}

export async function scanProject(projectId: string) {
  return unwrap(apiClient.POST("/projects/{projectId}/scan", { params: { path: { projectId } } }));
}
