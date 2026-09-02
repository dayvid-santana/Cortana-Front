import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";

interface AgentTaskConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: string;
  cwd: string;
  pending: boolean;
  onConfirm: () => void;
}

/**
 * The only gate before POST /assistant/task-plans/{id}/start. Clicking
 * Confirm here IS the explicit execution order the product spec requires —
 * there is no separate auto-skip path, since this is a form, not a chat
 * where a user might already have phrased an unambiguous order in free text.
 */
export function AgentTaskConfirmDialog({
  open,
  onOpenChange,
  objective,
  cwd,
  pending,
  onConfirm,
}: AgentTaskConfirmDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Confirm task"
        description="This creates an isolated branch and worktree, then runs Cortana's write agents in it."
      >
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground text-[12px] font-medium">Objective</p>
            <p className="text-foreground text-[13px] whitespace-pre-wrap">{objective}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[12px] font-medium">Directory (cwd)</p>
            <p className="text-foreground font-mono text-[13px]">{cwd}</p>
          </div>
          <div className="border-warning/30 bg-warning/5 text-warning flex items-start gap-2 rounded-sm border p-2">
            <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <p className="text-[13px]">
              Your current branch is never touched — this runs on a new `dev-agent/&lt;id&gt;`
              branch in a sibling worktree, which you can clean up afterwards.
            </p>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm} disabled={pending}>
              {pending ? "Running…" : "Confirm & run"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
