import { describe, expect, it } from "vitest";

import {
  CortanaApiError,
  CortanaNetworkError,
  isCortanaApiError,
  isCortanaNetworkError,
  toDisplayCortanaProblem,
} from "@/lib/api/cortana/errors";

describe("toDisplayCortanaProblem", () => {
  it("passes through a CortanaApiError's problem as-is", () => {
    const error = new CortanaApiError({
      title: "Not found",
      status: 404,
      detail: "Agent does not exist",
    });
    expect(toDisplayCortanaProblem(error)).toEqual({
      title: "Not found",
      status: 404,
      detail: "Agent does not exist",
    });
  });

  it("maps a network CortanaNetworkError to a status-0 problem naming the local service", () => {
    const problem = toDisplayCortanaProblem(new CortanaNetworkError("network", "fetch failed"));
    expect(problem.status).toBe(0);
    expect(problem.title).toContain("127.0.0.1:8765");
    expect(problem.detail).toBe("fetch failed");
  });

  it("maps a timeout CortanaNetworkError distinctly from a network failure", () => {
    const problem = toDisplayCortanaProblem(new CortanaNetworkError("timeout", "too slow"));
    expect(problem.title).toContain("did not respond");
  });

  it("maps an aborted CortanaNetworkError distinctly", () => {
    const problem = toDisplayCortanaProblem(new CortanaNetworkError("aborted", "cancelled"));
    expect(problem.title).toContain("cancelled");
  });

  it("never leaks a raw stack trace for generic errors", () => {
    const problem = toDisplayCortanaProblem(new Error("boom"));
    expect(problem.title).toBe("Something went wrong");
    expect(problem.detail).toBe("boom");
  });

  it("handles non-Error thrown values safely", () => {
    const problem = toDisplayCortanaProblem("a plain string was thrown");
    expect(problem.title).toBe("Something went wrong");
    expect(problem.status).toBe(500);
  });
});

describe("type guards", () => {
  it("isCortanaApiError narrows CortanaApiError instances", () => {
    expect(isCortanaApiError(new CortanaApiError({ title: "x", status: 400 }))).toBe(true);
    expect(isCortanaApiError(new Error("x"))).toBe(false);
  });

  it("isCortanaNetworkError narrows CortanaNetworkError instances", () => {
    expect(isCortanaNetworkError(new CortanaNetworkError("timeout", "x"))).toBe(true);
    expect(isCortanaNetworkError(new Error("x"))).toBe(false);
  });
});
