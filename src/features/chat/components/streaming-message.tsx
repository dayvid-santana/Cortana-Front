import { Loader2 } from "lucide-react";

import { MarkdownContent } from "@/components/content/markdown-content";
import { CitationList } from "@/features/chat/components/citation-list";
import type { RunState } from "@/features/chat/streaming/run-reducer";
import { cn } from "@/lib/utils/cn";

interface StreamingMessageProps {
  projectId: string;
  runState: RunState;
}

const statusLabel: Record<RunState["status"], string> = {
  idle: "",
  connecting: "Connecting…",
  streaming: "Thinking…",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function StreamingMessage({ projectId, runState }: StreamingMessageProps) {
  if (runState.status === "completed") return null;

  return (
    <div className="flex flex-col items-start gap-1" aria-live="polite">
      <div className="border-border bg-surface max-w-[85%] rounded-md border px-3 py-2">
        {runState.toolActivity.length > 0 ? (
          <ul className="mb-2 flex flex-col gap-1">
            {runState.toolActivity.map((tool) => (
              <li
                key={tool.id}
                className="text-muted-foreground flex items-center gap-1.5 text-[12px]"
              >
                {tool.status === "started" ? (
                  <Loader2 size={11} aria-hidden="true" className="animate-spin" />
                ) : (
                  <span className="bg-success h-1.5 w-1.5 rounded-full" />
                )}
                {tool.name}
                {tool.detail ? <span className="font-mono">· {tool.detail}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {runState.transcript ? (
          <MarkdownContent content={runState.transcript} />
        ) : runState.status === "connecting" ? (
          <p className="text-muted-foreground text-[13px]">Connecting…</p>
        ) : null}

        {runState.sources.length > 0 ? (
          <CitationList projectId={projectId} sources={runState.sources} />
        ) : null}

        {runState.status === "failed" && runState.error ? (
          <p role="alert" className="text-danger mt-1 text-[13px]">
            {runState.error.title}
            {runState.error.detail ? `: ${runState.error.detail}` : ""}
          </p>
        ) : null}
      </div>

      <span
        className={cn(
          "text-muted-foreground text-[11px]",
          runState.status === "failed" && "text-danger",
          runState.status === "cancelled" && "text-warning",
        )}
      >
        {statusLabel[runState.status]}
      </span>
    </div>
  );
}
