import { defineConfig, devices } from "@playwright/test";

// Plain Playwright runtime. The dev server has NEXT_PUBLIC_E2E_MODE=true, so
// testProxy is on. This separates the testProxy config from the test-mode
// runtime.
const PORT = process.env.PORT ?? "3002";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.proxyconfig.spec.ts",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: { NEXT_PUBLIC_E2E_MODE: "true" },
  },
});
