import { expect, test } from "@playwright/test";

// Screenshot checks of the public pages. Update the baselines after an
// intended design change: `npm run test:e2e -- visual --update-snapshots`.
// shortcut: baselines are rendered on macOS only, so CI skips them; add
// Linux baselines (e.g. via the Playwright Docker image) to run them there.
test.skip(Boolean(process.env.CI), "baselines are macOS-only");
test.skip(({ browserName }) => browserName !== "chromium", "one engine is enough for looks");

test.use({ reducedMotion: "reduce" });

const pages = { landing: "/", login: "/login", register: "/register" };
const widths = { phone: 375, desktop: 1440 };

for (const theme of ["light", "dark"] as const) {
  for (const [name, path] of Object.entries(pages)) {
    for (const [device, width] of Object.entries(widths)) {
      test(`${name} ${device} ${theme}`, async ({ page, context, baseURL }) => {
        await context.addCookies([{ name: "ef-theme", value: theme, url: baseURL! }]);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);

        await expect(page).toHaveScreenshot(`${name}-${device}-${theme}.png`, {
          fullPage: true,
          animations: "disabled",
        });
      });
    }
  }
}
