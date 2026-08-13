import { useMutation } from "@tanstack/react-query";

import { createReadingSession } from "@/features/reading/api/queries";
import type { CreateReadingSessionInput } from "@/features/reading/types";
import { useAudioPlayerStore } from "@/stores/audio-player-store";

export function useCreateReadingSession(projectId: string) {
  const startSession = useAudioPlayerStore((state) => state.startSession);

  return useMutation({
    mutationFn: (input: CreateReadingSessionInput) => createReadingSession(projectId, input),
    onSuccess: (session) => {
      startSession({
        sessionId: session.id,
        projectId: session.projectId,
        filePath: session.filePath,
        commitHash: session.commitHash,
        voice: session.voice,
        mode: session.mode,
        segments: session.segments,
      });
    },
  });
}
