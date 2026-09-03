import { setupWorker } from "msw/browser";

import { handlers, stubHandlers } from "@/mocks/handlers";

/** src/main.tsx only starts this when VITE_ENABLE_MOCKS=true (dev/test convenience). */
export const worker = setupWorker(...handlers, ...stubHandlers);
