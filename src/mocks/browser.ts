import { setupWorker } from "msw/browser";

import { handlers, stubHandlers } from "@/mocks/handlers";

/** Includes both arrays; src/main.tsx decides whether the full mock worker even starts. */
export const worker = setupWorker(...handlers, ...stubHandlers);

/** Registers only the screens with no real backend yet — used when VITE_ENABLE_MOCKS is off. */
export const stubWorker = setupWorker(...stubHandlers);
