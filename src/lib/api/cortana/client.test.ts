import { http, HttpResponse, delay } from "msw";
import { describe, expect, it } from "vitest";

import { isCortanaApiError, isCortanaNetworkError } from "@/lib/api/cortana/errors";
import {
  getCortanaAgents,
  getCortanaHealth,
  postAgentTask,
  postAgentTest,
} from "@/lib/api/cortana/client";
import { isArchitectureDecisionRequired } from "@/lib/api/cortana/types";
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

  it("returns a structured result for a normal /agent/task objective", async () => {
    const result = await postAgentTask({ cwd: "/repo", objective: "add a health check" });
    expect(isArchitectureDecisionRequired(result)).toBe(false);
    expect(result.summary).toContain("add a health check");
  });

  it("surfaces architecture_decision_required without treating it as a normal result", async () => {
    const result = await postAgentTask({
      cwd: "/repo",
      objective: "pick an architecture for the queue",
    });
    expect(isArchitectureDecisionRequired(result)).toBe(true);
    if (isArchitectureDecisionRequired(result)) {
      expect(result.options?.length).toBeGreaterThan(0);
    }
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
