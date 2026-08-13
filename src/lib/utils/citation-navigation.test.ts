import { describe, expect, it } from "vitest";

import { resolveFileViewerTarget, type SourceReference } from "@/lib/utils/citation-navigation";

interface SourceReferenceOverrides {
  id?: string;
  kind?: SourceReference["kind"];
  path?: string | undefined;
  commitHash?: string | undefined;
  startLine?: number | undefined;
  endLine?: number | undefined;
  heading?: string | undefined;
  label?: string;
  valid?: boolean;
}

function makeSource(overrides: SourceReferenceOverrides = {}): SourceReference {
  // Cast is intentional: these tests deliberately construct citations with
  // fields missing/undefined to verify resolveFileViewerTarget's own guards
  // reject them, which is exactly what SourceReference's real (non-test)
  // optional fields disallow expressing directly under exactOptionalPropertyTypes.
  return {
    id: "src_1",
    kind: "document",
    path: "docs/auth.md",
    commitHash: "a17d3e1",
    startLine: 12,
    endLine: 28,
    heading: "Revogação",
    label: "docs/auth.md · Revogação · L12–28 · a17d3e1",
    valid: true,
    ...overrides,
  } as SourceReference;
}

describe("resolveFileViewerTarget", () => {
  it("resolves a valid document citation to a file viewer target", () => {
    expect(resolveFileViewerTarget(makeSource())).toEqual({
      path: "docs/auth.md",
      commit: "a17d3e1",
      startLine: 12,
      endLine: 28,
    });
  });

  it("resolves a valid code citation", () => {
    expect(
      resolveFileViewerTarget(makeSource({ kind: "code", path: "src/auth/token_service.py" })),
    ).toMatchObject({
      path: "src/auth/token_service.py",
    });
  });

  it("returns null when the citation is marked invalid", () => {
    expect(resolveFileViewerTarget(makeSource({ valid: false }))).toBeNull();
  });

  it("returns null for citation kinds that aren't file-navigable", () => {
    expect(resolveFileViewerTarget(makeSource({ kind: "decision" }))).toBeNull();
  });

  it("returns null when the path is missing", () => {
    expect(resolveFileViewerTarget(makeSource({ path: undefined }))).toBeNull();
  });

  it("returns null when the commit hash is missing", () => {
    expect(resolveFileViewerTarget(makeSource({ commitHash: undefined }))).toBeNull();
  });

  it("never fabricates a line range that wasn't provided", () => {
    const target = resolveFileViewerTarget(
      makeSource({ startLine: undefined, endLine: undefined }),
    );
    expect(target).toEqual({ path: "docs/auth.md", commit: "a17d3e1" });
  });
});
