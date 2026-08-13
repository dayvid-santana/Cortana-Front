import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchProviders,
  providerKeys,
  updateProviderSettings,
} from "@/features/providers/api/queries";
import { projectKeys } from "@/features/projects/api/queries";

export function useProviders() {
  return useQuery({
    queryKey: providerKeys.all,
    queryFn: fetchProviders,
  });
}

export function useUpdateProviderSettings(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      defaultProvider?: string;
      defaultModel?: string;
      taskRouting?: Record<string, string>;
    }) => updateProviderSettings(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.status(projectId) });
    },
  });
}
