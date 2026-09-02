import type { components } from "@/lib/api/schema";
import type { ApiProblem } from "@/lib/api/errors";

export type SourceReference = components["schemas"]["SourceReference"];
export type ToolActivity = components["schemas"]["ToolActivity"];
export type ChatMessage = components["schemas"]["Message"];

export type RunEvent =
  | { type: "run.started"; eventId: string; runId: string; threadId: string }
  | { type: "assistant.delta"; eventId: string; runId: string; text: string }
  | { type: "source.reference"; eventId: string; runId: string; source: SourceReference }
  | { type: "tool.started"; eventId: string; runId: string; tool: ToolActivity }
  | { type: "tool.completed"; eventId: string; runId: string; tool: ToolActivity }
  | { type: "run.completed"; eventId: string; runId: string; message: ChatMessage }
  | { type: "run.failed"; eventId: string; runId: string; error: ApiProblem }
  | { type: "heartbeat"; eventId: string };

export interface RunEventHandlers {
  onEvent: (event: RunEvent) => void;
  onOpen?: () => void;
  /**
   * "reconnecting" is transient — the transport (EventSource) is retrying the same
   * subscription on its own; the caller must not tear it down. "lost" means the
   * transport has given up and the caller owns recovery (e.g. closing and surfacing
   * a failure).
   */
  onError?: (message: string, kind: "reconnecting" | "lost") => void;
}

export interface RunEventSubscription {
  close: () => void;
}

/**
 * Decouples chat components from EventSource so we can swap in a scripted
 * fake for tests/Storybook-less component tests, and so reconnection and
 * event normalization live in exactly one place.
 */
export interface RunEventClient {
  subscribe(runId: string, handlers: RunEventHandlers): RunEventSubscription;
}
