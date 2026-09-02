import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { AgentActionPanel } from "@/features/agents/components/agent-action-panel";
import { CORTANA_BASE_URL } from "@/mocks/cortana-fixtures";
import { server } from "@/test/msw-server";
import type { CortanaAgent } from "@/lib/api/cortana/types";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const debugAgent: CortanaAgent = {
  name: "debugger",
  description: "Investigates a described bug.",
  mode: "read-only",
  command: "debug",
};

const executorAgent: CortanaAgent = {
  name: "executor",
  description: "Executes a task end-to-end. May create or modify files.",
  mode: "read-write",
  command: "task",
};

describe("AgentActionPanel", () => {
  it("disables the run button until a valid cwd is provided", () => {
    render(<AgentActionPanel agent={debugAgent} command="debug" cwd="" cwdValid={false} />, {
      wrapper,
    });
    expect(screen.getByRole("button", { name: /run debug/i })).toBeDisabled();
  });

  it("disables the run button until an objective is entered for objective-based commands", async () => {
    const user = userEvent.setup();
    render(<AgentActionPanel agent={debugAgent} command="debug" cwd="/repo" cwdValid />, {
      wrapper,
    });

    const runButton = screen.getByRole("button", { name: /run debug/i });
    expect(runButton).toBeDisabled();

    await user.type(screen.getByLabelText(/objective/i), "investigate the flaky test");
    expect(runButton).toBeEnabled();
  });

  it("renders the architecture decision panel instead of a normal result, and does not auto-proceed", async () => {
    const user = userEvent.setup();
    render(<AgentActionPanel agent={debugAgent} command="debug" cwd="/repo" cwdValid />, {
      wrapper,
    });

    await user.type(screen.getByLabelText(/objective/i), "pick an architecture for the queue");
    await user.click(screen.getByRole("button", { name: /run debug/i }));

    expect(await screen.findByText(/architecture decision required/i)).toBeInTheDocument();
    expect(screen.queryByText(/^diagnosis for/i)).not.toBeInTheDocument();
  });

  it("shows a retry-able error state when Cortana returns a non-2xx response", async () => {
    server.use(
      http.post(`${CORTANA_BASE_URL}/agent/debug`, () =>
        HttpResponse.json({ title: "Cortana crashed", detail: "boom" }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<AgentActionPanel agent={debugAgent} command="debug" cwd="/repo" cwdValid />, {
      wrapper,
    });

    await user.type(screen.getByLabelText(/objective/i), "investigate the flaky test");
    await user.click(screen.getByRole("button", { name: /run debug/i }));

    expect(await screen.findByText("Cortana crashed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("plans a task, then gates starting the job behind an explicit confirmation", async () => {
    const user = userEvent.setup();
    render(<AgentActionPanel agent={executorAgent} command="task" cwd="/repo" cwdValid />, {
      wrapper,
    });

    await user.type(screen.getByLabelText(/objective/i), "add a health check endpoint");
    await user.click(screen.getByRole("button", { name: /plan task/i }));

    await user.click(await screen.findByRole("button", { name: /^run task$/i }));

    const dialog = await screen.findByRole("dialog", { name: /confirm task/i });
    expect(dialog).toHaveTextContent("add a health check endpoint");
    expect(dialog).toHaveTextContent("/repo");
    expect(dialog).toHaveTextContent(/worktree/i);

    // Cancelling must not start the job.
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/task completed/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^run task$/i }));
    await user.click(await screen.findByRole("button", { name: /confirm & run/i }));

    expect(await screen.findByText(/task completed/i)).toBeInTheDocument();
  });
});
