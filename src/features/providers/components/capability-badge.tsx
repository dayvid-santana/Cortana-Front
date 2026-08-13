import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  conversation: "Conversation",
  structured_output: "Structured output",
  streaming: "Streaming",
  thread_resume: "Thread resume",
  repository_access: "Repository access",
  tool_use: "Tool use",
  code_inspection: "Code inspection",
  citations: "Citations",
};

export function CapabilityBadge({ capability }: { capability: string }) {
  return <Badge variant="outline">{labels[capability] ?? capability}</Badge>;
}
