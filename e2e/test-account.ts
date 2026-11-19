// Credentials of a dedicated test account, read from .env.local (never
// commit them). The saved session lives in a gitignored file.
// A function, not a constant: playwright.config.ts imports this file before
// it loads .env.local, so a value computed at import time would stay false.
export const hasTestAccount = () => Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);
export const AUTH_FILE = "playwright/.auth/user.json";
