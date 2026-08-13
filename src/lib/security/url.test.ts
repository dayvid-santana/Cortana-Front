import { describe, expect, it } from "vitest";

import { buildSearchUrl, isRelativeUrl, isSafeExternalUrl } from "@/lib/security/url";

describe("isSafeExternalUrl", () => {
  it("allows https URLs", () => {
    expect(isSafeExternalUrl("https://example.com/docs")).toBe(true);
  });

  it("allows http URLs", () => {
    expect(isSafeExternalUrl("http://example.com")).toBe(true);
  });

  it("allows mailto URLs", () => {
    expect(isSafeExternalUrl("mailto:dev@example.com")).toBe(true);
  });

  it("blocks javascript: URLs", () => {
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });

  it("blocks data: URLs", () => {
    expect(isSafeExternalUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("blocks vbscript: URLs", () => {
    expect(isSafeExternalUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("blocks file: URLs", () => {
    expect(isSafeExternalUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("isRelativeUrl", () => {
  it("recognizes app-relative paths", () => {
    expect(isRelativeUrl("/projects/acme")).toBe(true);
  });

  it("recognizes fragment links", () => {
    expect(isRelativeUrl("#section")).toBe(true);
  });

  it("rejects absolute URLs", () => {
    expect(isRelativeUrl("https://example.com")).toBe(false);
  });
});

describe("buildSearchUrl", () => {
  it("appends only defined params as a query string", () => {
    const url = buildSearchUrl("/projects/acme/files", {
      path: "docs/auth.md",
      startLine: 12,
      endLine: undefined,
    });
    expect(url).toBe("/projects/acme/files?path=docs%2Fauth.md&startLine=12");
  });

  it("returns the bare pathname when there are no params", () => {
    expect(buildSearchUrl("/projects", {})).toBe("/projects");
  });
});
