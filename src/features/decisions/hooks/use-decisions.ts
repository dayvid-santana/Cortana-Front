import { useQuery } from "@tanstack/react-query";

import type { DecisionFilters } from "@/features/decisions/api/queries";
import { decisionKeys, fetchDecision, fetchDecisions } from "@/features/decisions/api/queries";

export function useDecisions(projectId: string, filters: DecisionFilters) {
  return useQuery({
    queryKey: decisionKeys.list(projectId, filters),
    queryFn: () => fetchDecisions(projectId, filters),
  });
}

export function useDecision(projectId: string, decisionId: string) {
  return useQuery({
    queryKey: decisionKeys.detail(projectId, decisionId),
    queryFn: () => fetchDecision(projectId, decisionId),
  });
}
