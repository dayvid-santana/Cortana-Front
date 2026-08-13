import { Check, Cloud, HardDrive, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CapabilityBadge } from "@/features/providers/components/capability-badge";
import type { components } from "@/lib/api/schema";

type Provider = components["schemas"]["Provider"];

const availabilityVariant: Record<Provider["availability"], "success" | "danger" | "outline"> = {
  available: "success",
  unavailable: "danger",
  unknown: "outline",
};

interface ProviderCardProps {
  provider: Provider;
  isDefault?: boolean;
  onSetDefault?: () => void;
}

export function ProviderCard({ provider, isDefault, onSetDefault }: ProviderCardProps) {
  return (
    <li className="border-border flex flex-col gap-2 border-b px-3 py-3 text-[13px] last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{provider.name}</span>
          {provider.model ? (
            <span className="text-muted-foreground font-mono text-[12px]">{provider.model}</span>
          ) : null}
          {provider.local ? (
            <Badge variant="outline">
              <HardDrive size={11} aria-hidden="true" /> Local
            </Badge>
          ) : (
            <Badge variant="outline">
              <Cloud size={11} aria-hidden="true" /> Remote
            </Badge>
          )}
          <Badge variant={availabilityVariant[provider.availability]}>
            {provider.availability}
          </Badge>
        </div>
        {onSetDefault ? (
          <Button variant={isDefault ? "default" : "outline"} size="sm" onClick={onSetDefault}>
            {isDefault ? <Check size={12} aria-hidden="true" /> : null}
            {isDefault ? "Default" : "Set default"}
          </Button>
        ) : null}
      </div>

      <div className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
        {provider.authConfigured ? (
          <span className="text-success inline-flex items-center gap-1">
            <ShieldCheck size={12} aria-hidden="true" /> Credentials configured
          </span>
        ) : (
          <span className="text-warning inline-flex items-center gap-1">
            <ShieldAlert size={12} aria-hidden="true" /> No credentials — set the provider's
            environment variable
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {provider.capabilities.map((capability) => (
          <CapabilityBadge key={capability} capability={capability} />
        ))}
      </div>

      {provider.routedTasks && provider.routedTasks.length > 0 ? (
        <p className="text-muted-foreground text-[12px]">
          Routed tasks: {provider.routedTasks.join(", ")}
        </p>
      ) : null}
    </li>
  );
}
