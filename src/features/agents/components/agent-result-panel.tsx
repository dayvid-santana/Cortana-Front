import {
  pickFailures,
  pickFilesChanged,
  pickNextSteps,
  pickRemainingEntries,
  pickRisks,
  pickTestsRun,
  pickText,
  pickWarnings,
  toDisplayLines,
} from "@/features/agents/lib/result-fields";
import type { CortanaAgentResult } from "@/lib/api/cortana/types";

interface AgentResultPanelProps {
  result: CortanaAgentResult;
}

interface Section {
  title: string;
  lines: string[];
}

/**
 * Renders exactly what Cortana returned — files changed, tests run,
 * failures, warnings, risks, next steps — and nothing it didn't. A section
 * with no data from the API is omitted rather than shown empty or guessed.
 */
export function AgentResultPanel({ result }: AgentResultPanelProps) {
  const summary = pickText(result);
  const sections: Section[] = [
    { title: "Files changed", lines: toDisplayLines(pickFilesChanged(result)) },
    { title: "Tests executed", lines: toDisplayLines(pickTestsRun(result)) },
    { title: "Failures", lines: toDisplayLines(pickFailures(result)) },
    { title: "Warnings", lines: toDisplayLines(pickWarnings(result)) },
    { title: "Risks", lines: toDisplayLines(pickRisks(result)) },
    { title: "Next steps", lines: toDisplayLines(pickNextSteps(result)) },
  ].filter((section) => section.lines.length > 0);
  const remaining = pickRemainingEntries(result);

  if (!summary && sections.length === 0 && remaining.length === 0) {
    return (
      <p className="text-muted-foreground text-[13px]">
        Cortana returned an empty response for this action.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <p className="text-foreground text-[13px] whitespace-pre-wrap">{summary}</p>
      ) : null}

      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="text-foreground text-[12px] font-semibold tracking-wide uppercase">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.lines.map((line, index) => (
              <li key={index} className="text-muted-foreground text-[13px]">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {remaining.length > 0 ? (
        <details className="border-border rounded-sm border">
          <summary className="text-muted-foreground cursor-pointer px-2 py-1.5 text-[12px] font-medium">
            Additional details from Cortana
          </summary>
          <pre className="text-muted-foreground overflow-x-auto px-2 pb-2 text-[11px]">
            {JSON.stringify(Object.fromEntries(remaining), null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
