import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ }, { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ }],
  webServer: { command: "npm run build && npm run start", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 240_000 },
});
