import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app";
import "@/styles/globals.css";

async function enableMocksIfConfigured(): Promise<void> {
  const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === "true";
  // A handful of screens (diagnostics, speech/voices, reading-sessions — see
  // docs/web-api-gaps.md) still have no real backend even once the rest of the
  // DevMate API is live. The stub worker for just those stays on regardless of
  // VITE_ENABLE_MOCKS, so those screens keep working instead of hitting a 404
  // from the real backend; the full worker (real-backend-covered handlers
  // included) is only used while mocks are on.
  const { worker, stubWorker } = await import("@/mocks/browser");
  await (mocksEnabled ? worker : stubWorker).start({
    // "bypass" let unmocked requests fall through to Vite's /api proxy,
    // which has no real backend to receive them — so a missing handler
    // surfaced as an opaque ECONNREFUSED in the terminal instead of a
    // clear MSW warning naming the request. "warn" matches the "error"
    // policy already used under Vitest (src/test/setup.ts).
    onUnhandledRequest: "warn",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root was not found in index.html");
}

enableMocksIfConfigured().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
