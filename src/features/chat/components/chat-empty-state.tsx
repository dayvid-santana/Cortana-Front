import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export function ChatEmptyState({ scope }: { scope: "docs" | "code" | "edit" }) {
  const description =
    scope === "docs"
      ? "Ask about the documentation for this commit — DevMate answers from the docs, with citations you can open."
      : scope === "edit"
        ? "Edit scope is active — ask for a code change and DevMate will propose it (dev-agent when available, otherwise directly). Nothing is written until you confirm."
        : "Code scope is active — ask about implementation files or request a change. Change requests use dev-agent when available and always require your approval before anything is written.";
  return <EmptyState icon={MessageSquare} title="Start a conversation" description={description} />;
}
