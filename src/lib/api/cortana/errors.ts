export interface CortanaProblem {
  title: string;
  status: number;
  detail?: string;
}

export class CortanaApiError extends Error {
  readonly problem: CortanaProblem;
  readonly status: number;

  constructor(problem: CortanaProblem) {
    super(problem.title);
    this.name = "CortanaApiError";
    this.problem = problem;
    this.status = problem.status;
  }
}

/** Network failures, aborts, and timeouts never reach Cortana, so they get a synthetic problem. */
export class CortanaNetworkError extends Error {
  readonly kind: "network" | "timeout" | "aborted";

  constructor(kind: "network" | "timeout" | "aborted", message: string) {
    super(message);
    this.name = "CortanaNetworkError";
    this.kind = kind;
  }
}

export function isCortanaApiError(error: unknown): error is CortanaApiError {
  return error instanceof CortanaApiError;
}

export function isCortanaNetworkError(error: unknown): error is CortanaNetworkError {
  return error instanceof CortanaNetworkError;
}

/** Turns any thrown/caught value into a user-displayable problem, never leaking a raw stack trace. */
export function toDisplayCortanaProblem(error: unknown): CortanaProblem {
  if (isCortanaApiError(error)) {
    return error.problem;
  }
  if (isCortanaNetworkError(error)) {
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

function networkErrorTitle(kind: CortanaNetworkError["kind"]): string {
  switch (kind) {
    case "timeout":
      return "Cortana did not respond in time";
    case "aborted":
      return "Request was cancelled";
    case "network":
    default:
      return "Cortana is unreachable — is the local service running on 127.0.0.1:8765?";
  }
}
