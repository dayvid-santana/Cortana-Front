import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatComposer } from "@/features/chat/components/chat-composer";

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
}

afterEach(() => {
  FakeSpeechRecognition.instances = [];
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
});

describe("ChatComposer", () => {
  it("sends the trimmed message on Ctrl+Enter and clears the textarea", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatComposer disabled={false} isRunning={false} onSend={onSend} onCancel={vi.fn()} />);

    const textarea = screen.getByRole("textbox", { name: /message/i });
    await user.type(textarea, "  What changed here?  ");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onSend).toHaveBeenCalledWith("What changed here?");
    expect(textarea).toHaveValue("");
  });

  it("inserts a newline on plain Enter instead of sending", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatComposer disabled={false} isRunning={false} onSend={onSend} onCancel={vi.fn()} />);

    const textarea = screen.getByRole("textbox", { name: /message/i });
    await user.type(textarea, "line one{Enter}line two");

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("line one\nline two");
  });

  it("does not send an empty or whitespace-only message", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatComposer disabled={false} isRunning={false} onSend={onSend} onCancel={vi.fn()} />);

    await user.type(screen.getByRole("textbox", { name: /message/i }), "   ");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows Cancel instead of Send while a run is in progress, and Escape triggers cancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ChatComposer disabled onCancel={onCancel} isRunning onSend={vi.fn()} />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("textbox", { name: /message/i }));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the textarea when disabled is true and not running", () => {
    render(<ChatComposer disabled isRunning={false} onSend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: /message/i })).toBeDisabled();
  });

  it("hides the mic button when voice mode is off, even with browser support", () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    render(<ChatComposer disabled={false} isRunning={false} onSend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /speak your message/i })).not.toBeInTheDocument();
  });

  it("hides the mic button when voice mode is on but the browser has no SpeechRecognition", () => {
    render(
      <ChatComposer
        disabled={false}
        isRunning={false}
        onSend={vi.fn()}
        onCancel={vi.fn()}
        voiceEnabled
      />,
    );
    expect(screen.queryByRole("button", { name: /speak your message/i })).not.toBeInTheDocument();
  });

  it("auto-sends the recognized transcript when voiceAutoSend is on", async () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatComposer
        disabled={false}
        isRunning={false}
        onSend={onSend}
        onCancel={vi.fn()}
        voiceEnabled
        voiceAutoSend
      />,
    );

    await user.click(screen.getByRole("button", { name: /speak your message/i }));
    act(() =>
      FakeSpeechRecognition.instances.at(-1)?.emitFinalResult("qual é o status do projeto?"),
    );

    expect(onSend).toHaveBeenCalledWith("qual é o status do projeto?");
    expect(screen.getByRole("textbox", { name: /message/i })).toHaveValue("");
  });

  it("fills the textarea instead of sending when voiceAutoSend is off", async () => {
    window.SpeechRecognition = FakeSpeechRecognition as unknown as SpeechRecognitionConstructor;
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatComposer
        disabled={false}
        isRunning={false}
        onSend={onSend}
        onCancel={vi.fn()}
        voiceEnabled
        voiceAutoSend={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /speak your message/i }));
    act(() =>
      FakeSpeechRecognition.instances.at(-1)?.emitFinalResult("qual é o status do projeto?"),
    );

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /message/i })).toHaveValue(
      "qual é o status do projeto?",
    );
  });
});
