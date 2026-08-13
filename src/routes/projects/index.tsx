import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { AddProjectForm } from "@/features/projects/components/add-project-form";
import { ProjectStatusCard } from "@/features/projects/components/project-status-card";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/")({
  component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
  const projectsQuery = useProjects();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <PageHeader
        title="Projects"
        description="Repositories DevMate knows about."
        actions={
          <DialogRoot open={addOpen} onOpenChange={setAddOpen}>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={14} aria-hidden="true" /> Add project
            </Button>
            <DialogContent
              title="Add project"
              description="Register a local repository path with DevMate."
            >
              <AddProjectForm onCreated={() => setAddOpen(false)} />
            </DialogContent>
          </DialogRoot>
        }
      />

      {projectsQuery.status === "pending" ? (
        <LoadingState rows={4} label="Loading projects" />
      ) : null}

      {projectsQuery.status === "error" ? (
        <ErrorState
          problem={toDisplayProblem(projectsQuery.error)}
          onRetry={() => void projectsQuery.refetch()}
        />
      ) : null}

      {projectsQuery.status === "success" && projectsQuery.data.items.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects have been initialized"
          description="Use the CLI: devmate init /path/to/project — or add a local path above."
        />
      ) : null}

      {projectsQuery.status === "success" && projectsQuery.data.items.length > 0 ? (
        <ul className="border-border rounded-md border">
          {projectsQuery.data.items.map((project) => (
            <ProjectStatusCard key={project.id} project={project} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
