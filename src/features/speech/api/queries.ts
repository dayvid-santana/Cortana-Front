import { apiClient, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export const speechKeys = {
  providers: ["speech", "providers"] as const,
  voices: (provider?: string) => ["speech", "voices", provider ?? "all"] as const,
};

export async function fetchSpeechProviders() {
  return unwrap(apiClient.GET("/speech/providers", {}));
}

export async function fetchVoices(provider?: string) {
  return unwrap(
    apiClient.GET("/speech/voices", { params: { query: provider ? { provider } : {} } }),
  );
}

export async function previewVoice(voiceId: string) {
  return unwrap(apiClient.POST("/speech/voices/preview", { body: { voiceId } }));
}

export async function updateSpeechSettings(
  projectId: string,
  settings: components["schemas"]["SpeechSettings"],
) {
  return unwrap(
    apiClient.PUT("/projects/{projectId}/settings/speech", {
      params: { path: { projectId } },
      body: settings,
    }),
  );
}
