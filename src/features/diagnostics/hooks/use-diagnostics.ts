import { useQuery } from "@tanstack/react-query";

import { diagnosticsKeys, fetchDiagnostics } from "@/features/diagnostics/api/queries";

export function useDiagnostics() {
  return useQuery({
    queryKey: diagnosticsKeys.diagnostics,
    queryFn: fetchDiagnostics,
    refetchInterval: 30_000,
  });
}
