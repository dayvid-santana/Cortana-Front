import { SourceCitation } from "@/features/chat/components/source-citation";
import type { SourceReference } from "@/lib/utils/citation-navigation";

export function CitationList({
  projectId,
  sources,
}: {
  projectId: string;
  sources: SourceReference[];
}) {
  if (sources.length === 0) return null;
  return (
    <ul aria-label="Sources" className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <li key={source.id}>
          <SourceCitation projectId={projectId} source={source} />
        </li>
      ))}
    </ul>
  );
}
