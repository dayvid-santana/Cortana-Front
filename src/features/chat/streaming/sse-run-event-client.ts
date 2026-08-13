import type {
  RunEvent,
  RunEventClient,
  RunEventHandlers,
  RunEventSubscription,
} from "@/features/chat/streaming/types";

const apiBaseUrl = import.meta.env.VITE_DEVMATE_API_BASE_URL ?? "/api/v1";

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

    source.addEventListener("message", (event: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (isRunEvent(parsed)) {
        handlers.onEvent(parsed);
      }
    });

    source.addEventListener("error", () => {
      if (source.readyState === EventSource.CONNECTING) {
        handlers.onError?.("Reconnecting…");
        return;
      }
      handlers.onError?.("Stream connection lost.");
    });

    return {
      close: () => {
        source.close();
      },
    };
  }
}

export const sseRunEventClient: RunEventClient = new SseRunEventClient();
