import type {
  RunEvent,
  RunEventClient,
  RunEventHandlers,
  RunEventSubscription,
} from "@/features/chat/streaming/types";

/** Scriptable RunEventClient for component/unit tests — dispatches a fixed event script asynchronously. */
export function createFakeRunEventClient(script: RunEvent[], delayMs = 0): RunEventClient {
  return {
    subscribe(_runId: string, handlers: RunEventHandlers): RunEventSubscription {
      let cancelled = false;
      const timers: ReturnType<typeof setTimeout>[] = [];

      handlers.onOpen?.();
      script.forEach((event, index) => {
        const timer = setTimeout(() => {
          if (!cancelled) {
            handlers.onEvent(event);
          }
        }, delayMs * index);
        timers.push(timer);
      });

      return {
        close: () => {
          cancelled = true;
          timers.forEach(clearTimeout);
        },
      };
    },
  };
}
