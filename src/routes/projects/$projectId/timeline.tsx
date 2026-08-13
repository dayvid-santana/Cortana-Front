import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { CommitTimeline } from "@/features/commits/components/commit-timeline";
import type { TimelineSearch } from "@/features/commits/schemas/search";
import { timelineSearchSchema } from "@/features/commits/schemas/search";
import { useProject } from "@/features/projects/hooks/use-project";

export const Route = createFileRoute("/projects/$projectId/timeline")({
  validateSearch: timelineSearchSchema,
  component: TimelinePage,
});

function TimelinePage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const project = useProject(projectId);

  return (
    <div className="flex h-full flex-col p-4">
      <PageHeader
        title="Timeline"
        description="Commit history and their analysis."
        actions={
          <div className="flex items-center gap-2">
            <Input
              aria-label="Branch"
              placeholder="Branch"
              defaultValue={search.branch ?? ""}
              className="w-36"
              onBlur={(event) =>
                void navigate({
                  search: (prev) => ({ ...prev, branch: event.target.value || undefined }),
                })
              }
            />
            <NativeSelect
              aria-label="Filter by analysis status"
              value={search.status ?? ""}
              onChange={(event) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    status: (event.target.value || undefined) as TimelineSearch["status"],
                  }),
                })
              }
            >
              <option value="">All statuses</option>
              <option value="analyzed">Analyzed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </NativeSelect>
          </div>
        }
      />
      <div className="border-border min-h-0 flex-1 rounded-md border">
        <CommitTimeline
          projectId={projectId}
          {...(search.branch !== undefined ? { branch: search.branch } : {})}
          {...(search.status !== undefined ? { status: search.status } : {})}
          {...(project.data?.activeCommitHash
            ? { activeCommitHash: project.data.activeCommitHash }
            : {})}
        />
      </div>
    </div>
  );
}
