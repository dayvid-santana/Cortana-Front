import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApiProblem } from "@/lib/api/errors";

interface ErrorStateProps {
  problem: ApiProblem;
  onRetry?: () => void;
}

export function ErrorState({ problem, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger/5 flex flex-col items-start gap-2 rounded-md border px-4 py-3"
    >
      <div className="text-danger flex items-center gap-2">
        <AlertTriangle size={16} aria-hidden="true" />
        <p className="text-sm font-medium">{problem.title}</p>
      </div>
      {problem.detail ? (
        <p className="text-muted-foreground text-[13px]">{problem.detail}</p>
      ) : null}
      <div className="mt-1 flex items-center gap-2">
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {problem.requestId ? (
          <span className="text-muted-foreground text-[11px]">Request ID: {problem.requestId}</span>
        ) : null}
      </div>
    </div>
  );
}
