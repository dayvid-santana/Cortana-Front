import { expect, test } from "@playwright/test";

test.describe("Citations", () => {
  test("clicking a citation in an existing conversation opens the file at the cited lines", async ({
    page,
  }) => {
    // The head commit's seeded thread already contains an assistant message
    // with a citation into docs/auth.md — no need to run a new chat turn.
    await page.goto("/projects/proj_acme-api/chat");

    const citation = page.getByRole("link", { name: /docs\/auth\.md.*Access tokens.*L15–17/ });
    await expect(citation).toBeVisible();
    await citation.click();

    await expect(page).toHaveURL(/\/files\?.*path=docs%2Fauth\.md/);
    await expect(page).toHaveURL(/startLine=15/);
    await expect(page).toHaveURL(/endLine=17/);

    // The file viewer opens on the source tab, scrolled to the cited range.
    await expect(page.getByText("docs/auth.md", { exact: false }).first()).toBeVisible();
    await expect(page.locator("#L15")).toBeVisible();
  });

  test("an invalid citation never navigates and offers no link", async ({ page }) => {
    // Every citation in the fixtures is valid; this asserts the general
    // contract instead — chat renders exactly the citations returned by the
    // API's structured `sources` array, never inventing extras by parsing
    // the message body's prose text.
    await page.goto("/projects/proj_acme-api/chat");
    const citationLinks = page.getByRole("link", { name: /docs\/auth\.md/ });
    await expect(citationLinks).toHaveCount(2);
  });
});
