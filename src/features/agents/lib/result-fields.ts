import type { CortanaAgentResult } from "@/lib/api/cortana/types";

/**
 * Cortana's action responses aren't pinned to one exact JSON shape. These
 * helpers only ever read fields that are actually present on the response —
 * they never fabricate a value — and fall back to trying a couple of
 * plausible key-name variants (snake_case being the more likely one, given
 * the API's own `architecture_decision_required` field name).
 */

function pick(result: CortanaAgentResult, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in result && result[key] !== undefined) return result[key];
  }
  return undefined;
}

export function pickText(result: CortanaAgentResult): string | undefined {
  const value = pick(result, "summary", "message", "content", "output");
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function pickFilesChanged(result: CortanaAgentResult): unknown {
  return pick(result, "files_changed", "filesChanged", "changed_files", "changedFiles");
}

export function pickTestsRun(result: CortanaAgentResult): unknown {
  return pick(result, "tests_run", "testsRun", "tests");
}

export function pickFailures(result: CortanaAgentResult): unknown {
  return pick(result, "failures", "test_failures", "errors");
}

export function pickWarnings(result: CortanaAgentResult): unknown {
  return pick(result, "warnings", "alerts");
}

export function pickRisks(result: CortanaAgentResult): unknown {
  return pick(result, "risks");
}

export function pickNextSteps(result: CortanaAgentResult): unknown {
  return pick(result, "next_steps", "nextSteps");
}

const KNOWN_KEYS = [
  "summary",
  "message",
  "content",
  "output",
  "files_changed",
  "filesChanged",
  "changed_files",
  "changedFiles",
  "tests_run",
  "testsRun",
  "tests",
  "failures",
  "test_failures",
  "errors",
  "warnings",
  "alerts",
  "risks",
  "next_steps",
  "nextSteps",
  "architecture_decision_required",
];

/** Every field the response returned that the structured layout above doesn't already surface. */
export function pickRemainingEntries(result: CortanaAgentResult): [string, unknown][] {
  return Object.entries(result).filter(([key]) => !KNOWN_KEYS.includes(key));
}

/** Renders a list-shaped field (array of strings, array of objects, or a lone string) as display lines. */
export function toDisplayLines(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const label = record.path ?? record.name ?? record.title ?? record.id;
        if (typeof label === "string") {
          const status = record.status ?? record.changeType ?? record.change_type;
          return typeof status === "string" ? `${label} (${status})` : label;
        }
      }
      return JSON.stringify(item);
    });
  }
  if (typeof value === "string") return [value];
  return [JSON.stringify(value)];
}
