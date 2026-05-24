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

    await expect(
      page.getByRole('heading', { name: 'Profiles people can query', level: 1 }),
    ).toBeVisible();

    await expect(page.getByTestId('home-profile-demo')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'What is Sarthak building?' }),
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: /try live profile/i }).first(),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('demo prompts and mode tabs are interactive', async ({ page }) => {
    await page.goto('/');

    const demo = page.getByTestId('home-profile-demo');
    await expect(demo).toBeVisible();

    await demo.getByRole('button', { name: 'Encyclopedia' }).click();
    await expect(demo.getByText('Generated from profile memory')).toBeVisible();

    await demo.getByRole('button', { name: 'Chat' }).click();
    await demo.getByRole('button', { name: 'Which project should I open first?' }).click();
    await expect(
      demo.getByText('Open LinkChat if you care about link-in-bio + AI profile modes.'),
    ).toBeVisible();
  });

  test('the primary CTA is a large enough touch target', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /try live profile/i }).first();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
