import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectKeys, scanProject } from "@/features/projects/api/queries";
import { commitKeys } from "@/features/commits/api/queries";

export function useScanProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => scanProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.status(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: commitKeys.all(projectId) });
    },
  });
}
