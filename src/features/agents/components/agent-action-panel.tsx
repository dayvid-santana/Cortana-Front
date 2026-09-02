import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { AgentResultPanel } from "@/features/agents/components/agent-result-panel";
import { ArchitectureDecisionPanel } from "@/features/agents/components/architecture-decision-panel";
import { TaskRunPanel } from "@/features/agents/components/task-run-panel";
import {
  useAgentAsk,
  useAgentContext,
  useAgentDebug,
  useAgentReview,
  useAgentTest,
  useGitCommitPlan,
} from "@/features/agents/api/queries";
import type { KnownAgentCommand } from "@/features/agents/lib/agent-commands";
import { COMMAND_LABELS } from "@/features/agents/lib/agent-commands";
import { toDisplayCortanaProblem } from "@/lib/api/cortana/errors";
import type { CortanaAgent, CortanaAgentResponse } from "@/lib/api/cortana/types";
import { isArchitectureDecisionRequired } from "@/lib/api/cortana/types";

interface AgentActionPanelProps {
  agent: CortanaAgent;
  command: KnownAgentCommand;
  cwd: string;
  cwdValid: boolean;
}

const OBJECTIVE_COMMANDS: ReadonlySet<KnownAgentCommand> = new Set([
  "context",
  "ask",
  "debug",
  "task",
]);

/** Every command except "task" is a single read-only request/response — "task" is a multi-step
 * plan/approval/job flow with its own state machine, handled entirely by TaskRunPanel. */
type ReadCommand = Exclude<KnownAgentCommand, "task">;

export function AgentActionPanel({ agent, command, cwd, cwdValid }: AgentActionPanelProps) {
  const [objective, setObjective] = useState("");
  const [staged, setStaged] = useState(false);

  const context = useAgentContext();
  const ask = useAgentAsk();
  const review = useAgentReview();
  const test = useAgentTest();
  const debug = useAgentDebug();
  const commitPlan = useGitCommitPlan();

  const mutations: Record<ReadCommand, UseMutationResult<CortanaAgentResponse, unknown, never>> = {
    // Cast is safe here: each mutation's variables type matches its own runner below;
    // this record only exists so status/data/error can be read generically by command.
    context: context as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
    ask: ask as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
    review: review as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
    test: test as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
    debug: debug as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
    "commit-plan": commitPlan as unknown as UseMutationResult<CortanaAgentResponse, unknown, never>,
  };

  const isTask = command === "task";
  const active = isTask ? undefined : mutations[command];
  const anyPending =
    context.isPending ||
    ask.isPending ||
    review.isPending ||
    test.isPending ||
    debug.isPending ||
    commitPlan.isPending;

  const needsObjective = OBJECTIVE_COMMANDS.has(command);
  const canSubmit = cwdValid && !anyPending && (!needsObjective || objective.trim().length > 0);

  function run() {
    if (!canSubmit || active === undefined) return;
    switch (command) {
      case "context":
        context.mutate({ cwd, objective: objective.trim() });
        return;
      case "ask":
        ask.mutate({ cwd, objective: objective.trim() });
        return;
      case "review":
        review.mutate({ cwd, staged });
        return;
      case "test":
        test.mutate({ cwd });
        return;
      case "debug":
        debug.mutate({ cwd, objective: objective.trim() });
        return;
      case "commit-plan":
        commitPlan.mutate({ cwd });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-foreground text-sm font-semibold">
          {agent.name} — {COMMAND_LABELS[command]}
        </p>
        <p className="text-muted-foreground text-[13px]">{agent.description}</p>
      </div>

      {needsObjective ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-objective" className="text-foreground text-[13px] font-medium">
            Objective
          </label>
          <Textarea
            id="agent-objective"
            rows={3}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Describe what you want Cortana to do…"
            disabled={anyPending}
          />
        </div>
      ) : null}

      {command === "review" ? (
        <label className="text-foreground flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={staged}
            onChange={(event) => setStaged(event.target.checked)}
            disabled={anyPending}
            className="accent-accent"
          />
          Staged changes only
        </label>
      ) : null}

      {!cwdValid ? (
        <p className="text-warning text-[12px]">
          Enter a project directory (cwd) above to continue.
        </p>
      ) : null}

      {isTask ? (
        <TaskRunPanel cwd={cwd} objective={objective.trim()} canSubmit={canSubmit} />
      ) : (
        <>
          <div>
            <Button onClick={run} disabled={!canSubmit}>
              {active?.isPending ? "Running…" : `Run ${COMMAND_LABELS[command].toLowerCase()}`}
            </Button>
          </div>

          {active?.isPending ? <LoadingState rows={3} label={`Running ${agent.name}`} /> : null}

          {active?.isError ? (
            <ErrorState problem={toDisplayCortanaProblem(active.error)} onRetry={run} />
          ) : null}

          {active?.isSuccess && active.data ? (
            isArchitectureDecisionRequired(active.data) ? (
              <ArchitectureDecisionPanel decision={active.data} />
            ) : (
              <AgentResultPanel result={active.data} />
            )
          ) : null}
        </>
      )}
    </div>
  );
}
