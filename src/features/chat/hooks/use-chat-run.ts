import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { cancelChatRun, chatKeys, createChatRun } from "@/features/chat/api/queries";
import { decisionKeys } from "@/features/decisions/api/queries";
import { questionKeys } from "@/features/questions/api/queries";
import { sseRunEventClient } from "@/features/chat/streaming/sse-run-event-client";
import { initialRunState, runReducer } from "@/features/chat/streaming/run-reducer";
import type { RunEventClient, RunEventSubscription } from "@/features/chat/streaming/types";
import { toDisplayProblem } from "@/lib/api/errors";

export interface OptimisticMessage {
  localId: string;
  content: string;
  status: "sending" | "sent" | "failed";
}

interface UseChatRunOptions {
  threadId?: string;
  commitHash: string;
  scope: "docs" | "code";
}

export function useChatRun(
  projectId: string,
  options: UseChatRunOptions,
  client: RunEventClient = sseRunEventClient,
) {
  const queryClient = useQueryClient();
  const [runState, dispatch] = useReducer(runReducer, initialRunState);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(options.threadId);
  const subscriptionRef = useRef<RunEventSubscription | null>(null);
  const runIdRef = useRef<string | null>(null);

  const closeSubscription = useCallback(() => {
    subscriptionRef.current?.close();
    subscriptionRef.current = null;
  }, []);

  const send = useCallback(
    async (text: string) => {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setOptimisticMessages((prev) => [...prev, { localId, content: text, status: "sending" }]);
      closeSubscription();
      dispatch({ type: "client.reset" });

      try {
        const run = await createChatRun(projectId, {
          ...(threadId ? { threadId } : {}),
          commitHash: options.commitHash,
          scope: options.scope,
          message: text,
        });
        runIdRef.current = run.id;
        setThreadId(run.threadId);
        setOptimisticMessages((prev) =>
          prev.map((message) =>
            message.localId === localId ? { ...message, status: "sent" } : message,
          ),
        );

        subscriptionRef.current = client.subscribe(run.id, {
          onEvent: (event) => {
            dispatch(event);
            if (event.type === "run.completed") {
              closeSubscription();
              void queryClient.invalidateQueries({
                queryKey: chatKeys.messages(event.message.threadId),
              });
              void queryClient.invalidateQueries({ queryKey: decisionKeys.all(projectId) });
              void queryClient.invalidateQueries({ queryKey: questionKeys.all(projectId) });
              setOptimisticMessages([]);
            } else if (event.type === "run.failed") {
              closeSubscription();
            }
          },
          onError: (message) => {
            dispatch({ type: "client.connection_lost", message });
            closeSubscription();
          },
        });
      } catch (error) {
        const problem = toDisplayProblem(error);
        setOptimisticMessages((prev) =>
          prev.map((message) =>
            message.localId === localId ? { ...message, status: "failed" } : message,
          ),
        );
        dispatch({ type: "run.failed", eventId: "client-error", runId: "", error: problem });
      }
    },
    [
      client,
      closeSubscription,
      options.commitHash,
      options.scope,
      projectId,
      queryClient,
      threadId,
    ],
  );

  const cancel = useCallback(() => {
    if (runIdRef.current) {
      void cancelChatRun(runIdRef.current).catch(() => undefined);
    }
    dispatch({ type: "client.cancelled" });
    closeSubscription();
  }, [closeSubscription]);

  useEffect(() => closeSubscription, [closeSubscription]);

  return { runState, optimisticMessages, threadId, send, cancel };
}
