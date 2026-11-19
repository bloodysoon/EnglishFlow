import { expect, test as setup } from "@playwright/test";

import { AUTH_FILE, hasTestAccount } from "./test-account";

// Logs in once with the test account and saves the session for the
// signed-in specs. Without E2E_EMAIL/E2E_PASSWORD (e.g. in CI) it skips,
// and so do they.
setup("log in with the test account", async ({ page }) => {
  setup.skip(!hasTestAccount(), "E2E_EMAIL / E2E_PASSWORD not set");

  await page.goto("/login");
  await page.locator("#email").fill(process.env.E2E_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: AUTH_FILE });
});
