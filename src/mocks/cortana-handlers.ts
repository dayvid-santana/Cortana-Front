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

  // /agent/task is deliberately absent: the real dev-agent always rejects it
  // (deprecated=True). Task execution goes through the plan/job flow below.
];

interface MockTaskPlan {
  id: string;
  project_root: string;
  project_name: string;
  objective: string;
  base_branch: string;
  relevant_files: string[];
  warnings: string[];
  architecture_decision_required: boolean;
  architecture_approved: boolean;
  architecture_decision: string | null;
  requires_confirmation: boolean;
  created_at: string;
}

interface MockAgentJob {
  id: string;
  plan_id: string;
  project_root: string;
  objective: string;
  status:
    "queued" | "running" | "completed" | "partially_completed" | "failed" | "cancelled" | "blocked";
  phase: string | null;
  branch: string | null;
  worktree_path: string | null;
  worktree_removed: boolean;
  results: Record<string, unknown>[];
  diff: string | null;
  error: string | null;
  cancellation_requested: boolean;
  resumable: boolean;
  resume_attempts: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

let mockPlanCounter = 0;
let mockJobCounter = 0;
const mockPlans = new Map<string, MockTaskPlan>();
const mockJobs = new Map<string, MockAgentJob>();

export const cortanaTaskPlanHandlers = [
  http.post(`${CORTANA_BASE_URL}/assistant/task-plans`, async ({ request }) => {
    const body = (await request.json()) as { cwd?: string; objective?: string };
    if (!body.cwd) return problem(400, "cwd is required");
    mockPlanCounter += 1;
    const needsArchitecture = body.objective?.toLowerCase().includes("architecture") ?? false;
    const plan: MockTaskPlan = {
      id: `plan_${mockPlanCounter}`,
      project_root: body.cwd,
      project_name: body.cwd.split(/[\\/]/).filter(Boolean).pop() ?? body.cwd,
      objective: body.objective ?? "",
      base_branch: "main",
      relevant_files: [],
      warnings: needsArchitecture ? ["This objective touches a structural decision."] : [],
      architecture_decision_required: needsArchitecture,
      architecture_approved: false,
      architecture_decision: null,
      requires_confirmation: true,
      created_at: new Date().toISOString(),
    };
    mockPlans.set(plan.id, plan);
    return HttpResponse.json(plan);
  }),

  http.post(
    `${CORTANA_BASE_URL}/assistant/task-plans/:id/architecture-approval`,
    async ({ params, request }) => {
      const plan = mockPlans.get(params.id as string);
      if (!plan) return problem(404, "Plan not found");
      const body = (await request.json()) as { decision?: string };
      plan.architecture_approved = true;
      plan.architecture_decision = body.decision ?? null;
      return HttpResponse.json(plan);
    },
  ),

  http.post(`${CORTANA_BASE_URL}/assistant/task-plans/:id/start`, ({ params }) => {
    const plan = mockPlans.get(params.id as string);
    if (!plan) return problem(404, "Plan not found");
    mockJobCounter += 1;
    const job: MockAgentJob = {
      id: `job_${mockJobCounter}`,
      plan_id: plan.id,
      project_root: plan.project_root,
      objective: plan.objective,
      status: "completed",
      phase: "completed",
      branch: `dev-agent/${plan.id}`,
      worktree_path: `/tmp/dev-agent-worktrees/${plan.id}`,
      worktree_removed: false,
      results: [
        {
          agent: "implementation",
          summary: `Task completed: "${plan.objective}".`,
          files_changed: ["src/features/example/thing.ts"],
          tests_executed: ["unit: 42 passed"],
          warnings: [],
          next_actions: ["Open a PR for review."],
        },
      ],
      diff: "diff --git a/src/features/example/thing.ts b/src/features/example/thing.ts\n+// mock diff",
      error: null,
      cancellation_requested: false,
      resumable: false,
      resume_attempts: 0,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    mockJobs.set(job.id, job);
    return HttpResponse.json(job);
  }),

  http.get(`${CORTANA_BASE_URL}/assistant/jobs/:id`, ({ params }) => {
    const job = mockJobs.get(params.id as string);
    if (!job) return problem(404, "Job not found");
    return HttpResponse.json(job);
  }),

  http.post(`${CORTANA_BASE_URL}/assistant/jobs/:id/cancel`, ({ params }) => {
    const job = mockJobs.get(params.id as string);
    if (!job) return problem(404, "Job not found");
    job.status = "cancelled";
    return HttpResponse.json(job);
  }),

  http.post(`${CORTANA_BASE_URL}/assistant/jobs/:id/resume`, ({ params }) => {
    const job = mockJobs.get(params.id as string);
    if (!job) return problem(404, "Job not found");
    job.status = "completed";
    return HttpResponse.json(job);
  }),

  http.post(`${CORTANA_BASE_URL}/assistant/jobs/:id/cleanup`, ({ params }) => {
    const job = mockJobs.get(params.id as string);
    if (!job) return problem(404, "Job not found");
    job.worktree_removed = true;
    return HttpResponse.json(job);
  }),
];
