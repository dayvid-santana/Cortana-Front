import { Send, Square } from "lucide-react";
import { useState } from "react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const WARN_LENGTH = 4000;

interface ChatComposerProps {
  disabled: boolean;
  isRunning: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}

export function ChatComposer({ disabled, isRunning, onSend, onCancel }: ChatComposerProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
    if (event.key === "Escape" && isRunning) {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="border-border border-t p-2">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this commit's documentation… (Ctrl+Enter to send)"
        rows={3}
        disabled={disabled && !isRunning}
        readOnly={isRunning}
        aria-label="Message"
        className="max-h-40 min-h-[4.5rem]"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-muted-foreground text-[11px]">
          {value.length > WARN_LENGTH
            ? `${value.length} characters — consider trimming`
            : "Ctrl+Enter to send"}
        </span>
        {isRunning ? (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <Square size={12} aria-hidden="true" /> Cancel
          </Button>
        ) : (
          <Button size="sm" onClick={submit} disabled={disabled || value.trim().length === 0}>
            <Send size={12} aria-hidden="true" /> Send
          </Button>
        )}
      </div>
    </div>
  );
}
