import type { CortanaAgent } from "@/lib/api/cortana/types";

export const CORTANA_BASE_URL = "http://127.0.0.1:8765";

export const cortanaAgents: CortanaAgent[] = [
  {
    name: "context-agent",
    description: "Gathers relevant project context for a stated objective.",
    mode: "read-only",
    command: "context",
  },
  {
    name: "ask-agent",
    description: "Answers a question about the codebase.",
    mode: "read-only",
    command: "ask",
  },
  {
    name: "reviewer",
    description: "Reviews the working tree (or just staged changes) for issues.",
    mode: "read-only",
    command: "review",
  },
  {
    name: "tester",
    description: "Runs the project's test suite and reports results.",
    mode: "read-only",
    command: "test",
  },
  {
    name: "debugger",
    description: "Investigates a described bug and proposes a diagnosis.",
    mode: "read-only",
    command: "debug",
  },
  {
    name: "commit-planner",
    description: "Drafts a commit plan for the current changes.",
    mode: "read-only",
    command: "commit-plan",
  },
  {
    name: "executor",
    description: "Executes a task end-to-end. May create or modify files.",
    mode: "read-write",
    command: "task",
  },
];
