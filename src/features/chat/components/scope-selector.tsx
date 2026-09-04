import { Code2, FileText, Pencil } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Scope = "docs" | "code" | "edit";

const SCOPE_STYLE: Record<Scope, string> = {
  docs: "bg-docs-scope/15 text-docs-scope",
  code: "bg-code-scope/15 text-code-scope",
  edit: "bg-edit-scope/15 text-edit-scope",
};

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
        { value: "edit" as const, label: "Edit", icon: Pencil },
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
              ? SCOPE_STYLE[option.value]
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
