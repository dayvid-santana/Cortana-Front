import { apiClient, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type QuestionFilters = {
  status?: components["schemas"]["QuestionStatus"];
};

export const questionKeys = {
  all: (projectId: string) => ["projects", projectId, "questions"] as const,
  list: (projectId: string, filters: QuestionFilters) =>
    [...questionKeys.all(projectId), "list", filters] as const,
  detail: (projectId: string, questionId: string) =>
    [...questionKeys.all(projectId), "detail", questionId] as const,
};

export async function fetchQuestions(projectId: string, filters: QuestionFilters) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/questions", {
      params: { path: { projectId }, query: filters },
    }),
  );
}

export async function fetchQuestion(projectId: string, questionId: string) {
  return unwrap(
    apiClient.GET("/projects/{projectId}/questions/{questionId}", {
      params: { path: { projectId, questionId } },
    }),
  );
}
