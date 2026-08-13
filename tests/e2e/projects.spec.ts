import { expect, test } from "@playwright/test";

test.describe("Projects", () => {
  test("redirects from / to /projects and lists the known project", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "acme-api" })).toBeVisible();
    await expect(page.getByText("feature/auth")).toBeVisible();
  });

  test("opening a project lands on its overview with the active commit", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "Open" }).click();

    await expect(page).toHaveURL(/\/projects\/proj_acme-api\/overview$/);
    await expect(page.getByText("document authentication flow").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "acme-api" })).toBeVisible();
  });

  test("adding a project with an empty path shows a validation error and does not navigate away", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: "Add project" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add project" }).click();

    await expect(page.getByText("A repository path is required.")).toBeVisible();
  });

  test("adding a project with a valid path creates it and closes the dialog", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: "Add project" }).click();
    await page.getByLabel("Repository path").fill("/home/dev/another-repo");
    await page.getByRole("dialog").getByRole("button", { name: "Add project" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("link", { name: "another-repo" })).toBeVisible();
  });
});
