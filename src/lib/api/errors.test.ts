import { describe, expect, it } from "vitest";

import {
  ApiError,
  NetworkError,
  isApiError,
  isNetworkError,
  toDisplayProblem,
} from "@/lib/api/errors";

describe("toDisplayProblem", () => {
  it("passes through an ApiError's problem as-is", () => {
    const error = new ApiError({
      title: "Not found",
      status: 404,
      detail: "Project does not exist",
    });
    expect(toDisplayProblem(error)).toEqual({
      title: "Not found",
      status: 404,
      detail: "Project does not exist",
    });
  });

  it("maps a network NetworkError to a status-0 problem with a helpful title", () => {
    const error = new NetworkError("network", "fetch failed");
    const problem = toDisplayProblem(error);
    expect(problem.status).toBe(0);
    expect(problem.title).toContain("Network error");
    expect(problem.detail).toBe("fetch failed");
  });

  it("maps an aborted NetworkError distinctly from a network failure", () => {
    const problem = toDisplayProblem(new NetworkError("aborted", "cancelled"));
    expect(problem.title).toContain("cancelled");
  });

  it("never leaks a raw stack trace for generic errors", () => {
    const problem = toDisplayProblem(new Error("boom"));
    expect(problem.title).toBe("Something went wrong");
    expect(problem.detail).toBe("boom");
  });

  it("handles non-Error thrown values safely", () => {
    const problem = toDisplayProblem("a plain string was thrown");
    expect(problem.title).toBe("Something went wrong");
    expect(problem.status).toBe(500);
  });
});

describe("type guards", () => {
  it("isApiError narrows ApiError instances", () => {
    expect(isApiError(new ApiError({ title: "x", status: 400 }))).toBe(true);
    expect(isApiError(new Error("x"))).toBe(false);
  });

  it("isNetworkError narrows NetworkError instances", () => {
    expect(isNetworkError(new NetworkError("timeout", "x"))).toBe(true);
    expect(isNetworkError(new Error("x"))).toBe(false);
  });
});
