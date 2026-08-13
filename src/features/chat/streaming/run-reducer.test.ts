import { describe, expect, it } from "vitest";

import { initialRunState, runReducer } from "@/features/chat/streaming/run-reducer";
import type { RunState } from "@/features/chat/streaming/run-reducer";

describe("runReducer", () => {
  it("moves to streaming and captures ids on run.started", () => {
    const next = runReducer(initialRunState, {
      type: "run.started",
      eventId: "e0",
      runId: "run_1",
      threadId: "thread_1",
    });
    expect(next.status).toBe("streaming");
    expect(next.runId).toBe("run_1");
    expect(next.threadId).toBe("thread_1");
  });

  it("appends assistant.delta text to the transcript incrementally", () => {
    let state = initialRunState;
    state = runReducer(state, {
      type: "assistant.delta",
      eventId: "e1",
      runId: "run_1",
      text: "Hello ",
    });
    state = runReducer(state, {
      type: "assistant.delta",
      eventId: "e2",
      runId: "run_1",
      text: "world",
    });
    expect(state.transcript).toBe("Hello world");
  });

  it("accumulates source.reference events without overwriting earlier ones", () => {
    const source1 = { id: "s1", kind: "document" as const, label: "a", valid: true };
    const source2 = { id: "s2", kind: "code" as const, label: "b", valid: true };
    let state = runReducer(initialRunState, {
      type: "source.reference",
      eventId: "e1",
      runId: "run_1",
      source: source1,
    });
    state = runReducer(state, {
      type: "source.reference",
      eventId: "e2",
      runId: "run_1",
      source: source2,
    });
    expect(state.sources).toEqual([source1, source2]);
  });

  it("upserts tool activity by id instead of duplicating entries", () => {
    const started = {
      id: "tool_1",
      name: "search_documentation",
      status: "started" as const,
      startedAt: "2026-08-13T14:00:00Z",
    };
    const completed = {
      ...started,
      status: "completed" as const,
      completedAt: "2026-08-13T14:00:02Z",
    };

    let state = runReducer(initialRunState, {
      type: "tool.started",
      eventId: "e1",
      runId: "run_1",
      tool: started,
    });
    state = runReducer(state, {
      type: "tool.completed",
      eventId: "e2",
      runId: "run_1",
      tool: completed,
    });

    expect(state.toolActivity).toHaveLength(1);
    expect(state.toolActivity[0]?.status).toBe("completed");
  });

  it("finalizes into 'completed' with the full message on run.completed", () => {
    const message = {
      id: "msg_1",
      threadId: "thread_1",
      role: "assistant" as const,
      content: "Done.",
      createdAt: "2026-08-13T14:00:05Z",
      scope: "docs" as const,
      status: "complete" as const,
    };
    const state = runReducer(initialRunState, {
      type: "run.completed",
      eventId: "e1",
      runId: "run_1",
      message,
    });
    expect(state.status).toBe("completed");
    expect(state.finalMessage).toEqual(message);
  });

  it("captures the error and moves to 'failed' on run.failed", () => {
    const error = { title: "Provider unavailable", status: 503 };
    const state = runReducer(initialRunState, {
      type: "run.failed",
      eventId: "e1",
      runId: "run_1",
      error,
    });
    expect(state.status).toBe("failed");
    expect(state.error).toEqual(error);
  });

  it("ignores heartbeat events entirely (no state change)", () => {
    const state = runReducer(initialRunState, { type: "heartbeat", eventId: "e1" });
    expect(state).toBe(initialRunState);
  });

  it("client.cancelled always moves to 'cancelled'", () => {
    const state = runReducer(initialRunState, { type: "client.cancelled" });
    expect(state.status).toBe("cancelled");
  });

  it("client.connection_lost does not override an already-completed run", () => {
    const completedState: RunState = { ...initialRunState, status: "completed" };
    const state = runReducer(completedState, { type: "client.connection_lost", message: "lost" });
    expect(state.status).toBe("completed");
  });

  it("client.connection_lost moves an in-flight run to 'failed'", () => {
    const streamingState: RunState = { ...initialRunState, status: "streaming" };
    const state = runReducer(streamingState, {
      type: "client.connection_lost",
      message: "Stream connection lost.",
    });
    expect(state.status).toBe("failed");
    expect(state.error?.detail).toBe("Stream connection lost.");
  });

  it("client.reset clears a previous run's leftovers and starts connecting a new one", () => {
    const dirty: RunState = { ...initialRunState, status: "completed", transcript: "leftover" };
    const state = runReducer(dirty, { type: "client.reset" });
    expect(state.status).toBe("connecting");
    expect(state.transcript).toBe("");
  });

  it("the reducer's true initial state is idle, not connecting — no run has been sent yet", () => {
    expect(initialRunState.status).toBe("idle");
  });
});
