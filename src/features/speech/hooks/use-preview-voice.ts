import { useMutation } from "@tanstack/react-query";

import { previewVoice } from "@/features/speech/api/queries";

export function usePreviewVoice() {
  return useMutation({
    mutationFn: (voiceId: string) => previewVoice(voiceId),
  });
}
