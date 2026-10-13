import { defineConfig, devices } from "@playwright/test";
import { E2E_ENV, E2E_PORT, E2E_URL } from "./tests/e2e/env";

// Run with: npm run test:e2e   (resets the e2e database, builds, starts the server and runs the suite)
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1, // tests share one database and run in order
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: E2E_URL,
    locale: "bn-BD",
    timezoneId: "Asia/Dhaka",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next build && npx next start -p ${E2E_PORT}`,
    url: `${E2E_URL}/robots.txt`,
    timeout: 300_000,
    reuseExistingServer: Boolean(process.env.PW_REUSE_SERVER),
    env: { ...E2E_ENV },
    stdout: "pipe",
  },
});
