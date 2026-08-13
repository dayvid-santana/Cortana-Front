import { apiClient, unwrap } from "@/lib/api/client";

export const diagnosticsKeys = {
  health: ["health"] as const,
  diagnostics: ["diagnostics"] as const,
};

export async function fetchHealth() {
  return unwrap(apiClient.GET("/health", {}));
}

export async function fetchDiagnostics() {
  return unwrap(apiClient.GET("/diagnostics", {}));
}
