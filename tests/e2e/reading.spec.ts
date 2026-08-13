import { expect, test } from "@playwright/test";

test.describe("Reading sessions", () => {
  test("starting a reading session from the file viewer shows the persistent audio player", async ({
    page,
  }) => {
    await page.goto(
      "/projects/proj_acme-api/files?path=docs%2Fauth.md&commit=a17d3e19c4f2b8a6d0e5f1c7b9a3d6e8f0c2b4a6&view=source",
    );

    await page.getByRole("button", { name: /listen/i }).click();
    await expect(page.getByRole("dialog", { name: "Listen to this document" })).toBeVisible();

    await page.getByRole("button", { name: "Start reading" }).click();

    const player = page.getByRole("region", { name: "Document reading player" });
    await expect(player).toBeVisible();
    await expect(player.getByText("docs/auth.md")).toBeVisible();
    await expect(player.getByText(/Segment 1\//)).toBeVisible();
  });

  test("play/pause and close controls on the persistent player work", async ({ page }) => {
    await page.goto(
      "/projects/proj_acme-api/files?path=docs%2Fauth.md&commit=a17d3e19c4f2b8a6d0e5f1c7b9a3d6e8f0c2b4a6&view=source",
    );
    await page.getByRole("button", { name: /listen/i }).click();
    await page.getByRole("button", { name: "Start reading" }).click();

    const player = page.getByRole("region", { name: "Document reading player" });
    await expect(player).toBeVisible();

    const toggle = player.getByRole("button", { name: /^(play|pause)$/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await player.getByRole("button", { name: "Close player" }).click();
    await expect(page.getByRole("region", { name: "Document reading player" })).not.toBeVisible();
  });
});
