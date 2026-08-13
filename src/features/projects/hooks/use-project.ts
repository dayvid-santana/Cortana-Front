import { useQuery } from "@tanstack/react-query";

import { fetchProject, fetchProjectStatus, projectKeys } from "@/features/projects/api/queries";

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
  });
}

export function useProjectStatus(projectId: string) {
  return useQuery({
    queryKey: projectKeys.status(projectId),
    queryFn: () => fetchProjectStatus(projectId),
    refetchInterval: 15_000,
  });
}
