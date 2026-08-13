import { Code2, FileText } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Scope = "docs" | "code";

interface ScopeSelectorProps {
  scope: Scope;
  onChange: (scope: Scope) => void;
}

export function ScopeSelector({ scope, onChange }: ScopeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Chat scope"
      className="border-border inline-flex rounded-sm border p-0.5"
    >
      {[
        { value: "docs" as const, label: "Docs", icon: FileText },
        { value: "code" as const, label: "Code", icon: Code2 },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={scope === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium",
            scope === option.value
              ? option.value === "docs"
                ? "bg-docs-scope/15 text-docs-scope"
                : "bg-code-scope/15 text-code-scope"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <option.icon size={12} aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
