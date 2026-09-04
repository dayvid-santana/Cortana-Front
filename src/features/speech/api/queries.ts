import { apiBaseUrl, apiClient, unwrap } from "@/lib/api/client";
import { ApiError, NetworkError } from "@/lib/api/errors";
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

/**
 * Narra `text` com o provider/voz configurados do projeto (`.devmate/config.toml`) e
 * devolve uma URL de blob tocável num `<audio>`. Diferente de `previewVoice`
 * (texto fixo, qualquer voz por id), a resposta aqui é áudio bruto, não JSON — por
 * isso não passa por `unwrap`/`apiClient`, que esperam um corpo JSON.
 */
export async function speakText(projectId: string, text: string): Promise<string> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${apiBaseUrl}/projects/${projectId}/speech/say`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown network failure";
    throw new NetworkError("network", message);
  }
  if (!response.ok) {
    const problem: Partial<components["schemas"]["ApiProblem"]> = await response
      .json()
      .catch(() => ({}));
    throw new ApiError({ title: "Request failed", status: response.status, ...problem });
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
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
