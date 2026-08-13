import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { fetchProject, fetchProjectStatus, projectKeys } from "@/features/projects/api/queries";
import { useProject, useProjectStatus } from "@/features/projects/hooks/use-project";
import { useCommit } from "@/features/commits/hooks/use-commit";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ context: { queryClient }, params: { projectId } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: projectKeys.detail(projectId),
        queryFn: () => fetchProject(projectId),
      }),
      queryClient.ensureQueryData({
        queryKey: projectKeys.status(projectId),
        queryFn: () => fetchProjectStatus(projectId),
      }),
    ]);
  },
  component: ProjectWorkspaceLayout,
});

function ProjectWorkspaceLayout() {
  const { projectId } = Route.useParams();
  const projectQuery = useProject(projectId);
  const statusQuery = useProjectStatus(projectId);
  const commitQuery = useCommit(projectId, projectQuery.data?.activeCommitHash);

  if (projectQuery.status === "error") {
    return (
      <div className="p-4">
        <ErrorState
          problem={toDisplayProblem(projectQuery.error)}
          onRetry={() => void projectQuery.refetch()}
        />
      </div>
    );
  }

  if (projectQuery.status === "pending" || !projectQuery.data) {
    return (
      <div className="p-4">
        <LoadingState rows={3} label="Loading project" />
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <AppShell
      projectId={projectId}
      projectName={project.name}
      branch={statusQuery.data?.activeBranch ?? project.activeBranch}
      {...(project.activeCommitHash ? { commitHash: project.activeCommitHash } : {})}
      {...(commitQuery.data?.subject ? { commitSubjectText: commitQuery.data.subject } : {})}
      decisionsActiveCount={project.decisionsActiveCount}
      questionsOpenCount={project.questionsOpenCount}
    >
      <Outlet />
    </AppShell>
  );
}
