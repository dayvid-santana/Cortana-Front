import { Input } from "@/components/ui/input";
import { isValidCwd } from "@/features/agents/lib/is-valid-cwd";

interface CwdFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Required before any project action can run — Cortana operates on a caller-supplied directory, not a stored project. */
export function CwdField({ id, value, onChange, disabled }: CwdFieldProps) {
  const showError = value.length > 0 && !isValidCwd(value);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-foreground text-[13px] font-medium">
        Project directory (cwd)
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="C:\path\to\repository"
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        aria-invalid={showError}
      />
      <p id={`${id}-hint`} className="text-muted-foreground text-[12px]">
        {showError
          ? "Enter a valid local directory path."
          : "Absolute path to the repository Cortana should operate on."}
      </p>
    </div>
  );
}
