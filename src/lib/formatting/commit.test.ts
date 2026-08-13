import { describe, expect, it } from "vitest";

import { commitSubject, shortHash } from "@/lib/formatting/commit";

describe("shortHash", () => {
  it("truncates a full hash to 7 characters", () => {
    expect(shortHash("a17d3e19c4f2b8a6d0e5f1c7b9a3d6e8f0c2b4a6")).toBe("a17d3e1");
  });

  it("returns short hashes unchanged", () => {
    expect(shortHash("abc123")).toBe("abc123");
  });
});

describe("commitSubject", () => {
  it("returns only the first line of a multi-line message", () => {
    expect(commitSubject("document auth flow\n\nLonger body text here.")).toBe(
      "document auth flow",
    );
  });

  it("truncates long subjects with an ellipsis", () => {
    const longSubject = "a".repeat(100);
    const result = commitSubject(longSubject, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("leaves short subjects untouched", () => {
    expect(commitSubject("fix bug", 72)).toBe("fix bug");
  });
});
