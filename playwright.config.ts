/**
 * Playwright config — desktop + mobile-viewport projects.
 *
 * The `mobile` project uses the iPhone 13 device descriptor (390px wide — the
 * fleet Wave 4 mobile target) so mobile-layout regressions are caught in CI
 * alongside the `desktop` baseline.
 *
 * `testMatch` is scoped to `*.spec.ts` so the `*.unit.test.mjs` files in
 * `tests/` (run separately via `pnpm test`) are not picked up here.
 *
 * Run only the mobile project:  pnpm exec playwright test --project=mobile
 */
import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3000';
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    // `--webpack` matches the project's build config (Next 16 defaults to
    // Turbopack, but linkchat builds with webpack).
    command: `pnpm exec next dev --webpack -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Desktop baseline.
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Mobile-viewport project — iPhone 13 is 390px wide, the mobile target.
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
