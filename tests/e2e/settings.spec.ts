import { expect, test } from "@playwright/test";

test.describe("Settings", () => {
  test("providers tab lists configured providers with capabilities and credential status", async ({
    page,
  }) => {
    await page.goto("/projects/proj_acme-api/settings/providers");

    await expect(page.getByText("anthropic")).toBeVisible();
    await expect(page.getByText("Credentials configured").first()).toBeVisible();
    await expect(page.getByText("No credentials", { exact: false })).toBeVisible(); // openai fixture has none configured
    await expect(page.getByText("Streaming").first()).toBeVisible();
  });

  test("Marin is the configured default voice", async ({ page }) => {
    await page.goto("/projects/proj_acme-api/settings/speech");

    const marinRow = page.getByRole("listitem").filter({ hasText: "Marin" });
    await expect(marinRow.getByRole("button", { name: "Selected" })).toBeVisible();
  });

  test("previewing and selecting a non-default voice works", async ({ page }) => {
    await page.goto("/projects/proj_acme-api/settings/speech");

    const coveRow = page.getByRole("listitem").filter({ hasText: "Cove" });
    await expect(coveRow).toBeVisible();
    await expect(coveRow.getByRole("button", { name: /^select$/i })).toBeVisible();

    // VoicePreviewButton's accessible name is "Preview Cove" (visible text +
    // a visually-hidden voice name suffix for screen readers), hence the
    // unanchored match.
    await coveRow.getByRole("button", { name: /preview/i }).click();
    await expect(coveRow.getByRole("button", { name: /stop/i })).toBeVisible({ timeout: 10_000 });

    await coveRow.getByRole("button", { name: /^select$/i }).click();
    await expect(coveRow.getByRole("button", { name: "Selected" })).toBeVisible();
  });

  test("diagnostics tab shows backend version and connection status", async ({ page }) => {
    await page.goto("/projects/proj_acme-api/settings/diagnostics");

    await expect(page.getByText("0.4.0-mock")).toBeVisible();
    await expect(page.getByText("~/.devmate/devmate.sqlite3")).toBeVisible();
    await expect(page.getByText("Connected").first()).toBeVisible();
  });
});
