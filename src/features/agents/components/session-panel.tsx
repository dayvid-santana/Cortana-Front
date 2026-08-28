import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { useCortanaSession } from "@/features/agents/api/queries";
import { toDisplayCortanaProblem } from "@/lib/api/cortana/errors";

/** Session state is display-only — GET /session is never used to drive UI decisions. */
export function SessionPanel() {
  const sessionQuery = useCortanaSession();

  if (sessionQuery.status === "pending") {
    return <LoadingState rows={2} label="Loading session" />;
  }

  if (sessionQuery.status === "error") {
    return (
      <ErrorState
        problem={toDisplayCortanaProblem(sessionQuery.error)}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const entries = Object.entries(sessionQuery.data);
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-[13px]">No active session data.</p>;
  }

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[13px]">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="text-foreground truncate font-mono">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
