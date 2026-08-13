import { createFileRoute } from "@tanstack/react-router";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ConnectionIndicator } from "@/components/navigation/connection-indicator";
import { ProviderCard } from "@/features/providers/components/provider-card";
import { useDiagnostics } from "@/features/diagnostics/hooks/use-diagnostics";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/settings/diagnostics")({
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const query = useDiagnostics();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Diagnostics"
        description="Backend health and configured provider snapshot."
        actions={<ConnectionIndicator />}
      />

      {query.status === "pending" ? <LoadingState rows={4} label="Loading diagnostics" /> : null}
      {query.status === "error" ? (
        <ErrorState problem={toDisplayProblem(query.error)} onRetry={() => void query.refetch()} />
      ) : null}

      {query.status === "success" ? (
        <>
          <dl className="border-border grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border p-3 text-[13px]">
            <dt className="text-muted-foreground">Backend version</dt>
            <dd>{query.data.backendVersion}</dd>
            <dt className="text-muted-foreground">Uptime</dt>
            <dd>{Math.round(query.data.uptimeSeconds / 60)} minutes</dd>
            <dt className="text-muted-foreground">Database status</dt>
            <dd>{query.data.database.status}</dd>
            <dt className="text-muted-foreground">Database path</dt>
            <dd className="truncate font-mono text-[12px]">{query.data.database.path}</dd>
            {query.data.lastError ? (
              <>
                <dt className="text-muted-foreground">Last error</dt>
                <dd className="text-danger">{query.data.lastError}</dd>
              </>
            ) : null}
          </dl>

          <div>
            <h2 className="text-muted-foreground mb-1 text-[12px] font-semibold tracking-wide uppercase">
              LLM providers
            </h2>
            <ul className="border-border rounded-md border">
              {query.data.providers.map((provider) => (
                <ProviderCard key={provider.name} provider={provider} />
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-muted-foreground mb-1 text-[12px] font-semibold tracking-wide uppercase">
              Speech providers
            </h2>
            <ul className="border-border rounded-md border">
              {query.data.speechProviders.map((provider) => (
                <ProviderCard key={provider.name} provider={provider} />
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
