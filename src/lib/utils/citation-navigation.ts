import type { components } from "@/lib/api/schema";

export type SourceReference = components["schemas"]["SourceReference"];

export interface FileViewerTarget {
  path: string;
  commit: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Maps a SourceReference from the API into File Viewer search params.
 * Returns null when the reference is invalid or missing the fields needed
 * to navigate — callers must never fabricate a path/line range for an
 * invalid citation (see SourceCitation component).
 */
export function resolveFileViewerTarget(source: SourceReference): FileViewerTarget | null {
  if (!source.valid) {
    return null;
  }
  if (
    (source.kind !== "document" && source.kind !== "document_diff" && source.kind !== "code") ||
    !source.path
  ) {
    return null;
  }
  const target: FileViewerTarget = { path: source.path, commit: source.commitHash ?? "" };
  if (source.commitHash === undefined) {
    return null;
  }
  if (source.startLine !== undefined) target.startLine = source.startLine;
  if (source.endLine !== undefined) target.endLine = source.endLine;
  return target;
}
