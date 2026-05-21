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
  test('renders the hero and key sections with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');

    // Hero value prop.
    await expect(
      page.getByRole('heading', { name: 'LinkChat', level: 1 }),
    ).toBeVisible();

    // Primary CTA (the hero "Build Your Profile" link).
    await expect(
      page.getByRole('link', { name: /build your profile/i }).first(),
    ).toBeVisible();

    // No horizontal scroll — the page must never scroll sideways at 390px.
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('the primary CTA is a large enough touch target', async ({ page }) => {
    await page.goto('/');
    const cta = page
      .getByRole('link', { name: /build your profile/i })
      .first();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    // WCAG 2.5.5 / iOS HIG: tap targets must be at least 44x44px.
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
