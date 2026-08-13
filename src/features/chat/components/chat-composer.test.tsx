import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatComposer } from "@/features/chat/components/chat-composer";

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
});
