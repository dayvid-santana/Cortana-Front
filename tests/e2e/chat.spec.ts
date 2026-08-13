import { expect, test } from "@playwright/test";

// The parent commit has no seeded thread in the mock fixtures, so tests
// that assert on "the streamed response appearing" start from a clean chat
// instead of the head commit's pre-seeded example conversation.
const PARENT_COMMIT_HASH = "f0c2b4a6d8e0f2c4b6a8d0e2f4c6b8a0d2e4f6c8";

test.describe("Chat", () => {
  test("defaults to Docs scope and streams an assistant response with citations", async ({
    page,
  }) => {
    await page.goto(`/projects/proj_acme-api/chat?commit=${PARENT_COMMIT_HASH}`);

    const docsOption = page.getByRole("radio", { name: /docs/i });
    await expect(docsOption).toHaveAttribute("aria-checked", "true");

    const composer = page.getByRole("textbox", { name: /message/i });
    await composer.fill("What did this commit change about authentication?");
    await composer.press("Control+Enter");

    // Cancel button replaces Send while the run streams.
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();

    // The scripted mock response completes within a few seconds.
    await expect(page.getByText(/Access tokens/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /^send$/i })).toBeVisible();

    // The user's message and at least one clickable citation are rendered.
    await expect(page.getByText("What did this commit change about authentication?")).toBeVisible();
    await expect(page.getByRole("link", { name: /docs\/auth\.md.*Access tokens/ })).toBeVisible();
  });

  test("switching to Code scope requires an explicit click and shows the remote-context warning", async ({
    page,
  }) => {
    await page.goto("/projects/proj_acme-api/chat");

    await expect(page.getByRole("radio", { name: /code/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await page.getByRole("radio", { name: /code/i }).click();
    await expect(page.getByRole("radio", { name: /code/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page).toHaveURL(/scope=code/);

    await expect(
      page.getByText(/remote — content sent as context leaves your machine/i),
    ).toBeVisible();
  });

  test("cancelling a run stops it and re-enables the composer", async ({ page }) => {
    await page.goto("/projects/proj_acme-api/chat");

    const composer = page.getByRole("textbox", { name: /message/i });
    await composer.fill("Tell me about this commit");
    await composer.press("Control+Enter");

    await page.getByRole("button", { name: /cancel/i }).click();

    await expect(page.getByText("Cancelled")).toBeVisible();
    await expect(page.getByRole("button", { name: /^send$/i })).toBeVisible();
  });
});
