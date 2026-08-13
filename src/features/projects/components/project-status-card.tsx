import { Link } from "@tanstack/react-router";
import { Database, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/schema";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";

type Project = components["schemas"]["Project"];

const dbStatusVariant: Record<Project["dbStatus"], "success" | "warning" | "danger"> = {
  ready: "success",
  scanning: "warning",
  error: "danger",
};

export function ProjectStatusCard({ project }: { project: Project }) {
  return (
    <li className="border-border flex items-center justify-between gap-4 border-b px-3 py-3 text-[13px] last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="text-foreground truncate font-medium hover:underline"
          >
            {project.name}
          </Link>
          <Badge variant={dbStatusVariant[project.dbStatus]}>{project.dbStatus}</Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-[12px]">
          {project.displayPath}
        </p>
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          <span className="inline-flex items-center gap-1">
            <GitBranch size={12} aria-hidden="true" />
            {project.activeBranch}
          </span>
          {project.lastScanAt ? (
            <span title={formatAbsoluteTime(project.lastScanAt)}>
              Last scan {formatRelativeTime(project.lastScanAt)}
            </span>
          ) : (
            <span>Never scanned</span>
          )}
          <span>{project.decisionsActiveCount} active decisions</span>
          <span>{project.questionsOpenCount} open questions</span>
        </div>
      </div>
      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="border-border hover:bg-surface-muted inline-flex shrink-0 items-center gap-1 rounded-sm border px-2.5 py-1 text-[13px] font-medium"
      >
        <Database size={13} aria-hidden="true" />
        Open
      </Link>
    </li>
  );
}
