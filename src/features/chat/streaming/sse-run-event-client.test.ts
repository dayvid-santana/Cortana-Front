import { afterEach, describe, expect, it, vi } from "vitest";

import { sseRunEventClient } from "@/features/chat/streaming/sse-run-event-client";

class FakeEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  url: string;
  closed = false;

  constructor(url: string) {
    super();
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(type: string, data: unknown) {
    this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
}

afterEach(() => {
  FakeEventSource.instances = [];
  vi.unstubAllGlobals();
});

describe("sseRunEventClient", () => {
  it("dispatches a real, typed server frame (event: assistant.delta) to onEvent", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onEvent = vi.fn();

    sseRunEventClient.subscribe("run_1", { onEvent });
    const source = FakeEventSource.instances.at(-1)!;
    source.emit("assistant.delta", {
      type: "assistant.delta",
      eventId: "e1",
      runId: "run_1",
      text: "Oi",
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      type: "assistant.delta",
      eventId: "e1",
      runId: "run_1",
      text: "Oi",
    });
  });

  it("dispatches run.completed and every other real event type used by the backend", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onEvent = vi.fn();

    sseRunEventClient.subscribe("run_1", { onEvent });
    const source = FakeEventSource.instances.at(-1)!;
    for (const type of [
      "run.started",
      "tool.started",
      "tool.completed",
      "source.reference",
      "run.completed",
      "run.failed",
    ]) {
      source.emit(type, { type });
    }

    expect(onEvent).toHaveBeenCalledTimes(6);
  });

  it("does NOT react to a bare 'message' event — the backend never sends one, and this used to be the only listener, silently dropping every real frame", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onEvent = vi.fn();

    sseRunEventClient.subscribe("run_1", { onEvent });
    const source = FakeEventSource.instances.at(-1)!;
    source.emit("message", { type: "assistant.delta", eventId: "e1", runId: "run_1", text: "Oi" });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("close() on the returned subscription closes the underlying EventSource", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const subscription = sseRunEventClient.subscribe("run_1", { onEvent: vi.fn() });
    const source = FakeEventSource.instances.at(-1)!;

    subscription.close();
    expect(source.closed).toBe(true);
  });
});
