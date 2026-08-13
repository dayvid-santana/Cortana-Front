import type { Middleware } from "openapi-fetch";

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Stamps every outgoing request with a request ID we can surface alongside error messages. */
export const requestIdMiddleware: Middleware = {
  onRequest({ request }) {
    request.headers.set("X-Request-Id", generateRequestId());
    return request;
  },
};
