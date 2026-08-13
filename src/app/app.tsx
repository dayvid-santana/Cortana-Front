import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";

import { AppProviders } from "@/app/providers";
import { createAppQueryClient } from "@/app/query-client";
import { createAppRouter } from "@/app/router";

export function App() {
  const [queryClient] = useState(() => createAppQueryClient());
  const [router] = useState(() => createAppRouter(queryClient));

  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
