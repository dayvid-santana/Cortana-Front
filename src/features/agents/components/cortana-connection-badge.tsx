import { CircleAlert, CircleCheck, CircleDashed, CircleX } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import type { CortanaConnectionState } from "@/features/agents/hooks/use-cortana-connection-status";
import { useCortanaConnectionStatus } from "@/features/agents/hooks/use-cortana-connection-status";
import { cn } from "@/lib/utils/cn";

const config: Record<
  CortanaConnectionState,
  { label: string; icon: typeof CircleCheck; className: string }
> = {
  connected: { label: "Connected", icon: CircleCheck, className: "text-success" },
  connecting: { label: "Connecting…", icon: CircleDashed, className: "text-muted-foreground" },
  reconnecting: { label: "Reconnecting…", icon: CircleAlert, className: "text-warning" },
  degraded: { label: "Degraded", icon: CircleAlert, className: "text-warning" },
  disconnected: { label: "Disconnected", icon: CircleX, className: "text-danger" },
};

export function CortanaConnectionBadge() {
  const status = useCortanaConnectionStatus();
  const { label, icon: Icon, className } = config[status];

  return (
    <Tooltip content={`Cortana (127.0.0.1:8765): ${label}`}>
      <span className={cn("inline-flex items-center gap-1 text-[12px]", className)}>
        <Icon size={13} aria-hidden="true" />
        <span className="hidden sm:inline">Cortana: {label}</span>
      </span>
    </Tooltip>
  );
}
