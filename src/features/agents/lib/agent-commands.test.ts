import { describe, expect, it } from "vitest";

import { resolveKnownCommand } from "@/features/agents/lib/agent-commands";

describe("resolveKnownCommand", () => {
  it("resolves a bare verb", () => {
    expect(resolveKnownCommand("context")).toBe("context");
  });

  it("resolves GET /agents' full CLI usage strings", () => {
    expect(resolveKnownCommand("dev-agent context")).toBe("context");
    expect(resolveKnownCommand('dev-agent debug "<problema>"')).toBe("debug");
    expect(resolveKnownCommand("dev-agent review [--staged]")).toBe("review");
    expect(resolveKnownCommand("dev-agent test")).toBe("test");
    expect(resolveKnownCommand("dev-agent commit")).toBe("commit-plan");
    expect(resolveKnownCommand('dev-agent task "<objetivo>"')).toBe("task");
    expect(resolveKnownCommand('dev-agent task "<objetivo estrutural>"')).toBe("task");
  });

  it("returns undefined for a verb with no wired HTTP route (model, patterns, document-project)", () => {
    expect(resolveKnownCommand('dev-agent model "<objetivo>"')).toBeUndefined();
    expect(resolveKnownCommand('dev-agent patterns "<objetivo>"')).toBeUndefined();
    expect(resolveKnownCommand("dev-agent document-project")).toBeUndefined();
  });
});
