import { useQuery } from "@tanstack/react-query";

import { fetchFileContent, fileKeys } from "@/features/files/api/queries";

export function useFileContent(
  projectId: string,
  commit: string | undefined,
  path: string | undefined,
  range?: { startLine?: number; endLine?: number },
) {
  return useQuery({
    queryKey: fileKeys.content(projectId, commit ?? "", path ?? "", range),
    queryFn: () => fetchFileContent(projectId, commit as string, path as string, range),
    enabled: Boolean(commit) && Boolean(path),
  });
}
