import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSpeechSettings } from "@/features/speech/api/queries";
import { projectKeys } from "@/features/projects/api/queries";
import type { components } from "@/lib/api/schema";

export function useUpdateSpeechSettings(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: components["schemas"]["SpeechSettings"]) =>
      updateSpeechSettings(projectId, settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.status(projectId) });
    },
  });
}
