import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./e2e/test-account";

// Same env files as Next (.env.local), for the optional test account.
loadEnvConfig(process.cwd());

const PORT = 3100;

// End-to-end checks against the production build: run `npm run build`
// first, then `npm run test:e2e`.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US", // "/" redirects other browser languages to /ru or /ro
    trace: "on-first-retry",
  },
  projects: [
    // Signed-in specs run in Chromium only; they need a test account.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "signed-in",
      testMatch: /platform\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
    },
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Safari's engine, for behaviour. Not for 3D looks: headless WebKit
    // ignores backface-visibility (even on a bare test page), so flip
    // cards show their mirrored back there. Check 3D in real Safari.
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Firefox has no scroll-driven animations: checks the static fallback.
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ].map((project) =>
    project.testMatch ? project : { ...project, testIgnore: [/auth\.setup\.ts/, /platform\.spec\.ts/] },
  ),
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
