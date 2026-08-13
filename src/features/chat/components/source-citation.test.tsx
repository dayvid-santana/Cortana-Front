import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { SourceCitation } from "@/features/chat/components/source-citation";
import type { SourceReference } from "@/lib/utils/citation-navigation";

interface SourceReferenceProp extends Omit<SourceReference, "path" | "commitHash"> {
  path?: string | undefined;
  commitHash?: string | undefined;
}

function renderCitation(source: SourceReferenceProp) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    // Cast is intentional: these tests deliberately pass citations with
    // fields missing/undefined to verify SourceCitation's own guards render
    // them as inert rather than a broken link.
    component: () => (
      <SourceCitation projectId="proj_acme-api" source={source as SourceReference} />
    ),
  });
  const filesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/projects/$projectId/files",
    component: () => {
      const search = filesRoute.useSearch();
      return (
        <p>
          Opened {search.path} at {search.commit} (L{search.startLine}-{search.endLine})
        </p>
      );
    },
    validateSearch: (search: Record<string, unknown>) => ({
      path: String(search.path ?? ""),
      commit: String(search.commit ?? ""),
      startLine: Number(search.startLine),
      endLine: Number(search.endLine),
      view: "source" as const,
    }),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, filesRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router} />);
}

const validSource: SourceReference = {
  id: "src_1",
  kind: "document",
  path: "docs/auth.md",
  commitHash: "a17d3e1",
  startLine: 14,
  endLine: 19,
  heading: "Access tokens",
  label: "docs/auth.md · Access tokens · L14–19 · a17d3e1",
  valid: true,
};

describe("SourceCitation", () => {
  it("navigates to the file viewer at the cited lines when clicked", async () => {
    const user = userEvent.setup();
    renderCitation(validSource);

    await user.click(await screen.findByText(validSource.label));

    expect(await screen.findByText(/Opened docs\/auth\.md at a17d3e1/)).toBeInTheDocument();
    expect(screen.getByText(/L14-19/)).toBeInTheDocument();
  });

  it("renders an invalid citation as inert (no link, no navigation) rather than inventing a target", async () => {
    renderCitation({ ...validSource, valid: false });
    expect(await screen.findByText(validSource.label)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a citation missing required fields as inert instead of guessing", async () => {
    renderCitation({ ...validSource, commitHash: undefined });
    await screen.findByText(validSource.label);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
