import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/…" alias as tsconfig.json, so tested modules can use it.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // e2e/ holds Playwright specs; they run with `npm run test:e2e`.
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
