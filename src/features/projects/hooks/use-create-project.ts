import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProject, projectKeys } from "@/features/projects/api/queries";

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
