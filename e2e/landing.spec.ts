import { expect, test } from "@playwright/test";

for (const path of ["/", "/ru", "/ro"]) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("has no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("the pause button stops and restarts the looping animations", async ({ page }) => {
  await page.goto("/");
  const pause = page.getByRole("button", { name: "Pause animations" });
  const marquee = page.locator(".marquee-track");

  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(marquee).toHaveCSS("animation-play-state", "paused");

  // The choice survives a reload (cookie read on the server).
  await page.reload();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(marquee).toHaveCSS("animation-play-state", "paused");

  await pause.click();
  await expect(marquee).toHaveCSS("animation-play-state", "running");
  await page.reload();
  await expect(marquee).toHaveCSS("animation-play-state", "running");
});

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("nothing loops and the pause button is hidden", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".marquee-track")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".flip-card")).toHaveCSS("animation-name", "none");
    await expect(page.getByRole("button", { name: "Pause animations" })).toBeHidden();
  });
});

test("the review demo moves an answered word on", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#daily-review");

  await demo.getByRole("button", { name: "Show translation" }).click();
  await demo.getByRole("button", { name: "Got it" }).click();

  await expect(demo.getByText(/^Word 2 of \d+$/)).toBeVisible();
  // The flying copy of the card removes itself once its animation ends.
  await expect(demo.locator(".card-out--up")).toHaveCount(0);
});

test("serves robots.txt, the sitemap and the link preview images", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/opengraph-image", "/ru/opengraph-image", "/ro/opengraph-image"]) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
});
