import { useQuery } from "@tanstack/react-query";

import type { QuestionFilters } from "@/features/questions/api/queries";
import { fetchQuestions, questionKeys } from "@/features/questions/api/queries";

export function useQuestions(projectId: string, filters: QuestionFilters) {
  return useQuery({
    queryKey: questionKeys.list(projectId, filters),
    queryFn: () => fetchQuestions(projectId, filters),
  });
}
