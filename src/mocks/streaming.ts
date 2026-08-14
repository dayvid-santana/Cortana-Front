import type { RunEvent } from "@/features/chat/streaming/types";
import { HEAD_COMMIT_HASH } from "@/mocks/fixtures";

function sseFrame(event: RunEvent): string {
  return `id: ${event.eventId}\ndata: ${JSON.stringify(event)}\n\n`;
}

interface CreateSseStreamOptions {
  intervalMs?: number;
  isCancelled?: () => boolean;
  onComplete?: () => void;
}

/** Encodes a scripted RunEvent list as a real SSE byte stream, paced with real delays. */
export function createSseStream(
  events: RunEvent[],
  options: CreateSseStreamOptions = {},
): ReadableStream<Uint8Array> {
  const { intervalMs = 35, isCancelled, onComplete } = options;
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const pump = (): void => {
        if (isCancelled?.()) {
          controller.close();
          return;
        }
        if (index >= events.length) {
          controller.close();
          onComplete?.();
          return;
        }
        const event = events[index];
        index += 1;
        if (event) {
          controller.enqueue(encoder.encode(sseFrame(event)));
        }
        setTimeout(pump, intervalMs);
      };
      pump();
    },
  });
}

function words(text: string): string[] {
  const parts = text.split(" ");
  return parts.map((part, index) => (index === parts.length - 1 ? part : `${part} `));
}

interface RunScriptInput {
  runId: string;
  threadId: string;
  scope: "docs" | "code";
  userMessage: string;
}

/**
 * Builds a deterministic, realistic event script for the mock chat run:
 * tool activity, an assistant response with real (fixture-backed) source
 * citations, and completion. Docs scope answers from docs/auth.md; code
 * scope additionally "inspects" the token service file.
 */
export function buildRunEventScript({
  runId,
  threadId,
  scope,
  userMessage,
}: RunScriptInput): RunEvent[] {
  const events: RunEvent[] = [{ type: "run.started", eventId: `${runId}-e0`, runId, threadId }];
  let eventCounter = 1;
  const nextId = (): string => {
    eventCounter += 1;
    return `${runId}-e${eventCounter}`;
  };

  events.push({
    type: "tool.started",
    eventId: nextId(),
    runId,
    tool: {
      id: "tool_search_docs",
      name: "search_documentation",
      status: "started",
      detail: "docs/auth.md",
      startedAt: new Date().toISOString(),
    },
  });
  events.push({
    type: "tool.completed",
    eventId: nextId(),
    runId,
    tool: {
      id: "tool_search_docs",
      name: "search_documentation",
      status: "completed",
      detail: "docs/auth.md",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  });

  if (scope === "code") {
    events.push({
      type: "tool.started",
      eventId: nextId(),
      runId,
      tool: {
        id: "tool_inspect_code",
        name: "inspect_code",
        status: "started",
        detail: "src/auth/token_service.py",
        startedAt: new Date().toISOString(),
      },
    });
    events.push({
      type: "tool.completed",
      eventId: nextId(),
      runId,
      tool: {
        id: "tool_inspect_code",
        name: "inspect_code",
        status: "completed",
        detail: "src/auth/token_service.py",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    });
  }

  const answer =
    scope === "code"
      ? `Looking at the implementation, \`TokenService.issue_access_token\` builds a JWT payload with a 15 minute expiry and delegates signing to a not-yet-implemented \`_encode\` method. The documentation confirms this is the intended access-token lifetime.`
      : `Based on "${userMessage.slice(0, 60)}", this commit documents the JWT-based login flow and access token format. Refresh token revocation is called out as undecided.`;

  for (const chunk of words(answer)) {
    events.push({ type: "assistant.delta", eventId: nextId(), runId, text: chunk });
  }

  events.push({
    type: "source.reference",
    eventId: nextId(),
    runId,
    source: {
      id: "src_stream_1",
      kind: "document",
      path: "docs/auth.md",
      commitHash: HEAD_COMMIT_HASH,
      startLine: 15,
      endLine: 17,
      heading: "Access tokens",
      label: `docs/auth.md · Access tokens · L15–17 · ${HEAD_COMMIT_HASH.slice(0, 7)}`,
      valid: true,
    },
  });
  events.push({
    type: "source.reference",
    eventId: nextId(),
    runId,
    source: {
      id: "src_stream_2",
      kind: "document",
      path: "docs/auth.md",
      commitHash: HEAD_COMMIT_HASH,
      startLine: 21,
      endLine: 23,
      heading: "Revogação",
      label: `docs/auth.md · Revogação · L21–23 · ${HEAD_COMMIT_HASH.slice(0, 7)}`,
      valid: true,
    },
  });

  if (scope === "code") {
    events.push({
      type: "source.reference",
      eventId: nextId(),
      runId,
      source: {
        id: "src_stream_3",
        kind: "code",
        path: "src/auth/token_service.py",
        commitHash: HEAD_COMMIT_HASH,
        startLine: 11,
        endLine: 24,
        heading: "TokenService",
        label: `src/auth/token_service.py · TokenService · L11–24 · ${HEAD_COMMIT_HASH.slice(0, 7)}`,
        valid: true,
      },
    });
  }

  const messageId = `msg_${runId}`;
  events.push({
    type: "run.completed",
    eventId: nextId(),
    runId,
    message: {
      id: messageId,
      threadId,
      role: "assistant",
      content: answer,
      createdAt: new Date().toISOString(),
      scope,
      provider: "anthropic",
      model: "claude-sonnet-5",
      status: "complete",
      durationMs: 2600,
      sources: events
        .filter(
          (event): event is Extract<RunEvent, { type: "source.reference" }> =>
            event.type === "source.reference",
        )
        .map((event) => event.source),
      toolActivity: events
        .filter(
          (event): event is Extract<RunEvent, { type: "tool.completed" }> =>
            event.type === "tool.completed",
        )
        .map((event) => event.tool),
      decisionsDetected: ["dec_jwt-auth"],
      questionsDetected: ["q_refresh-revocation"],
    },
  });

  return events;
}
