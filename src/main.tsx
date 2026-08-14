import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app";
import "@/styles/globals.css";

async function enableMocksIfConfigured(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") {
    return;
  }
  const { worker } = await import("@/mocks/browser");
  await worker.start({
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
