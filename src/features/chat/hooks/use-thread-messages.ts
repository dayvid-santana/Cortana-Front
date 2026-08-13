import { useQuery } from "@tanstack/react-query";

import { chatKeys, fetchThreadMessages, fetchThreads } from "@/features/chat/api/queries";

export function useThreads(projectId: string, commit?: string) {
  return useQuery({
    queryKey: chatKeys.threads(projectId, commit),
    queryFn: () => fetchThreads(projectId, commit),
  });
}

export function useThreadMessages(projectId: string, threadId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(threadId ?? ""),
    queryFn: () => fetchThreadMessages(projectId, threadId as string),
    enabled: Boolean(threadId),
  });
}
