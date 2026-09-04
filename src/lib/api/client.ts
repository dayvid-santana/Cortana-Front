import createClient from "openapi-fetch";

import { ApiError, NetworkError } from "@/lib/api/errors";
import { requestIdMiddleware } from "@/lib/api/middleware";
import type { paths } from "@/lib/api/schema";

export const apiBaseUrl = import.meta.env.VITE_DEVMATE_API_BASE_URL ?? "/api/v1";

export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
  // openapi-fetch defaults to `globalThis.fetch` captured once at client
  // creation time. This client is a module-level singleton created before
  // MSW installs its interceptor (which replaces `globalThis.fetch`), so we
  // re-read the global on every call instead of capturing it eagerly —
  // otherwise MSW-mocked requests would silently hit the real network.
  fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
});
apiClient.use(requestIdMiddleware);

interface OpenApiFetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Every feature's api/*.ts module funnels its openapi-fetch call through
 * this so React Query error handling is uniform: ApiError for problem+json
 * responses, NetworkError for fetch-level failures (offline, timeout,
 * cancellation) that never reached the server.
 */
export async function unwrap<T>(resultPromise: Promise<OpenApiFetchResult<T>>): Promise<T> {
  let result: OpenApiFetchResult<T>;
  try {
    result = await resultPromise;
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new NetworkError("aborted", "The request was cancelled.");
    }
    const message = cause instanceof Error ? cause.message : "Unknown network failure";
    throw new NetworkError("network", message);
  }

  if (result.error !== undefined) {
    throw new ApiError(
      result.error && typeof result.error === "object"
        ? { title: "Request failed", status: result.response.status, ...result.error }
        : { title: "Request failed", status: result.response.status },
    );
  }

  if (result.data === undefined) {
    throw new ApiError({ title: "Empty response", status: result.response.status });
  }

  return result.data;
}
