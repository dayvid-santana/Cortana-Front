import type { components } from "@/lib/api/schema";
import { cn } from "@/lib/utils/cn";

type FileDiff = components["schemas"]["FileDiff"];

const statusLabel: Record<FileDiff["status"], string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
};

export function DiffViewer({ diff }: { diff: FileDiff }) {
  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="border-border text-muted-foreground flex items-center gap-2 border-b px-2 py-1.5 text-[12px]">
        <span className="text-foreground font-mono">{diff.newPath ?? diff.oldPath}</span>
        <span>{statusLabel[diff.status]}</span>
        <span className="text-success">+{diff.additions}</span>
        <span className="text-danger">-{diff.deletions}</span>
      </div>
      <div className="font-mono text-[13px] leading-5">
        {diff.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex}>
            <div className="bg-surface-muted text-diff-context px-2 py-0.5">{hunk.header}</div>
            {hunk.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={cn(
                  "flex px-2",
                  line.type === "added" && "bg-diff-added-bg",
                  line.type === "removed" && "bg-diff-removed-bg",
                )}
              >
                <span
                  className={cn(
                    "w-4 shrink-0 select-none",
                    line.type === "added" && "text-diff-added",
                    line.type === "removed" && "text-diff-removed",
                    line.type === "context" && "text-diff-context",
                  )}
                >
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                <span className="whitespace-pre-wrap">{line.content}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
