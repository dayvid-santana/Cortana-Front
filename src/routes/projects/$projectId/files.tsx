import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { DiffViewer } from "@/features/files/components/diff-viewer";
import { FileTree } from "@/features/files/components/file-tree";
import { FileViewer } from "@/features/files/components/file-viewer";
import { useFileContent } from "@/features/files/hooks/use-file-content";
import { useFileDiff } from "@/features/files/hooks/use-file-diff";
import { useFileTree } from "@/features/files/hooks/use-file-tree";
import { filesSearchSchema } from "@/features/files/schemas/search";
import { useProject } from "@/features/projects/hooks/use-project";
import { ReadingSessionLauncher } from "@/features/reading/components/reading-session-launcher";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/files")({
  validateSearch: filesSearchSchema,
  component: FilesPage,
});

function FilesPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const project = useProject(projectId);
  const commit = search.commit ?? project.data?.activeCommitHash;
  const [listenOpen, setListenOpen] = useState(false);

  const treeQuery = useFileTree(projectId, commit);
  const range =
    search.startLine !== undefined || search.endLine !== undefined
      ? {
          ...(search.startLine !== undefined ? { startLine: search.startLine } : {}),
          ...(search.endLine !== undefined ? { endLine: search.endLine } : {}),
        }
      : undefined;
  const contentQuery = useFileContent(projectId, commit, search.path, range);
  const diffQuery = useFileDiff(
    projectId,
    commit,
    search.view === "diff" ? search.path : undefined,
  );

  if (!commit) {
    return (
      <div className="p-4">
        <LoadingState rows={4} label="Loading files" />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[240px_1fr]">
      <div className="border-border border-r">
        <ScrollArea className="h-full">
          {treeQuery.status === "pending" ? (
            <LoadingState rows={6} label="Loading file tree" />
          ) : null}
          {treeQuery.status === "error" ? (
            <div className="p-2">
              <ErrorState
                problem={toDisplayProblem(treeQuery.error)}
                onRetry={() => void treeQuery.refetch()}
              />
            </div>
          ) : null}
          {treeQuery.status === "success" ? (
            <FileTree
              projectId={projectId}
              commit={commit}
              entries={treeQuery.data.items}
              {...(search.path !== undefined ? { activePath: search.path } : {})}
            />
          ) : null}
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-col">
        {!search.path ? (
          <div className="p-4">
            <EmptyState
              title="Select a file"
              description="Choose a file from the tree to view its contents."
            />
          </div>
        ) : (
          <>
            <Tabs
              value={search.view}
              onValueChange={(value) =>
                void navigate({ search: (prev) => ({ ...prev, view: value as "source" | "diff" }) })
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="px-2">
                <TabsTab value="source">Source</TabsTab>
                <TabsTab value="diff">Diff</TabsTab>
              </TabsList>
              <TabsPanel value="source" className="min-h-0 flex-1 pt-0">
                {contentQuery.status === "pending" ? (
                  <LoadingState rows={8} label="Loading file" />
                ) : null}
                {contentQuery.status === "error" ? (
                  <div className="p-2">
                    <ErrorState
                      problem={toDisplayProblem(contentQuery.error)}
                      onRetry={() => void contentQuery.refetch()}
                    />
                  </div>
                ) : null}
                {contentQuery.status === "success" ? (
                  <FileViewer
                    path={contentQuery.data.path}
                    language={contentQuery.data.language}
                    content={contentQuery.data.content}
                    startLineOffset={contentQuery.data.startLine}
                    highlightRange={
                      search.startLine !== undefined && search.endLine !== undefined
                        ? { startLine: search.startLine, endLine: search.endLine }
                        : undefined
                    }
                    onListen={() => setListenOpen(true)}
                  />
                ) : null}
              </TabsPanel>
              <TabsPanel value="diff" className="min-h-0 flex-1 pt-0">
                {diffQuery.status === "pending" ? (
                  <LoadingState rows={8} label="Loading diff" />
                ) : null}
                {diffQuery.status === "error" ? (
                  <div className="p-2">
                    <ErrorState
                      problem={toDisplayProblem(diffQuery.error)}
                      onRetry={() => void diffQuery.refetch()}
                    />
                  </div>
                ) : null}
                {diffQuery.status === "success" ? <DiffViewer diff={diffQuery.data} /> : null}
              </TabsPanel>
            </Tabs>

            {search.path ? (
              <ReadingSessionLauncher
                projectId={projectId}
                filePath={search.path}
                commitHash={commit}
                open={listenOpen}
                onOpenChange={setListenOpen}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
