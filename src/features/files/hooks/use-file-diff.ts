import { useQuery } from "@tanstack/react-query";

import { fetchFileDiff, fileKeys } from "@/features/files/api/queries";

export function useFileDiff(
  projectId: string,
  commit: string | undefined,
  path: string | undefined,
) {
  return useQuery({
    queryKey: fileKeys.diff(projectId, commit ?? "", path ?? ""),
    queryFn: () => fetchFileDiff(projectId, commit as string, path as string),
    enabled: Boolean(commit) && Boolean(path),
  });
}
