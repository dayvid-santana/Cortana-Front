import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { NativeSelect } from "@/components/ui/select";
import { DecisionCard } from "@/features/decisions/components/decision-card";
import type { DecisionFilters } from "@/features/decisions/api/queries";
import { useDecisions } from "@/features/decisions/hooks/use-decisions";
import type { DecisionsSearch } from "@/features/decisions/schemas/search";
import { decisionsSearchSchema } from "@/features/decisions/schemas/search";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/decisions")({
  validateSearch: decisionsSearchSchema,
  component: DecisionsPage,
});

function DecisionsPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters: DecisionFilters = {};
  if (search.status !== undefined) filters.status = search.status;
  if (search.explicitness !== undefined) filters.explicitness = search.explicitness;
  const query = useDecisions(projectId, filters);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <PageHeader
        title="Decisions"
        description="Explicit and inferred decisions detected from documentation and commits."
        actions={
          <div className="flex items-center gap-2">
            <NativeSelect
              aria-label="Filter by status"
              value={search.status ?? ""}
              onChange={(event) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    status: (event.target.value || undefined) as DecisionsSearch["status"],
                  }),
                })
              }
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="candidate">Candidate</option>
              <option value="superseded">Superseded</option>
              <option value="revoked">Revoked</option>
            </NativeSelect>
            <NativeSelect
              aria-label="Filter by explicitness"
              value={search.explicitness ?? ""}
              onChange={(event) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    explicitness: (event.target.value ||
                      undefined) as DecisionsSearch["explicitness"],
                  }),
                })
              }
            >
              <option value="">All sources</option>
              <option value="explicit">Explicit</option>
              <option value="inferred">Inferred</option>
              <option value="user_confirmed">User confirmed</option>
            </NativeSelect>
          </div>
        }
      />

      {query.status === "pending" ? <LoadingState rows={4} label="Loading decisions" /> : null}
      {query.status === "error" ? (
        <ErrorState problem={toDisplayProblem(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.status === "success" && query.data.items.length === 0 ? (
        <EmptyState
          title="No active decisions were found"
          description="Try a different filter, or run a scan."
        />
      ) : null}
      {query.status === "success" && query.data.items.length > 0 ? (
        <ul className="border-border rounded-md border">
          {query.data.items.map((decision) => (
            <DecisionCard key={decision.id} projectId={projectId} decision={decision} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
