import { createFileRoute } from "@tanstack/react-router";
import { PanelRightOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";

import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ContextPanel } from "@/components/layout/context-panel";
import { ChatComposer } from "@/features/chat/components/chat-composer";
import { ChatContextPanel } from "@/features/chat/components/chat-context-panel";
import { ChatEmptyState } from "@/features/chat/components/chat-empty-state";
import { AssistantMessage, UserMessage } from "@/features/chat/components/conversation-message";
import { ScopeSelector } from "@/features/chat/components/scope-selector";
import { StreamingMessage } from "@/features/chat/components/streaming-message";
import { chatSearchSchema } from "@/features/chat/schemas/search";
import { useChatRun } from "@/features/chat/hooks/use-chat-run";
import { useThreadMessages, useThreads } from "@/features/chat/hooks/use-thread-messages";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProviders } from "@/features/providers/hooks/use-providers";
import { toDisplayProblem } from "@/lib/api/errors";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

export const Route = createFileRoute("/projects/$projectId/chat")({
  validateSearch: chatSearchSchema,
  component: ChatPage,
});

function ChatPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const project = useProject(projectId);
  const commitHash = search.commit ?? project.data?.activeCommitHash;

  const contextPanelOpen = useUiPreferencesStore((state) => state.contextPanelOpen);
  const setContextPanelOpen = useUiPreferencesStore((state) => state.setContextPanelOpen);

  const threadsQuery = useThreads(projectId, commitHash);
  const resolvedThreadId = search.thread ?? threadsQuery.data?.items[0]?.id;
  const messagesQuery = useThreadMessages(projectId, resolvedThreadId);
  const providersQuery = useProviders();
  const defaultProvider = providersQuery.data?.items.find((provider) =>
    provider.routedTasks?.includes("documentation_chat"),
  );

  const chatRun = useChatRun(projectId, {
    ...(resolvedThreadId ? { threadId: resolvedThreadId } : {}),
    commitHash: commitHash ?? "",
    scope: search.scope,
  });

  useEffect(() => {
    if (chatRun.threadId && chatRun.threadId !== search.thread) {
      void navigate({ search: (prev) => ({ ...prev, thread: chatRun.threadId }) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRun.threadId]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messagesQuery.data, chatRun.runState.transcript, chatRun.optimisticMessages]);

  if (project.status === "pending") {
    return (
      <div className="p-4">
        <LoadingState rows={3} label="Loading chat" />
      </div>
    );
  }

  if (project.status === "error") {
    return (
      <div className="p-4">
        <ErrorState
          problem={toDisplayProblem(project.error)}
          onRetry={() => void project.refetch()}
        />
      </div>
    );
  }

  if (!commitHash) {
    return (
      <div className="p-4">
        <EmptyState
          title="No commit is available yet"
          description="Run a scan for this project before starting a conversation."
        />
      </div>
    );
  }

  const isRunning =
    chatRun.runState.status === "connecting" || chatRun.runState.status === "streaming";
  const showStreaming =
    chatRun.runState.status !== "completed" && chatRun.optimisticMessages.length > 0;

  return (
    <PanelGroup orientation="horizontal" className="h-full">
      <Panel minSize="40%" className="flex h-full flex-col">
        <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
          <ScopeSelector
            scope={search.scope}
            onChange={(scope) => void navigate({ search: (prev) => ({ ...prev, scope }) })}
          />
          {!contextPanelOpen ? (
            <button
              type="button"
              onClick={() => setContextPanelOpen(true)}
              aria-label="Open context panel"
              className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-sm"
            >
              <PanelRightOpen size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          {messagesQuery.status === "pending" && resolvedThreadId ? (
            <LoadingState rows={3} label="Loading messages" />
          ) : null}
          {messagesQuery.status === "error" ? (
            <ErrorState
              problem={toDisplayProblem(messagesQuery.error)}
              onRetry={() => void messagesQuery.refetch()}
            />
          ) : null}

          {(messagesQuery.data?.items.length ?? 0) === 0 && !showStreaming ? (
            <ChatEmptyState scope={search.scope} />
          ) : null}

          <div className="flex flex-col gap-3">
            {messagesQuery.data?.items.map((message) =>
              message.role === "user" ? (
                <UserMessage
                  key={message.id}
                  content={message.content}
                  createdAt={message.createdAt}
                />
              ) : (
                <AssistantMessage key={message.id} projectId={projectId} message={message} />
              ),
            )}

            {chatRun.optimisticMessages.map((message) => (
              <UserMessage
                key={message.localId}
                content={message.content}
                createdAt={new Date().toISOString()}
                pending={message.status === "sent" ? undefined : message.status}
              />
            ))}

            {showStreaming ? (
              <StreamingMessage projectId={projectId} runState={chatRun.runState} />
            ) : null}
          </div>
          <div ref={bottomRef} />
        </div>

        <ChatComposer
          disabled={!commitHash || isRunning}
          isRunning={isRunning}
          onSend={(text) => void chatRun.send(text)}
          onCancel={chatRun.cancel}
        />
      </Panel>

      {contextPanelOpen ? (
        <>
          <PanelResizeHandle className="bg-border hover:bg-accent w-px transition-colors" />
          <Panel defaultSize="22%" minSize="16%" maxSize="35%">
            <ContextPanel title="Context">
              <ChatContextPanel
                projectId={projectId}
                commitHash={commitHash}
                {...(project.data?.activeBranch ? { branch: project.data.activeBranch } : {})}
                scope={search.scope}
                {...(defaultProvider ? { provider: defaultProvider } : {})}
              />
            </ContextPanel>
          </Panel>
        </>
      ) : null}
    </PanelGroup>
  );
}
