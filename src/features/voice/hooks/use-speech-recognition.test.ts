import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSpeechRecognition } from "@/features/voice/hooks/use-speech-recognition";

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

  constructor() {
    super();
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }

  abort() {
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
});

describe("useSpeechRecognition", () => {
  it("reports unsupported when no SpeechRecognition constructor exists", () => {
    const { result } = renderHook(() => useSpeechRecognition({ lang: "pt-BR", onResult: vi.fn() }));
    expect(result.current.isSupported).toBe(false);
  });

  it("starts listening and calls onResult once with the final transcript", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ lang: "pt-BR", onResult }));

    expect(result.current.isSupported).toBe(true);
    act(() => result.current.start());
    expect(result.current.isListening).toBe(true);

    const instance = FakeSpeechRecognition.instances.at(-1);
    act(() => instance?.emitFinalResult("olá assistente"));
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith("olá assistente");
  });

  it("stops listening (isListening false) once the recognizer ends", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const { result } = renderHook(() => useSpeechRecognition({ lang: "pt-BR", onResult: vi.fn() }));

    act(() => result.current.start());
    const instance = FakeSpeechRecognition.instances.at(-1);
    act(() => instance?.onend?.());
    expect(result.current.isListening).toBe(false);
  });

  it("surfaces recognition errors via onError instead of throwing", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "pt-BR", onResult: vi.fn(), onError }),
    );

    act(() => result.current.start());
    const instance = FakeSpeechRecognition.instances.at(-1);
    act(() => instance?.emitError("not-allowed"));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("not-allowed");
  });
});
