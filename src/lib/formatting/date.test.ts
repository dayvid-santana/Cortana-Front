import { describe, expect, it } from "vitest";

import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatting/date";

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-13T14:00:00Z");

  it("returns 'just now' for timestamps under a minute old", () => {
    expect(formatRelativeTime("2026-08-13T13:59:30Z", now)).toBe("just now");
  });

  it("formats hours in the past", () => {
    expect(formatRelativeTime("2026-08-13T11:00:00Z", now)).toBe("3 hours ago");
  });

  it("formats days in the future", () => {
    expect(formatRelativeTime("2026-08-15T14:00:00Z", now)).toBe("in 2 days");
  });

  it("formats minutes in the past", () => {
    expect(formatRelativeTime("2026-08-13T13:45:00Z", now)).toBe("15 minutes ago");
  });
});

describe("formatAbsoluteTime", () => {
  it("produces a non-empty, locale-formatted string", () => {
    const formatted = formatAbsoluteTime("2026-08-13T14:00:00Z");
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).not.toBe("Invalid Date");
  });
});
