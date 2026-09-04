import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { applyEditProposal } from "@/features/chat/api/queries";
import { toDisplayProblem } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import type { components } from "@/lib/api/schema";

type EditProposal = components["schemas"]["EditProposal"];

function DiffText({ diff }: { diff: string }) {
  return (
    <pre className="overflow-x-auto px-2 py-1.5 font-mono text-[12px] leading-5 whitespace-pre-wrap">
      {diff.split("\n").map((line, index) => (
        <div
          key={index}
          className={cn(
            line.startsWith("+") && !line.startsWith("+++") && "text-diff-added bg-diff-added-bg",
            line.startsWith("-") &&
              !line.startsWith("---") &&
              "text-diff-removed bg-diff-removed-bg",
            (line.startsWith("@@") || line.startsWith("diff --git")) &&
              "text-diff-context bg-surface-muted",
          )}
        >
          {line || " "}
        </div>
      ))}
    </pre>
  );
}

/**
 * O único lugar do chat que pode gravar em disco — e só faz isso depois que a
 * pessoa usuária aperta "Apply" (ou confirma por voz; ver chat.tsx). Antes disso,
 * é só uma proposta: o backend já a gerou (dev-agent ou LLM direto), mas nada foi
 * escrito ainda.
 */
export function EditProposalCard({
  projectId,
  proposal,
  onApplied,
}: {
  projectId: string;
  proposal: EditProposal;
  /** Notifica quem chamou (ex.: para falar uma confirmação em voz); não é a
   * fonte da verdade do estado "aplicado" — este componente rastreia isso sozinho,
   * já que a mensagem persistida não guarda a proposta após um refetch. */
  onApplied?: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(proposal.applied);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (applied) {
    return (
      <div className="border-success/30 bg-success/10 text-success rounded-sm border px-2.5 py-1.5 text-[12px]">
        <Check size={12} aria-hidden="true" className="mr-1 inline" />
        Applied to disk
      </div>
    );
  }
  if (dismissed) {
    return (
      <div className="text-muted-foreground border-border rounded-sm border px-2.5 py-1.5 text-[12px]">
        Discarded — nothing was written.
      </div>
    );
  }

  const apply = async () => {
    setApplying(true);
    setError(null);
    try {
      await applyEditProposal(projectId, proposal.id);
      setApplied(true);
      onApplied?.();
    } catch (cause) {
      setError(toDisplayProblem(cause).detail ?? "Could not apply this change.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="border-edit-scope/30 max-w-[85%] overflow-hidden rounded-md border">
      <div className="border-edit-scope/30 bg-edit-scope/10 text-edit-scope flex items-center justify-between border-b px-2.5 py-1 text-[11px] font-medium">
        <span>
          Proposed change{proposal.files.length > 1 ? ` (${proposal.files.length} files)` : ""} ·{" "}
          {proposal.engine === "dev_agent_headers"
            ? "dev-agent · headers"
            : proposal.engine === "dev_agent"
              ? "dev-agent"
              : "direct"}
        </span>
      </div>
      <div className="divide-border divide-y">
        {proposal.files.map((file) => (
          <div key={file.path}>
            <div className="text-muted-foreground bg-surface px-2 py-1 font-mono text-[11px]">
              {file.path}
            </div>
            <DiffText diff={file.diff} />
          </div>
        ))}
      </div>
      <div className="border-border bg-surface flex items-center gap-1.5 border-t px-2 py-1.5">
        <Button size="sm" onClick={() => void apply()} disabled={applying}>
          {applying ? (
            <Loader2 size={12} aria-hidden="true" className="animate-spin" />
          ) : (
            <Check size={12} aria-hidden="true" />
          )}
          Apply
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDismissed(true)} disabled={applying}>
          <X size={12} aria-hidden="true" />
          Discard
        </Button>
        {error ? <span className="text-danger text-[11px]">{error}</span> : null}
      </div>
    </div>
  );
}
