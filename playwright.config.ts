import { defineConfig, devices } from "next/experimental/testmode/playwright";

const PORT = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: { baseURL },
  projects: [
    {
      name: "chromium",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node server/stream-server.mjs",
      url: "http://localhost:4000/health",
      reuseExistingServer: false,
    },
    {
      command: "next dev",
      url: baseURL,
      reuseExistingServer: false,
      // testProxy activates only when this is set (see next.config.ts).
      env: { NEXT_PUBLIC_E2E_MODE: "true" },
    },
  ],
});
