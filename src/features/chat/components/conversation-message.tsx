import { ChevronDown, Pencil } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/content/markdown-content";
import { CitationList } from "@/features/chat/components/citation-list";
import { EditProposalCard } from "@/features/chat/components/edit-proposal-card";
import type { components } from "@/lib/api/schema";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";
import { cn } from "@/lib/utils/cn";

type Message = components["schemas"]["Message"];

interface UserMessageProps {
  content: string;
  createdAt: string;
  pending?: "sending" | "failed" | undefined;
}

export function UserMessage({ content, createdAt, pending }: UserMessageProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={cn(
          "bg-accent text-accent-foreground max-w-[80%] rounded-md px-3 py-2 text-[13px]",
          pending === "sending" && "opacity-70",
          pending === "failed" && "bg-danger",
        )}
      >
        {content}
      </div>
      <span className="text-muted-foreground text-[11px]">
        {pending === "sending"
          ? "Sending…"
          : pending === "failed"
            ? "Failed to send"
            : formatRelativeTime(createdAt)}
      </span>
    </div>
  );
}

export function AssistantMessage({
  projectId,
  message,
  onSwitchToEditScope,
}: {
  projectId: string;
  message: Message;
  /** Presente quando a mensagem foi gerada em Docs/Code mas parecia um pedido de
   * alteração (ver `suggestedScope` no backend) — troca a aba pro escopo Edit. */
  onSwitchToEditScope?: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasDetails = Boolean(
    message.provider || message.toolActivity?.length || message.durationMs,
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="border-border bg-surface max-w-[85%] rounded-md border px-3 py-2">
        <MarkdownContent content={message.content} />
        {message.sources && message.sources.length > 0 ? (
          <CitationList projectId={projectId} sources={message.sources} />
        ) : null}
      </div>

      {message.suggestedScope === "edit" && onSwitchToEditScope ? (
        <Button variant="outline" size="sm" onClick={onSwitchToEditScope}>
          <Pencil size={12} aria-hidden="true" />
          Switch to Edit
        </Button>
      ) : null}

      {message.editProposal ? (
        <EditProposalCard projectId={projectId} proposal={message.editProposal} />
      ) : null}

      <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
        <Badge variant={message.scope === "docs" ? "docs" : message.scope === "edit" ? "edit" : "code"}>
          {message.scope}
        </Badge>
        <time dateTime={message.createdAt} title={formatAbsoluteTime(message.createdAt)}>
          {formatRelativeTime(message.createdAt)}
        </time>
        {hasDetails ? (
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            className="hover:text-foreground inline-flex items-center gap-0.5"
          >
            <ChevronDown
              size={11}
              aria-hidden="true"
              className={cn("transition-transform", detailsOpen && "rotate-180")}
            />
            Run details
          </button>
        ) : null}
      </div>

      {detailsOpen ? (
        <dl className="border-border bg-surface-muted grid max-w-[85%] grid-cols-2 gap-x-3 gap-y-1 rounded-sm border px-2.5 py-2 text-[12px]">
          {message.provider ? (
            <>
              <dt className="text-muted-foreground">Provider</dt>
              <dd>
                {message.provider}
                {message.model ? ` (${message.model})` : ""}
              </dd>
            </>
          ) : null}
          {message.durationMs !== undefined ? (
            <>
              <dt className="text-muted-foreground">Duration</dt>
              <dd>{(message.durationMs / 1000).toFixed(1)}s</dd>
            </>
          ) : null}
          {message.toolActivity && message.toolActivity.length > 0 ? (
            <>
              <dt className="text-muted-foreground">Tools used</dt>
              <dd>{message.toolActivity.map((tool) => tool.name).join(", ")}</dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
