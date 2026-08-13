import { createFileRoute } from "@tanstack/react-router";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderCard } from "@/features/providers/components/provider-card";
import { useProviders, useUpdateProviderSettings } from "@/features/providers/hooks/use-providers";
import { useProjectStatus } from "@/features/projects/hooks/use-project";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/settings/providers")({
  component: ProvidersSettingsPage,
});

function ProvidersSettingsPage() {
  const { projectId } = Route.useParams();
  const providers = useProviders();
  const status = useProjectStatus(projectId);
  const updateSettings = useUpdateProviderSettings(projectId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Providers"
        description="LLM providers configured for this DevMate instance. Credentials are never shown here — configure them via environment variables on the backend."
      />

      {providers.status === "pending" ? <LoadingState rows={3} label="Loading providers" /> : null}
      {providers.status === "error" ? (
        <ErrorState
          problem={toDisplayProblem(providers.error)}
          onRetry={() => void providers.refetch()}
        />
      ) : null}
      {providers.status === "success" ? (
        <ul className="border-border rounded-md border">
          {providers.data.items.map((provider) => (
            <ProviderCard
              key={provider.name}
              provider={provider}
              isDefault={status.data?.defaultProvider === provider.name}
              onSetDefault={() => updateSettings.mutate({ defaultProvider: provider.name })}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
