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
  "commit-plan": "commit-plan",
  commit_plan: "commit-plan",
  "git/commit-plan": "commit-plan",
};

export function resolveKnownCommand(command: string): KnownAgentCommand | undefined {
  return COMMAND_ALIASES[command.trim().toLowerCase()];
}

export const COMMAND_LABELS: Record<KnownAgentCommand, string> = {
  context: "Gather context",
  ask: "Ask",
  review: "Review",
  test: "Run tests",
  debug: "Debug",
  task: "Run task",
  "commit-plan": "Commit plan",
};

/** Only /agent/task can create or modify files — every other command is read-only analysis. */
export const MUTATING_COMMANDS: ReadonlySet<KnownAgentCommand> = new Set(["task"]);
