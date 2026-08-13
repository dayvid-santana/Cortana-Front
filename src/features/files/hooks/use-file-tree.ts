import { useQuery } from "@tanstack/react-query";

import { fetchFileTree, fileKeys } from "@/features/files/api/queries";

export function useFileTree(projectId: string, commit: string | undefined) {
  return useQuery({
    queryKey: fileKeys.tree(projectId, commit ?? ""),
    queryFn: () => fetchFileTree(projectId, commit as string),
    enabled: Boolean(commit),
  });
}
