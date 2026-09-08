import { describe, expect, it } from "vitest";

import { cardNarrationText } from "@/features/chat/lib/narration";

describe("cardNarrationText", () => {
  it("removes a trailing source list from narration", () => {
    expect(
      cardNarrationText("A validação foi adicionada.\n\nFontes:\nforms/login.ts · L12-L24"),
    ).toBe("A validação foi adicionada.");
  });

  it("keeps ordinary prose intact", () => {
    expect(cardNarrationText("A validação foi adicionada.")).toBe("A validação foi adicionada.");
  });
});
