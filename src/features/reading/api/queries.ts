import { apiClient, unwrap } from "@/lib/api/client";
import type { CreateReadingSessionInput } from "@/features/reading/types";

export const readingKeys = {
  session: (sessionId: string) => ["reading-sessions", sessionId] as const,
};

export async function createReadingSession(projectId: string, input: CreateReadingSessionInput) {
  const body: {
    filePath: string;
    commitHash: string;
    mode: CreateReadingSessionInput["mode"];
    skipCode: boolean;
    changesOnly: boolean;
    voice?: string;
    startLine?: number;
    endLine?: number;
  } = {
    filePath: input.filePath,
    commitHash: input.commitHash,
    mode: input.mode,
    skipCode: input.skipCode,
    changesOnly: input.changesOnly,
  };
  if (input.voice !== undefined) body.voice = input.voice;
  if (input.startLine !== undefined) body.startLine = input.startLine;
  if (input.endLine !== undefined) body.endLine = input.endLine;

  return unwrap(
    apiClient.POST("/projects/{projectId}/reading-sessions", {
      params: { path: { projectId } },
      body,
    }),
  );
}

export async function stopReadingSession(sessionId: string): Promise<void> {
  await apiClient.POST("/reading-sessions/{sessionId}/stop", { params: { path: { sessionId } } });
}
