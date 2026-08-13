import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { cn } from "@/lib/utils/cn";

export const Route = createFileRoute("/projects/$projectId/settings")({
  component: SettingsLayout,
});

const tabs = [
  { label: "General", to: "/projects/$projectId/settings/general" },
  { label: "Providers", to: "/projects/$projectId/settings/providers" },
  { label: "Voice", to: "/projects/$projectId/settings/speech" },
  { label: "Diagnostics", to: "/projects/$projectId/settings/diagnostics" },
] as const;

function SettingsLayout() {
  const { projectId } = Route.useParams();

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4">
      <nav
        aria-label="Settings sections"
        className="border-border flex h-8 items-center gap-1 border-b"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            params={{ projectId }}
            className="text-muted-foreground hover:text-foreground h-8 rounded-t-sm px-3 text-[13px] font-medium"
            activeProps={{ className: cn("text-foreground border-b-2 border-accent") }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-auto pt-3">
        <Outlet />
      </div>
    </div>
  );
}
