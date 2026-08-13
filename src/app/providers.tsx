import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ThemeSync } from "@/app/theme-provider";
import { isAutomatedBrowser } from "@/lib/utils/is-automated-browser";

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <BaseTooltip.Provider delay={300} closeDelay={100}>
        {children}
      </BaseTooltip.Provider>
      {import.meta.env.DEV && !isAutomatedBrowser() ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
