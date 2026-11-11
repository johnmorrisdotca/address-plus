// The demo's own tests: a real browser, real taps. `pnpm test:demo` builds the demo and runs them. The page is served
// to the browser by the tests themselves (e2e/demo.mjs), so no port is opened.
import { defineConfig, devices } from "@playwright/test";

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

export default defineConfig({
  // One browser at a time on a machine: a run waits its turn in kazoku-ui's queue.
  globalSetup: "@johnmorrisdotca/kazoku-ui/testing/global-setup",
  testDir: "e2e",
  testMatch: "*.demo.mjs",
  fullyParallel: true,
  forbidOnly: true,
  reporter: "list",
  use: { reducedMotion: "reduce", locale: "en-US" },
  projects: [
    { name: "chromium-phone", use: { ...devices["Desktop Chrome"], ...phone } },
    { name: "chromium-desk", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
});
