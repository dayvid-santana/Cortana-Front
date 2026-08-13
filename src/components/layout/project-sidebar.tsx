import { Link } from "@tanstack/react-router";
import {
  Activity,
  FileText,
  GitCommitHorizontal,
  ListChecks,
  Mic,
  MessageSquare,
  RadioTower,
  Settings,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number | undefined;
}

interface ProjectSidebarProps {
  projectId: string;
  decisionsActiveCount?: number;
  questionsOpenCount?: number;
  forceExpanded?: boolean;
}

export function ProjectSidebar({
  projectId,
  decisionsActiveCount,
  questionsOpenCount,
  forceExpanded,
}: ProjectSidebarProps) {
  const collapsedPreference = useUiPreferencesStore((state) => state.sidebarCollapsed);
  const collapsed = forceExpanded ? false : collapsedPreference;

  const primary: NavItem[] = [
    { label: "Chat", to: "/projects/$projectId/chat", icon: MessageSquare },
    { label: "Timeline", to: "/projects/$projectId/timeline", icon: GitCommitHorizontal },
    { label: "Files", to: "/projects/$projectId/files", icon: FileText },
    {
      label: "Decisions",
      to: "/projects/$projectId/decisions",
      icon: ListChecks,
      badge: decisionsActiveCount,
    },
    {
      label: "Questions",
      to: "/projects/$projectId/questions",
      icon: HelpCircle,
      badge: questionsOpenCount,
    },
  ];
  const secondary: NavItem[] = [
    { label: "Providers", to: "/projects/$projectId/settings/providers", icon: RadioTower },
    { label: "Voice", to: "/projects/$projectId/settings/speech", icon: Mic },
    { label: "Diagnostics", to: "/projects/$projectId/settings/diagnostics", icon: Activity },
    { label: "Settings", to: "/projects/$projectId/settings/general", icon: Settings },
  ];

  const renderItem = (item: NavItem) => {
    const link = (
      <Link
        key={item.to}
        to={item.to}
        params={{ projectId }}
        activeOptions={{ exact: false }}
        className={cn(
          "text-muted-foreground hover:bg-surface-muted hover:text-foreground flex h-9 items-center gap-2 rounded-sm px-2.5 text-[13px] font-medium",
          collapsed && "justify-center px-0",
        )}
        activeProps={{ className: "bg-surface-muted text-foreground" }}
      >
        <item.icon size={15} aria-hidden="true" className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge ? (
          <Badge variant="default" className="ml-auto">
            {item.badge}
          </Badge>
        ) : null}
      </Link>
    );
    return collapsed ? (
      <Tooltip key={item.to} content={item.label} side="right">
        {link}
      </Tooltip>
    ) : (
      link
    );
  };

  return (
    <nav
      aria-label="Project navigation"
      className={cn("flex h-full flex-col gap-4 p-2", collapsed ? "w-12" : "w-52")}
    >
      <div className="flex flex-col gap-0.5">{primary.map(renderItem)}</div>
      <div className="border-border flex flex-col gap-0.5 border-t pt-2">
        {secondary.map(renderItem)}
      </div>
    </nav>
  );
}
