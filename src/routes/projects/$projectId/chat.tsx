import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, PanelRightOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";

import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ContextPanel } from "@/components/layout/context-panel";
import { applyEditProposal } from "@/features/chat/api/queries";
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
import { useServerSpeech } from "@/features/speech/hooks/use-server-speech";
import { useWakeWordListening } from "@/features/voice/hooks/use-wake-word-listening";
import { toDisplayProblem } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
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
  const voiceModeEnabled = useUiPreferencesStore((state) => state.voiceModeEnabled);
  const setVoiceModeEnabled = useUiPreferencesStore((state) => state.setVoiceModeEnabled);
  const voiceAutoSend = useUiPreferencesStore((state) => state.voiceAutoSend);
  const voiceLanguage = useUiPreferencesStore((state) => state.voiceLanguage);
  const speech = useServerSpeech(projectId, { lang: voiceLanguage });

  const threadsQuery = useThreads(projectId, commitHash);
  // `useThreads` já filtra por commit; ainda falta checar o scope. Sem isso, trocar
  // de docs<->code com uma thread na URL reenvia o threadId antigo com o scope novo,
  // e o backend rejeita ("A thread pertence a outro commit ou escopo.") sem o
  // usuário entender por quê — a thread simplesmente não existe pra essa combinação.
  const threadsForScope = threadsQuery.data?.items.filter((thread) => thread.scope === search.scope);
  const searchThreadMatches = threadsForScope?.some((thread) => thread.id === search.thread);
  const resolvedThreadId = searchThreadMatches ? search.thread : threadsForScope?.[0]?.id;
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

  const spokenRunIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!voiceModeEnabled) return;
    const { status, runId, finalMessage } = chatRun.runState;
    if (status !== "completed" || !finalMessage || runId === spokenRunIdRef.current) return;
    spokenRunIdRef.current = runId;
    void speech.speak(finalMessage.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceModeEnabled, chatRun.runState.status, chatRun.runState.finalMessage]);

  const runIsActive =
    chatRun.runState.status === "connecting" || chatRun.runState.status === "streaming";

  // Uma proposta de edição pendente já foi confirmada/descartada por voz nesta
  // sessão? Evita aplicar duas vezes se a pessoa repetir "Diana, sim".
  const resolvedProposalIdsRef = useRef<Set<string>>(new Set());
  const CONFIRM_PATTERN = /\b(sim|aplica|aplicar|confirmo|confirma|pode aplicar|ok)\b/i;
  const DISCARD_PATTERN = /\b(não|nao|cancela|cancelar|descarta|descartar|deixa)\b/i;

  const handleVoiceCommand = (command: string) => {
    const proposal = chatRun.runState.finalMessage?.editProposal;
    if (proposal && !proposal.applied && !resolvedProposalIdsRef.current.has(proposal.id)) {
      if (CONFIRM_PATTERN.test(command)) {
        resolvedProposalIdsRef.current.add(proposal.id);
        void applyEditProposal(projectId, proposal.id)
          .then(() => speech.speak("Aplicado."))
          .catch(() => speech.speak("Não consegui aplicar a alteração."));
        return;
      }
      if (DISCARD_PATTERN.test(command)) {
        resolvedProposalIdsRef.current.add(proposal.id);
        void speech.speak("Descartado. Nada foi escrito.");
        return;
      }
    }
    void chatRun.send(command);
  };

  const wakeWord = useWakeWordListening({
    lang: voiceLanguage,
    // Ligar o microfone na interface ativa a escuta contínua por "Diana"; pausa
    // enquanto a assistente está falando ou já processando um pedido, pra não
    // reagir à própria voz dela nem empilhar comandos em cima de uma rodada ativa.
    enabled: voiceModeEnabled,
    paused: speech.isSpeaking || runIsActive,
    onCommand: handleVoiceCommand,
  });

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

  const isRunning = runIsActive;
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
          <div className="flex items-center gap-1">
            {voiceModeEnabled && wakeWord.isListening ? (
              <span className="text-muted-foreground text-[11px]" role="status">
                Listening for “Diana”…
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (voiceModeEnabled) speech.cancel();
                setVoiceModeEnabled(!voiceModeEnabled);
              }}
              aria-pressed={voiceModeEnabled}
              title={
                voiceModeEnabled
                  ? 'Voice mode on — say "Diana" followed by your question'
                  : "Turn voice mode on"
              }
              aria-label={
                voiceModeEnabled
                  ? 'Turn voice mode off (listening for "Diana")'
                  : "Turn voice mode on"
              }
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-sm",
                voiceModeEnabled
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                voiceModeEnabled && wakeWord.isListening && !speech.isSpeaking && "animate-pulse",
              )}
            >
              {voiceModeEnabled ? (
                <Mic size={15} aria-hidden="true" />
              ) : (
                <MicOff size={15} aria-hidden="true" />
              )}
            </button>
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
          voiceEnabled={voiceModeEnabled}
          voiceLanguage={voiceLanguage}
          voiceAutoSend={voiceAutoSend}
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
