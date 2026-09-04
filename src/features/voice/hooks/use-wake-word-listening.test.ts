import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  extractCommandAfterWakeWord,
  useWakeWordListening,
} from "@/features/voice/hooks/use-wake-word-listening";

class FakeSpeechRecognition extends EventTarget implements SpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  started = false;
  aborted = false;

  constructor() {
    super();
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.started = true;
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }

  abort() {
    this.aborted = true;
    this.onend?.();
  }

  emitFinalResult(transcript: string) {
    const result = {
      isFinal: true,
      length: 1,
      item: () => ({ transcript, confidence: 1 }),
      0: { transcript, confidence: 1 },
    };
    const event = { resultIndex: 0, results: { length: 1, item: () => result, 0: result } };
    this.onresult?.(event as unknown as SpeechRecognitionEvent);
  }

  emitError(error: string) {
    this.onerror?.({ error, message: error } as SpeechRecognitionErrorEvent);
  }
}

afterEach(() => {
  FakeSpeechRecognition.instances = [];
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  vi.useRealTimers();
});

describe("extractCommandAfterWakeWord", () => {
  it("returns the text spoken after the wake word", () => {
    expect(extractCommandAfterWakeWord("diana o que mudou no readme", "diana")).toBe(
      "o que mudou no readme",
    );
  });

  it("is case-insensitive", () => {
    expect(extractCommandAfterWakeWord("Diana, resuma este commit", "diana")).toBe(
      ", resuma este commit",
    );
  });

  it("returns null when the wake word never appears", () => {
    expect(extractCommandAfterWakeWord("o que mudou no readme", "diana")).toBeNull();
  });

  it("does not match the wake word inside another word", () => {
    expect(extractCommandAfterWakeWord("a diananeira chegou", "diana")).toBeNull();
  });

  it("returns an empty string when nothing follows the wake word", () => {
    expect(extractCommandAfterWakeWord("diana", "diana")).toBe("");
  });
});

describe("useWakeWordListening", () => {
  it("does not start listening until enabled is true", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const { result } = renderHook(() =>
      useWakeWordListening({ lang: "pt-BR", enabled: false, paused: false, onCommand: vi.fn() }),
    );

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isListening).toBe(false);
    expect(FakeSpeechRecognition.instances).toHaveLength(0);
  });

  it("starts continuous listening once enabled", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const { result } = renderHook(() =>
      useWakeWordListening({ lang: "pt-BR", enabled: true, paused: false, onCommand: vi.fn() }),
    );

    expect(result.current.isListening).toBe(true);
    const instance = FakeSpeechRecognition.instances.at(-1);
    expect(instance?.continuous).toBe(true);
    expect(instance?.started).toBe(true);
  });

  it("only calls onCommand when the transcript contains the wake word", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onCommand = vi.fn();
    renderHook(() =>
      useWakeWordListening({
        lang: "pt-BR",
        wakeWord: "diana",
        enabled: true,
        paused: false,
        onCommand,
      }),
    );

    const instance = FakeSpeechRecognition.instances.at(-1);
    act(() => instance?.emitFinalResult("isso não tem a palavra mágica"));
    expect(onCommand).not.toHaveBeenCalled();

    act(() => instance?.emitFinalResult("diana o que mudou no readme"));
    expect(onCommand).toHaveBeenCalledExactlyOnceWith("o que mudou no readme");
  });

  it("ignores 'no-speech' and 'aborted' errors instead of surfacing them", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onError = vi.fn();
    renderHook(() =>
      useWakeWordListening({ lang: "pt-BR", enabled: true, paused: false, onCommand: vi.fn(), onError }),
    );

    const instance = FakeSpeechRecognition.instances.at(-1);
    act(() => instance?.emitError("no-speech"));
    act(() => instance?.emitError("aborted"));
    expect(onError).not.toHaveBeenCalled();

    act(() => instance?.emitError("not-allowed"));
    expect(onError).toHaveBeenCalledExactlyOnceWith("not-allowed");
  });

  it("aborts the recognizer when paused becomes true, without ending the mode", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) =>
        useWakeWordListening({ lang: "pt-BR", enabled: true, paused, onCommand: vi.fn() }),
      { initialProps: { paused: false } },
    );

    const firstInstance = FakeSpeechRecognition.instances.at(-1);
    rerender({ paused: true });

    expect(firstInstance?.aborted).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("resumes listening once paused goes back to false", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) =>
        useWakeWordListening({ lang: "pt-BR", enabled: true, paused, onCommand: vi.fn() }),
      { initialProps: { paused: true } },
    );

    expect(FakeSpeechRecognition.instances).toHaveLength(0);

    rerender({ paused: false });

    expect(result.current.isListening).toBe(true);
    expect(FakeSpeechRecognition.instances).toHaveLength(1);
  });

  it("auto-restarts after the browser ends a continuous session on its own", () => {
    vi.useFakeTimers();
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    renderHook(() =>
      useWakeWordListening({ lang: "pt-BR", enabled: true, paused: false, onCommand: vi.fn() }),
    );

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    const first = FakeSpeechRecognition.instances[0];
    act(() => first?.onend?.());
    act(() => vi.advanceTimersByTime(300));

    expect(FakeSpeechRecognition.instances).toHaveLength(2);
  });
});
