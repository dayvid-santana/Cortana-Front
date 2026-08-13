import { useQuery } from "@tanstack/react-query";

import { fetchSpeechProviders, fetchVoices, speechKeys } from "@/features/speech/api/queries";

export function useVoices(provider?: string) {
  return useQuery({
    queryKey: speechKeys.voices(provider),
    queryFn: () => fetchVoices(provider),
  });
}

export function useSpeechProviders() {
  return useQuery({
    queryKey: speechKeys.providers,
    queryFn: fetchSpeechProviders,
  });
}
