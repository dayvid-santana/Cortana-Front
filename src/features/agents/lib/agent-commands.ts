/**
 * Cortana's fixed action routes. GET /agents is the source of truth for
 * which agents exist and their name/description/mode — this module only
 * maps a returned `command` value to the endpoint the UI knows how to call.
 * An agent whose `command` isn't one of these is still shown (per the
 * source-of-truth rule) but rendered as informational-only, since the
 * frontend has no defined action to run for it.
 */
export type KnownAgentCommand =
  "context" | "ask" | "review" | "test" | "debug" | "task" | "commit-plan";

const COMMAND_ALIASES: Record<string, KnownAgentCommand> = {
  context: "context",
  ask: "ask",
  review: "review",
  test: "test",
  debug: "debug",
  task: "task",
  commit: "commit-plan",
  "commit-plan": "commit-plan",
  commit_plan: "commit-plan",
  "git/commit-plan": "commit-plan",
};

/**
 * GET /agents' `command` field is a full CLI usage string, e.g.
 * `dev-agent debug "<problema>"`, `dev-agent review [--staged]`, or
 * `dev-agent task "<objetivo>"` (the last one shared by every catalog
 * component that only runs as part of the write pipeline, not standalone —
 * see docs/agent-inventory.md in dev-agent). The verb is the first word
 * after the `dev-agent ` prefix; everything after it is a placeholder
 * argument or flag hint, never part of the command name itself.
 */
function extractVerb(command: string): string {
  const withoutPrefix = command.trim().replace(/^dev-agent\s+/i, "");
  return withoutPrefix.split(/\s+/)[0] ?? "";
}

export function resolveKnownCommand(command: string): KnownAgentCommand | undefined {
  return COMMAND_ALIASES[extractVerb(command).toLowerCase()];
}

export const COMMAND_LABELS: Record<KnownAgentCommand, string> = {
  context: "Gather context",
  ask: "Ask",
  review: "Review",
  test: "Tests",
  debug: "Debug",
  task: "Run task",
  "commit-plan": "Commit plan",
};

/** Only /agent/task can create or modify files — every other command is read-only analysis. */
export const MUTATING_COMMANDS: ReadonlySet<KnownAgentCommand> = new Set(["task"]);
