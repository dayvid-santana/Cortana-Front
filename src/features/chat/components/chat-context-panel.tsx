import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useCommit } from "@/features/commits/hooks/use-commit";
import { useDecisions } from "@/features/decisions/hooks/use-decisions";
import { useQuestions } from "@/features/questions/hooks/use-questions";
import type { components } from "@/lib/api/schema";
import { shortHash } from "@/lib/formatting/commit";

type Provider = components["schemas"]["Provider"];

interface ChatContextPanelProps {
  projectId: string;
  commitHash: string;
  branch?: string;
  scope: "docs" | "code" | "edit";
  provider?: Provider;
}

export function ChatContextPanel({
  projectId,
  commitHash,
  branch,
  scope,
  provider,
}: ChatContextPanelProps) {
  const commit = useCommit(projectId, commitHash);
  const decisions = useDecisions(projectId, { status: "active" });
  const questions = useQuestions(projectId, { status: "open" });

  const includedDocs =
    scope === "docs" || scope === "code" ? (commit.data?.changedDocPaths ?? []) : [];
  const includedCode =
    scope === "code" || scope === "edit" ? (commit.data?.changedCodePaths ?? []) : [];

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <section>
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Target
        </h3>
        <dl className="mt-1.5 grid grid-cols-2 gap-y-1">
          <dt className="text-muted-foreground">Commit</dt>
          <dd className="font-mono">{shortHash(commitHash)}</dd>
          {branch ? (
            <>
              <dt className="text-muted-foreground">Branch</dt>
              <dd>{branch}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Scope</dt>
          <dd>
            <Badge variant={scope === "docs" ? "docs" : scope === "edit" ? "edit" : "code"}>
              {scope}
            </Badge>
          </dd>
          {provider ? (
            <>
              <dt className="text-muted-foreground">Provider</dt>
              <dd>
                {provider.name}
                {provider.model ? ` (${provider.model})` : ""}
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      {provider && !provider.local ? (
        <div className="border-warning/30 bg-warning/10 text-warning flex items-start gap-1.5 rounded-sm border px-2 py-1.5 text-[12px]">
          <AlertTriangle size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>This provider is remote — content sent as context leaves your machine.</span>
        </div>
      ) : null}

      <section>
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Included documents ({includedDocs.length})
        </h3>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {includedDocs.map((path) => (
            <li key={path} className="text-foreground truncate font-mono text-[12px]">
              {path}
            </li>
          ))}
          {includedDocs.length === 0 ? (
            <li className="text-muted-foreground text-[12px]">None</li>
          ) : null}
        </ul>
      </section>

      {scope === "code" || scope === "edit" ? (
        <section>
          <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Included code files ({includedCode.length})
          </h3>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {includedCode.map((path) => (
              <li key={path} className="text-foreground truncate font-mono text-[12px]">
                {path}
              </li>
            ))}
            {includedCode.length === 0 ? (
              <li className="text-muted-foreground text-[12px]">None</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Relevant decisions ({decisions.data?.items.length ?? 0})
        </h3>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {decisions.data?.items.map((decision) => (
            <li key={decision.id}>
              <Link
                to="/projects/$projectId/decisions/$decisionId"
                params={{ projectId, decisionId: decision.id }}
                className="text-accent text-[12px] hover:underline"
              >
                {decision.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Open questions ({questions.data?.items.length ?? 0})
        </h3>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {questions.data?.items.map((question) => (
            <li key={question.id} className="text-foreground truncate text-[12px]">
              {question.question}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
