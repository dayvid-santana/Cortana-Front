import { apiClient, unwrap } from "@/lib/api/client";

export const providerKeys = {
  all: ["providers"] as const,
  detail: (name: string) => [...providerKeys.all, name] as const,
};

export async function fetchProviders() {
  return unwrap(apiClient.GET("/providers", {}));
}

export async function updateProviderSettings(
  projectId: string,
  input: { defaultProvider?: string; defaultModel?: string; taskRouting?: Record<string, string> },
) {
  return unwrap(
    apiClient.PUT("/projects/{projectId}/settings/providers", {
      params: { path: { projectId } },
      body: input,
    }),
  );
}
