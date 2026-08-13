import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { createFakeRunEventClient } from "@/features/chat/streaming/fake-run-event-client";
import { useChatRun } from "@/features/chat/hooks/use-chat-run";
import type { RunEvent } from "@/features/chat/streaming/types";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const completionScript: RunEvent[] = [
  { type: "run.started", eventId: "e0", runId: "run_test", threadId: "thread_1" },
  { type: "assistant.delta", eventId: "e1", runId: "run_test", text: "Hello " },
  { type: "assistant.delta", eventId: "e2", runId: "run_test", text: "world." },
  {
    type: "run.completed",
    eventId: "e3",
    runId: "run_test",
    message: {
      id: "msg_final",
      threadId: "thread_1",
      role: "assistant",
      content: "Hello world.",
      createdAt: "2026-08-13T14:00:00Z",
      scope: "docs",
      status: "complete",
    },
  },
];

describe("useChatRun", () => {
  it("streams deltas and settles into 'completed' with the final message", async () => {
    const fakeClient = createFakeRunEventClient(completionScript);
    const { result } = renderHook(
      () =>
        useChatRun(
          "proj_acme-api",
          { threadId: "thread_1", commitHash: "a17d3e1", scope: "docs" },
          fakeClient,
        ),
      { wrapper },
    );

    await act(async () => {
      await result.current.send("What changed?");
    });

    await waitFor(() => expect(result.current.runState.status).toBe("completed"));
    expect(result.current.runState.transcript).toBe("Hello world.");
    expect(result.current.runState.finalMessage?.id).toBe("msg_final");
    // Optimistic messages are cleared once the persisted thread has the real message.
    expect(result.current.optimisticMessages).toHaveLength(0);
  });

  it("shows the optimistic user message as 'sending' immediately, before the server responds", async () => {
    const fakeClient = createFakeRunEventClient(completionScript, 10);
    const { result } = renderHook(
      () =>
        useChatRun(
          "proj_acme-api",
          { threadId: "thread_1", commitHash: "a17d3e1", scope: "docs" },
          fakeClient,
        ),
      { wrapper },
    );

    let sendPromise!: Promise<void>;
    act(() => {
      sendPromise = result.current.send("What changed?");
    });

    await waitFor(() => expect(result.current.optimisticMessages).toHaveLength(1));
    expect(result.current.optimisticMessages[0]?.status).toBe("sending");

    await act(async () => {
      await sendPromise;
    });
  });

  it("marks the run 'cancelled' and stops updating the transcript after cancel()", async () => {
    const fakeClient = createFakeRunEventClient(completionScript, 20);
    const { result } = renderHook(
      () =>
        useChatRun(
          "proj_acme-api",
          { threadId: "thread_1", commitHash: "a17d3e1", scope: "docs" },
          fakeClient,
        ),
      { wrapper },
    );

    await act(async () => {
      await result.current.send("What changed?");
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.runState.status).toBe("cancelled");
    const transcriptAtCancel = result.current.runState.transcript;

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(result.current.runState.transcript).toBe(transcriptAtCancel);
  });
});
