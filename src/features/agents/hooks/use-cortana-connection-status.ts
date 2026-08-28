import { useCortanaHealth } from "@/features/agents/api/queries";

export type CortanaConnectionState =
  "connected" | "connecting" | "reconnecting" | "disconnected" | "degraded";

export function useCortanaConnectionStatus(): CortanaConnectionState {
  const query = useCortanaHealth();

  if (query.isLoading) return "connecting";
  if (query.isError) return query.data !== undefined ? "reconnecting" : "disconnected";
  return query.data?.status === "degraded" ? "degraded" : "connected";
}
