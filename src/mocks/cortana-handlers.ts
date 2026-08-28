import { http, HttpResponse } from "msw";

import { CORTANA_BASE_URL, cortanaAgents } from "@/mocks/cortana-fixtures";

function problem(status: number, title: string, detail?: string) {
  return HttpResponse.json({ title, status, detail }, { status });
}

function architectureDecision(objective: string) {
  return {
    architecture_decision_required: true as const,
    question: "Should this use the existing event bus or a new direct call?",
    summary: `Cortana found more than one viable approach for: "${objective}".`,
    options: [
      {
        id: "event-bus",
        label: "Reuse the event bus",
        description: "Consistent, but adds latency.",
      },
      {
        id: "direct-call",
        label: "Direct call",
        description: "Simpler, but couples the two modules.",
      },
    ],
  };
}

export const cortanaHandlers = [
  http.get(`${CORTANA_BASE_URL}/health`, () =>
    HttpResponse.json({ status: "ok", version: "0.4.0" }),
  ),

  http.get(`${CORTANA_BASE_URL}/session`, () =>
    HttpResponse.json({
      session_id: "sess_local_dev",
      started_at: "2026-08-28T09:00:00Z",
    }),
  ),

  http.get(`${CORTANA_BASE_URL}/agents`, () => HttpResponse.json(cortanaAgents)),

  http.post(`${CORTANA_BASE_URL}/agent/context`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; objective?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    if (body.objective?.toLowerCase().includes("architecture")) {
      return HttpResponse.json(architectureDecision(body.objective));
    }
    return HttpResponse.json({
      summary: `Gathered context for: "${body.objective ?? ""}".`,
      next_steps: ["Review the linked files before asking a follow-up question."],
    });
  }),

  http.post(`${CORTANA_BASE_URL}/agent/ask`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; objective?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    return HttpResponse.json({
      message: `Mock answer for: "${body.objective ?? ""}".`,
    });
  }),

  http.post(`${CORTANA_BASE_URL}/agent/review`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; staged?: boolean };
    if (!body.cwd) return problem(400, "cwd is required");
    return HttpResponse.json({
      summary: body.staged ? "Reviewed staged changes." : "Reviewed the full working tree.",
      files_changed: ["src/features/example/thing.ts"],
      warnings: ["Missing test coverage for the new branch."],
      risks: [],
    });
  }),

  http.post(`${CORTANA_BASE_URL}/agent/test`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    return HttpResponse.json({
      summary: "Test run completed.",
      tests_run: ["unit: 42 passed", "integration: 6 passed"],
      failures: [],
    });
  }),

  http.post(`${CORTANA_BASE_URL}/agent/debug`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; objective?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    if (body.objective?.toLowerCase().includes("architecture")) {
      return HttpResponse.json(architectureDecision(body.objective));
    }
    return HttpResponse.json({
      summary: `Diagnosis for: "${body.objective ?? ""}".`,
      risks: ["Fix may require a schema migration."],
      next_steps: ["Reproduce with the provided repro steps.", "Add a regression test."],
    });
  }),

  http.post(`${CORTANA_BASE_URL}/git/commit-plan`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    return HttpResponse.json({
      summary: "Proposed commit plan for the current changes.",
      files_changed: ["src/features/example/thing.ts", "src/features/example/thing.test.ts"],
      next_steps: ['Suggested message: "feat: add thing validation"'],
    });
  }),

  http.post(`${CORTANA_BASE_URL}/agent/task`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; objective?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    if (body.objective?.toLowerCase().includes("architecture")) {
      return HttpResponse.json(architectureDecision(body.objective));
    }
    return HttpResponse.json({
      summary: `Task completed: "${body.objective ?? ""}".`,
      files_changed: ["src/features/example/thing.ts"],
      tests_run: ["unit: 42 passed"],
      failures: [],
      warnings: [],
      risks: [],
      next_steps: ["Open a PR for review."],
    });
  }),
];
