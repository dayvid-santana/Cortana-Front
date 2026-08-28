import { Compass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CortanaArchitectureDecision } from "@/lib/api/cortana/types";

interface ArchitectureDecisionPanelProps {
  decision: CortanaArchitectureDecision;
}

/** Cortana cannot proceed without a human architectural call — the frontend must display this and stop, never auto-continue. */
export function ArchitectureDecisionPanel({ decision }: ArchitectureDecisionPanelProps) {
  const { question, summary, options } = decision;

  return (
    <div
      role="alert"
      className="border-warning/30 bg-warning/5 flex flex-col gap-3 rounded-md border p-4"
    >
      <div className="text-warning flex items-center gap-2">
        <Compass size={16} aria-hidden="true" />
        <p className="text-sm font-medium">Architecture decision required</p>
      </div>
      <p className="text-muted-foreground text-[13px]">
        Cortana is waiting for guidance and has not taken any further action.
      </p>
      {question ? <p className="text-foreground text-[13px] font-medium">{question}</p> : null}
      {summary ? <p className="text-foreground text-[13px]">{summary}</p> : null}
      {options && options.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {options.map((option, index) => (
            <li
              key={option.id ?? option.label ?? index}
              className="border-border bg-surface rounded-sm border p-2"
            >
              <div className="flex items-center gap-2">
                {option.label ? (
                  <p className="text-foreground text-[13px] font-medium">{option.label}</p>
                ) : null}
                {option.id ? <Badge variant="outline">{option.id}</Badge> : null}
              </div>
              {option.description ? (
                <p className="text-muted-foreground mt-0.5 text-[12px]">{option.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
