import { http, HttpResponse, delay } from "msw";
import { describe, expect, it } from "vitest";

import { isCortanaApiError, isCortanaNetworkError } from "@/lib/api/cortana/errors";
import {
  getCortanaAgents,
  getCortanaHealth,
  postAgentTest,
  postTaskPlan,
} from "@/lib/api/cortana/client";
import { CORTANA_BASE_URL } from "@/mocks/cortana-fixtures";
import { server } from "@/test/msw-server";

describe("Cortana client", () => {
  it("fetches the agent list from GET /agents", async () => {
    const agents = await getCortanaAgents();
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.some((agent) => agent.command === "task")).toBe(true);
  });

  it("fetches health", async () => {
    const health = await getCortanaHealth();
    expect(health.status).toBe("ok");
  });

  it("creates a task plan for a normal objective, with no architecture decision pending", async () => {
    const plan = await postTaskPlan({ cwd: "/repo", objective: "add a health check" });
    expect(plan.architecture_decision_required).toBe(false);
    expect(plan.objective).toBe("add a health check");
  });

  it("flags a structural objective's plan as requiring an architecture decision, unapproved", async () => {
    const plan = await postTaskPlan({
      cwd: "/repo",
      objective: "pick an architecture for the queue",
    });
    expect(plan.architecture_decision_required).toBe(true);
    expect(plan.architecture_approved).toBe(false);
  });

  it("wraps a non-2xx response in a CortanaApiError carrying the server's detail", async () => {
    const error = await postAgentTest({ cwd: "" }).catch((caught: unknown) => caught);
    expect(isCortanaApiError(error)).toBe(true);
    if (isCortanaApiError(error)) {
      expect(error.status).toBe(400);
      expect(error.problem.title).toBe("cwd is required");
    }
  });

  it("treats a response slower than the given timeout as a CortanaNetworkError('timeout')", async () => {
    server.use(
      http.get(`${CORTANA_BASE_URL}/health`, async () => {
        await delay(200);
        return HttpResponse.json({ status: "ok" });
      }),
    );

    const error = await getCortanaHealth({ timeoutMs: 20 }).catch((caught: unknown) => caught);
    expect(isCortanaNetworkError(error)).toBe(true);
    if (isCortanaNetworkError(error)) {
      expect(error.kind).toBe("timeout");
    }
  });

  it("treats an externally aborted signal as a CortanaNetworkError('aborted')", async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await getCortanaHealth({ signal: controller.signal }).catch(
      (caught: unknown) => caught,
    );
    expect(isCortanaNetworkError(error)).toBe(true);
    if (isCortanaNetworkError(error)) {
      expect(error.kind).toBe("aborted");
    }
  });
});
