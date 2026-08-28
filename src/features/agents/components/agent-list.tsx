import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  COMMAND_LABELS,
  MUTATING_COMMANDS,
  resolveKnownCommand,
} from "@/features/agents/lib/agent-commands";
import type { CortanaAgent } from "@/lib/api/cortana/types";
import { cn } from "@/lib/utils/cn";

interface AgentListProps {
  agents: CortanaAgent[];
  selectedAgentName?: string | undefined;
  onSelect: (agent: CortanaAgent) => void;
  disabled?: boolean;
}

export function AgentList({ agents, selectedAgentName, onSelect, disabled }: AgentListProps) {
  return (
    <ul className="border-border flex flex-col divide-y rounded-md border">
      {agents.map((agent) => {
        const known = resolveKnownCommand(agent.command);
        const isSelected = agent.name === selectedAgentName;
        const isMutating = known !== undefined && MUTATING_COMMANDS.has(known);

        return (
          <li key={agent.name} className="flex items-start justify-between gap-3 p-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-foreground text-[13px] font-medium">{agent.name}</p>
                <Badge variant="outline">{agent.mode}</Badge>
                {isMutating ? (
                  <Badge variant="warning">
                    <ShieldAlert size={11} aria-hidden="true" /> can modify files
                  </Badge>
                ) : null}
                {known === undefined ? <Badge variant="outline">unsupported command</Badge> : null}
              </div>
              <p className="text-muted-foreground text-[13px]">{agent.description}</p>
            </div>
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn("shrink-0", isSelected && "pointer-events-none")}
              disabled={disabled || known === undefined}
              onClick={() => onSelect(agent)}
            >
              {isSelected ? "Selected" : known ? COMMAND_LABELS[known] : "Select"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
