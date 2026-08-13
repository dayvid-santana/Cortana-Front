import { useQuery } from "@tanstack/react-query";

import { commitKeys, fetchCommit } from "@/features/commits/api/queries";

export function useCommit(projectId: string, commitHash: string | undefined) {
  return useQuery({
    queryKey: commitKeys.detail(projectId, commitHash ?? ""),
    queryFn: () => fetchCommit(projectId, commitHash as string),
    enabled: Boolean(commitHash),
  });
}
