import type {
  RunEvent,
  RunEventClient,
  RunEventHandlers,
  RunEventSubscription,
} from "@/features/chat/streaming/types";

const apiBaseUrl = import.meta.env.VITE_DEVMATE_API_BASE_URL ?? "/api/v1";

// The backend sends every real event with an explicit `event: <type>` field (see
// devmate's stream_run_events). EventSource's generic "message" event only fires for
// frames with NO event field at all (the SSE spec's default "message" type) — so
// listening only on "message", as this client used to, silently never received any
// real content; each of these needs its own addEventListener.
const EVENT_TYPES = [
  "run.started",
  "assistant.delta",
  "source.reference",
  "tool.started",
  "tool.completed",
  "run.completed",
  "run.failed",
] as const satisfies readonly RunEvent["type"][];

function isRunEvent(value: unknown): value is RunEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}

/**
 * Native EventSource already implements the reconnection + Last-Event-ID
 * behavior section 20.4 asks for, so we lean on the browser instead of
 * hand-rolling backoff/retry logic.
 */
class SseRunEventClient implements RunEventClient {
  subscribe(runId: string, handlers: RunEventHandlers): RunEventSubscription {
    const url = `${apiBaseUrl}/runs/${encodeURIComponent(runId)}/events`;
    const source = new EventSource(url);

    source.addEventListener("open", () => {
      handlers.onOpen?.();
    });

    const handleTypedEvent = (event: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (isRunEvent(parsed)) {
        handlers.onEvent(parsed);
      }
    };
    for (const type of EVENT_TYPES) {
      source.addEventListener(type, handleTypedEvent);
    }

    source.addEventListener("error", () => {
      if (source.readyState === EventSource.CONNECTING) {
        // EventSource is retrying this same subscription on its own — not a failure.
        handlers.onError?.("Reconnecting…", "reconnecting");
        return;
      }
      handlers.onError?.("Stream connection lost.", "lost");
    });

    return {
      close: () => {
        source.close();
      },
    };
  }
}

export const sseRunEventClient: RunEventClient = new SseRunEventClient();
