import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssistantMessage } from "@/features/chat/components/conversation-message";
import type { components } from "@/lib/api/schema";

const message: components["schemas"]["Message"] = {
  id: "message-1",
  threadId: "thread-1",
  role: "assistant",
  content: "A validação foi adicionada ao formulário.\n\nFontes:\nforms/login.ts · L12-L24",
  createdAt: "2026-09-08T12:00:00.000Z",
  scope: "code",
  status: "complete",
  sources: [],
};

describe("AssistantMessage", () => {
  it("replays only the assistant card text", async () => {
    const user = userEvent.setup();
    const readAloud = vi.fn();

    render(<AssistantMessage projectId="project-1" message={message} onReadAloud={readAloud} />);

    await user.click(screen.getByRole("button", { name: "Ler resposta" }));

    expect(readAloud).toHaveBeenCalledOnce();
    expect(readAloud).toHaveBeenCalledWith(message.content);
  });
});
