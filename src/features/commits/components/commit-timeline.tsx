import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";

import { CommitTimelineItem } from "@/features/commits/components/commit-timeline-item";
import type { CommitFilters } from "@/features/commits/api/queries";
import { useCommits } from "@/features/commits/hooks/use-commits";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { toDisplayProblem } from "@/lib/api/errors";

interface CommitTimelineProps {
  projectId: string;
  branch?: string;
  status?: CommitFilters["status"];
  activeCommitHash?: string;
}

export function CommitTimeline({
  projectId,
  branch,
  status,
  activeCommitHash,
}: CommitTimelineProps) {
  const filters: CommitFilters = {};
  if (branch !== undefined) filters.branch = branch;
  if (status !== undefined) filters.status = status;
  const query = useCommits(projectId, filters);
  const parentRef = useRef<HTMLDivElement>(null);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  const virtualizer = useVirtualizer({
    count: query.hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 8,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualItem = virtualItems.at(-1);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    if (!lastVirtualItem) return;
    if (lastVirtualItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [lastVirtualItem, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.status === "pending") {
    return <LoadingState rows={6} label="Loading commits" />;
  }

  if (query.status === "error") {
    return (
      <ErrorState problem={toDisplayProblem(query.error)} onRetry={() => void query.refetch()} />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No commits found"
        description="Adjust the branch or status filter, or run a scan."
      />
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto" aria-label="Commit timeline">
      <ul className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualItems.map((virtualItem) => {
          const commit = items[virtualItem.index];
          return (
            <li
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {commit ? (
                <CommitTimelineItem
                  projectId={projectId}
                  commit={commit}
                  active={commit.hash === activeCommitHash}
                />
              ) : (
                <div className="text-muted-foreground px-3 py-4 text-center text-[12px]">
                  Loading more…
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
