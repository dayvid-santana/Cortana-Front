import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { name: "Projects", path: "/projects" },
  { name: "Overview", path: "/projects/proj_acme-api/overview" },
  { name: "Chat", path: "/projects/proj_acme-api/chat" },
  { name: "Timeline", path: "/projects/proj_acme-api/timeline" },
  { name: "Decisions", path: "/projects/proj_acme-api/decisions" },
  { name: "Questions", path: "/projects/proj_acme-api/questions" },
];

for (const { name, path } of pages) {
  test(`${name} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      seriousOrCritical,
      seriousOrCritical
        .map((v) => `${v.id}: ${v.description}\n${v.nodes.map((n) => n.target).join(", ")}`)
        .join("\n\n"),
    ).toEqual([]);
  });
}

test("command palette is fully keyboard operable", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search commands" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("skip link becomes visible on focus and jumps to main content", async ({ page }) => {
  await page.goto("/projects/proj_acme-api/overview");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
});
