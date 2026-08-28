import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { AgentActionPanel } from "@/features/agents/components/agent-action-panel";
import { AgentList } from "@/features/agents/components/agent-list";
import { CortanaConnectionBadge } from "@/features/agents/components/cortana-connection-badge";
import { CwdField } from "@/features/agents/components/cwd-field";
import { SessionPanel } from "@/features/agents/components/session-panel";
import { useCortanaAgents } from "@/features/agents/api/queries";
import { resolveKnownCommand } from "@/features/agents/lib/agent-commands";
import { isValidCwd } from "@/features/agents/lib/is-valid-cwd";
import { toDisplayCortanaProblem } from "@/lib/api/cortana/errors";
import type { CortanaAgent } from "@/lib/api/cortana/types";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage/local-storage";

export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
});

const LAST_CWD_STORAGE_KEY = "cortana.lastCwd";

function AgentsPage() {
  const agentsQuery = useCortanaAgents();
  const [cwd, setCwd] = useState(() => readLocalStorage(LAST_CWD_STORAGE_KEY, ""));
  const [selectedAgent, setSelectedAgent] = useState<CortanaAgent | undefined>(undefined);
  const cwdValid = isValidCwd(cwd);

  function handleCwdChange(value: string) {
    setCwd(value);
    writeLocalStorage(LAST_CWD_STORAGE_KEY, value);
  }

  const selectedCommand = selectedAgent ? resolveKnownCommand(selectedAgent.command) : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <PageHeader
        title="Agents"
        description="Runs against the local Cortana agent service."
        actions={<CortanaConnectionBadge />}
      />

      <section className="flex flex-col gap-2">
        <CwdField id="cortana-cwd" value={cwd} onChange={handleCwdChange} />
      </section>

      <section className="border-border flex flex-col gap-2 rounded-md border p-3">
        <p className="text-foreground text-[13px] font-semibold">Session</p>
        <SessionPanel />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-[13px] font-semibold">Available agents</p>

        {agentsQuery.status === "pending" ? <LoadingState rows={4} label="Loading agents" /> : null}

        {agentsQuery.status === "error" ? (
          <ErrorState
            problem={toDisplayCortanaProblem(agentsQuery.error)}
            onRetry={() => void agentsQuery.refetch()}
          />
        ) : null}

        {agentsQuery.status === "success" && agentsQuery.data.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents available"
            description="Cortana reported an empty agent list."
          />
        ) : null}

        {agentsQuery.status === "success" && agentsQuery.data.length > 0 ? (
          <AgentList
            agents={agentsQuery.data}
            selectedAgentName={selectedAgent?.name}
            onSelect={setSelectedAgent}
          />
        ) : null}
      </section>

      {selectedAgent && selectedCommand ? (
        <section className="border-border rounded-md border p-3">
          <AgentActionPanel
            agent={selectedAgent}
            command={selectedCommand}
            cwd={cwd.trim()}
            cwdValid={cwdValid}
          />
        </section>
      ) : null}
    </div>
  );
}
