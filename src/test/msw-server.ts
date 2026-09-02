import { setupServer } from "msw/node";

import { handlers } from "@/mocks/handlers";
import { cortanaHandlers, cortanaTaskPlanHandlers } from "@/mocks/cortana-handlers";

// Cortana handlers are deliberately excluded from src/mocks/browser.ts (the
// real dev-server worker): unlike the DevMate handlers above — a stand-in
// for a backend that doesn't exist yet — Cortana is a real, separately
// running local service, and VITE_ENABLE_MOCKS must never intercept it.
// Tests still need deterministic responses, so they're added here instead.
export const server = setupServer(...handlers, ...cortanaHandlers, ...cortanaTaskPlanHandlers);
