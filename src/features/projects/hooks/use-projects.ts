import { useQuery } from "@tanstack/react-query";

import { fetchProjects, projectKeys } from "@/features/projects/api/queries";

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
  });
}
