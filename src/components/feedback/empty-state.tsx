import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center">
      {Icon ? <Icon size={22} className="text-muted-foreground" aria-hidden="true" /> : null}
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-md text-[13px]">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
