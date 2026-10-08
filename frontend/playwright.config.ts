import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end journeys against a running stack: Next.js on :3000 and the
 * Spring Boot API on :8080 (Postgres, Redis, MinIO behind it). The tests do
 * not boot that stack — start it the same way you do for local development.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
