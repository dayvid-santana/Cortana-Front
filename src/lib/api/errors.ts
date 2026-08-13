import type { components } from "@/lib/api/schema";

export type ApiProblem = components["schemas"]["ApiProblem"];

export class ApiError extends Error {
  readonly problem: ApiProblem;
  readonly status: number;

  constructor(problem: ApiProblem) {
    super(problem.title);
    this.name = "ApiError";
    this.problem = problem;
    this.status = problem.status;
  }
}

/** Network failures, aborts, and timeouts never reach the server, so they get a synthetic problem. */
export class NetworkError extends Error {
  readonly kind: "network" | "timeout" | "aborted";

  constructor(kind: "network" | "timeout" | "aborted", message: string) {
    super(message);
    this.name = "NetworkError";
    this.kind = kind;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/** Turns any thrown/caught value into a user-displayable problem, never leaking a raw stack trace. */
export function toDisplayProblem(error: unknown): ApiProblem {
  if (isApiError(error)) {
    return error.problem;
  }
  if (isNetworkError(error)) {
    return {
      title: networkErrorTitle(error.kind),
      status: 0,
      detail: error.message,
    };
  }
  if (error instanceof Error) {
    return { title: "Something went wrong", status: 500, detail: error.message };
  }
  return { title: "Something went wrong", status: 500 };
}

function networkErrorTitle(kind: NetworkError["kind"]): string {
  switch (kind) {
    case "timeout":
      return "Request timed out";
    case "aborted":
      return "Request was cancelled";
    case "network":
    default:
      return "Network error — is the DevMate backend running?";
  }
}
