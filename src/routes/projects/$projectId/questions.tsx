import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { NativeSelect } from "@/components/ui/select";
import { QuestionCard } from "@/features/questions/components/question-card";
import type { QuestionFilters } from "@/features/questions/api/queries";
import { useQuestions } from "@/features/questions/hooks/use-questions";
import type { QuestionsSearch } from "@/features/questions/schemas/search";
import { questionsSearchSchema } from "@/features/questions/schemas/search";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/questions")({
  validateSearch: questionsSearchSchema,
  component: QuestionsPage,
});

function QuestionsPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters: QuestionFilters = {};
  if (search.status !== undefined) filters.status = search.status;
  const query = useQuestions(projectId, filters);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <PageHeader
        title="Open questions"
        description="Unresolved questions surfaced while reading documentation."
        actions={
          <NativeSelect
            aria-label="Filter by status"
            value={search.status ?? ""}
            onChange={(event) =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  status: (event.target.value || undefined) as QuestionsSearch["status"],
                }),
              })
            }
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </NativeSelect>
        }
      />

      {query.status === "pending" ? <LoadingState rows={4} label="Loading questions" /> : null}
      {query.status === "error" ? (
        <ErrorState problem={toDisplayProblem(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.status === "success" && query.data.items.length === 0 ? (
        <EmptyState
          title="No open questions"
          description="Questions raised while reading docs will show up here."
        />
      ) : null}
      {query.status === "success" && query.data.items.length > 0 ? (
        <ul className="border-border rounded-md border">
          {query.data.items.map((question) => (
            <QuestionCard key={question.id} projectId={projectId} question={question} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
