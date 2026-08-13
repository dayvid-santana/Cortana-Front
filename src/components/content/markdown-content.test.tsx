import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownContent } from "@/components/content/markdown-content";

describe("MarkdownContent", () => {
  it("renders basic GFM markdown (headings, lists, tables)", () => {
    render(
      <MarkdownContent content={"## Heading\n\n- one\n- two\n\n| a | b |\n| - | - |\n| 1 | 2 |"} />,
    );
    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders a safe https link with target=_blank and rel=noopener noreferrer", () => {
    render(<MarkdownContent content="[docs](https://example.com/docs)" />);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never renders a javascript: link as a clickable anchor", () => {
    render(<MarkdownContent content="[click me](javascript:alert(1))" />);
    expect(screen.queryByRole("link", { name: "click me" })).not.toBeInTheDocument();
    expect(screen.getByText("click me")).toBeInTheDocument();
  });

  it("never renders a data: link as a clickable anchor", () => {
    render(<MarkdownContent content="[open](data:text/html,<script>alert(1)</script>)" />);
    expect(screen.queryByRole("link", { name: "open" })).not.toBeInTheDocument();
  });

  it("never executes raw HTML embedded in the markdown source", () => {
    render(<MarkdownContent content={'<img src=x onerror="window.__pwned = true" />'} />);
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });

  it("preserves relative in-app links without forcing target=_blank", () => {
    render(<MarkdownContent content="[file](/projects/acme/files?path=docs/auth.md)" />);
    const link = screen.getByRole("link", { name: "file" });
    expect(link).not.toHaveAttribute("target");
  });
});
