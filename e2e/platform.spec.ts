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

// A long word on a 320px phone must wrap inside the card, never under the
// level badge or the RU/RO switch beside it.
test("a long word fits the learn card at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(() => localStorage.setItem("ef-learn-tour-seen", "1"));
  await page.goto("/learn");

  const word = page.locator('.card-in p[lang="en"]').first();
  await expect(word).toBeVisible();
  await word.evaluate((el) => (el.textContent = "responsibilities"));

  const overlaps = await page.evaluate(() => {
    const card = document.querySelector(".card-in")!.getBoundingClientRect();
    const wordBox = document.querySelector('.card-in p[lang="en"]')!.getBoundingClientRect();
    const badges = document.querySelector('.card-in [role="group"]')!.getBoundingClientRect();
    const hit = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { underBadges: hit(wordBox, badges), outsideCard: wordBox.right > card.right };
  });
  expect(overlaps).toEqual({ underBadges: false, outsideCard: false });
});

// "I know it" / "Learn it" must stay one line on a 320px phone; they used
// to break into "I / KNOW / IT".
test("the learn answer buttons keep one-line labels at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(() => localStorage.setItem("ef-learn-tour-seen", "1"));
  await page.goto("/learn");

  for (const name of [/i know it/i, /learn it/i]) {
    const button = page.getByRole("button", { name });
    await expect(button).toBeVisible();
    const lines = await button.evaluate((el) => {
      // Measure the label's text node only, not the icon beside it.
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent?.trim()) text = walker.nextNode();
      const range = document.createRange();
      range.selectNodeContents(text!);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    });
    expect(lines, String(name)).toBe(1);
  }
});
