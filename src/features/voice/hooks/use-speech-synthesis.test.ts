import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSpeechSynthesis } from "@/features/voice/hooks/use-speech-synthesis";

let speakSpy: ReturnType<typeof vi.fn>;
let cancelSpy: ReturnType<typeof vi.fn>;

// jsdom implements neither SpeechSynthesis nor SpeechSynthesisUtterance.
class FakeSpeechSynthesisUtterance {
  text: string;
  lang = "";
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(() => {
  vi.stubGlobal("SpeechSynthesisUtterance", FakeSpeechSynthesisUtterance);
  speakSpy = vi.fn((utterance: FakeSpeechSynthesisUtterance) => {
    utterance.onstart?.({} as SpeechSynthesisEvent);
  });
  cancelSpy = vi.fn();
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { speak: speakSpy, cancel: cancelSpy },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
});

describe("useSpeechSynthesis", () => {
  it("reports unsupported when speechSynthesis isn't on window", () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    const { result } = renderHook(() => useSpeechSynthesis({ lang: "pt-BR" }));
    expect(result.current.isSupported).toBe(false);
  });

  it("speaks the given text with the configured language", () => {
    const { result } = renderHook(() => useSpeechSynthesis({ lang: "pt-BR" }));

    act(() => result.current.speak("Olá! Como posso ajudar?"));

    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe("Olá! Como posso ajudar?");
    expect(utterance.lang).toBe("pt-BR");
    expect(result.current.isSpeaking).toBe(true);
  });

  it("does nothing for blank text", () => {
    const { result } = renderHook(() => useSpeechSynthesis({ lang: "pt-BR" }));
    act(() => result.current.speak("   "));
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("cancel() stops speaking and resets isSpeaking", () => {
    const { result } = renderHook(() => useSpeechSynthesis({ lang: "pt-BR" }));
    act(() => result.current.speak("Olá"));
    expect(result.current.isSpeaking).toBe(true);

    act(() => result.current.cancel());
    expect(cancelSpy).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
