import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/schema";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";
import { shortHash } from "@/lib/formatting/commit";

type Decision = components["schemas"]["Decision"];

const statusVariant: Record<Decision["status"], "success" | "warning" | "danger" | "outline"> = {
  active: "success",
  candidate: "outline",
  superseded: "warning",
  revoked: "danger",
};

const confidenceLabel: Record<Decision["confidence"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface DecisionCardProps {
  projectId: string;
  decision: Decision;
}

export function DecisionCard({ projectId, decision }: DecisionCardProps) {
  return (
    <li className="border-border border-b px-3 py-3 text-[13px] last:border-b-0">
      <Link
        to="/projects/$projectId/decisions/$decisionId"
        params={{ projectId, decisionId: decision.id }}
        className="text-foreground font-medium hover:underline"
      >
        {decision.title}
      </Link>
      <p className="text-muted-foreground mt-1 text-[13px]">{decision.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={statusVariant[decision.status]}>{decision.status}</Badge>
        <Badge variant="outline">{decision.explicitness.replace("_", " ")}</Badge>
        <Badge variant="outline">Confidence: {confidenceLabel[decision.confidence]}</Badge>
        {decision.filePath ? (
          <span className="text-muted-foreground font-mono text-[12px]">
            {decision.filePath}
            {decision.heading ? ` · ${decision.heading}` : ""}
          </span>
        ) : null}
        <span className="text-muted-foreground font-mono text-[12px]">
          {shortHash(decision.commitHash)}
        </span>
        <time
          dateTime={decision.createdAt}
          title={formatAbsoluteTime(decision.createdAt)}
          className="text-muted-foreground text-[12px]"
        >
          {formatRelativeTime(decision.createdAt)}
        </time>
      </div>
    </li>
  );
}
