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
  test('renders the interactive demo and key sections with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');

    // Hero manifesto headline (revamped landing)
    await expect(
      page.getByRole('heading', { name: /Your link-in-bio is a/i, level: 1 }),
    ).toBeVisible();

    await expect(page.getByTestId('landing-demo')).toBeVisible();

    // A prompt button from the new demo
    await expect(
      page.getByRole('button', { name: 'What is Sarthak building?' }),
    ).toBeVisible();

    // Primary CTAs exist and are large
    await expect(
      page.getByRole('link', { name: /See it live/i }).first(),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('demo mode tabs and prompts are interactive', async ({ page }) => {
    await page.goto('/');

    const demo = page.getByTestId('landing-demo');
    await expect(demo).toBeVisible();

    // Switch to Encyclopedia mode
    await demo.getByRole('button', { name: 'Encyclopedia' }).click();
    await expect(demo.getByText(/citation-grade/i)).toBeVisible();

    // Back to chat + click a prompt
    await demo.getByRole('button', { name: 'Chat' }).click();
    await demo.getByRole('button', { name: 'Should I reach out?' }).click();

    // The assistant answer area updates (contains grounded text)
    await expect(demo.getByText(/Boundaries/i)).toBeVisible();
  });

  test('the primary CTA is a large enough touch target', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /See it live/i }).first();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
