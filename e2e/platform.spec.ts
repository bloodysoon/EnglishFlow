import { expect, test } from "@playwright/test";

import { hasTestAccount } from "./test-account";

test.skip(!hasTestAccount(), "E2E_EMAIL / E2E_PASSWORD not set");

const PAGES = ["/dashboard", "/learn", "/statistics", "/achievements", "/settings"];

for (const path of PAGES) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(path);

    await expect(page).toHaveURL(new RegExp(`${path}$`)); // not bounced to /login
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${path} has no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

// The first-visit tour on /learn must frame its target even though the
// page header is still rising (`rise` animation) when the tour opens.
for (const [width, height] of [
  [1440, 900],
  [320, 700],
]) {
  test(`the learn tour frames its target at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      localStorage.removeItem("ef-learn-tour-seen");
      // A slow `rise` makes sure the tour opens while the header still moves.
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = ".rise { animation-duration: 3s !important; }";
        document.head.append(style);
      });
    });
    await page.goto("/learn");

    const target = page.locator('[data-tour="today"]').first();
    const spotlight = page.locator("[data-tour-spotlight]");
    await expect(spotlight).toBeVisible();
    await page.waitForTimeout(3800); // rise done, spotlight transition settled

    // Spotlight = target grown by 6px (PAD) on every side.
    const [t, s] = await Promise.all([target.boundingBox(), spotlight.boundingBox()]);
    expect(Math.abs(s!.y + 6 - t!.y) + Math.abs(s!.x + 6 - t!.x)).toBeLessThanOrEqual(1);
  });
}

// Opening settings must not drop focus into a field (it skips the heading
// for screen readers and pops up the keyboard on phones).
test("settings does not steal focus on load", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).not.toBe("INPUT");
});
