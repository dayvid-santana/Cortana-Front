import { useInfiniteQuery } from "@tanstack/react-query";

import type { CommitFilters } from "@/features/commits/api/queries";
import { commitKeys, fetchCommits } from "@/features/commits/api/queries";

export function useCommits(projectId: string, filters: CommitFilters) {
  return useInfiniteQuery({
    queryKey: commitKeys.list(projectId, filters),
    queryFn: ({ pageParam }) =>
      fetchCommits(projectId, { ...filters, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
