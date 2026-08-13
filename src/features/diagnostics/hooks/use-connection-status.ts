import { useQuery } from "@tanstack/react-query";

import { diagnosticsKeys, fetchHealth } from "@/features/diagnostics/api/queries";

export type ConnectionState =
  "connected" | "connecting" | "reconnecting" | "disconnected" | "degraded";

const POLL_INTERVAL_MS = 20_000;

export function useConnectionStatus(): ConnectionState {
  const query = useQuery({
    queryKey: diagnosticsKeys.health,
    queryFn: fetchHealth,
    refetchInterval: POLL_INTERVAL_MS,
    retry: 1,
  });

  if (query.isLoading) return "connecting";
  if (query.isError) return query.data !== undefined ? "reconnecting" : "disconnected";
  return query.data?.status === "degraded" ? "degraded" : "connected";
}
