import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export function ChatEmptyState({ scope }: { scope: "docs" | "code" }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Start a conversation"
      description={
        scope === "docs"
          ? "Ask about the documentation for this commit — DevMate answers from the docs, with citations you can open."
          : "Code scope is active — DevMate may include implementation files in the context sent to the provider."
      }
    />
  );
}
