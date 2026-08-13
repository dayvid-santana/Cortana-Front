import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { CommandPalette } from "@/components/navigation/command-palette";
import { PersistentAudioPlayer } from "@/components/layout/persistent-audio-player";
import { isAutomatedBrowser } from "@/lib/utils/is-automated-browser";

const TanStackRouterDevtools =
  import.meta.env.DEV && !isAutomatedBrowser()
    ? lazy(() =>
        import("@tanstack/react-router-devtools").then((module) => ({
          default: module.TanStackRouterDevtools,
        })),
      )
    : null;

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <p className="text-sm font-medium">Page not found</p>
      <a href="/projects" className="text-accent text-[13px] hover:underline">
        Go to projects
      </a>
    </div>
  ),
});

function RootComponent() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Outlet />
      <PersistentAudioPlayer />
      <CommandPalette />
      {TanStackRouterDevtools ? (
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
      ) : null}
    </>
  );
}
