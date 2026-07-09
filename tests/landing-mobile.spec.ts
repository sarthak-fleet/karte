import { expect, test } from '@playwright/test';

/**
 * Mobile-viewport smoke test for the public landing page.
 *
 * Runs under both the `desktop` and `mobile` Playwright projects (see
 * playwright.config.ts). The `mobile` project uses a 390px iPhone 13
 * viewport — the fleet mobile target — so layout regressions there fail CI.
 *
 * The signed-in dashboard requires Google OAuth, so the primary signed-in
 * flow is verified manually against the mobile conventions doc.
 */
test.describe('landing page', () => {
  test('renders the inbound-agent deck with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Everyone gets an agent/i, level: 1 }),
    ).toBeVisible();

    await expect(
      page.getByText(/The public agent for your inbound/i),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Claim your name/i }).first(),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('assistant and inbound desk cards are present', async ({ page }) => {
    await page.goto('/');

    await page
      .getByText(/The inbound desk/i)
      .first()
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('heading', { name: /Four ways to handle inbound/i }),
    ).toBeVisible();
    await expect(
      page.locator('.onyx-surfaces-list').getByText('Email', { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.onyx-surfaces-list').getByText('Leads', { exact: true }),
    ).toBeVisible();

    await page.locator('.onyx-agents').scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('heading', {
        name: /Your assistant takes the first pass/i,
      }),
    ).toBeVisible();
  });

  test('the primary CTA is a large enough touch target', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Claim your name/i }).first();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
