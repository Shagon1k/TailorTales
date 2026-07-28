import { expect, test } from '@playwright/test';

test.describe('public navigation', () => {
    test('should render the landing page and open pricing', async ({ page }) => {
        await page.goto('/en');

        const pricingLink = page.getByRole('link', { name: 'Pricing' });
        await expect(pricingLink).toBeVisible();
        await Promise.all([
            page.waitForURL(/\/en\/pricing$/, { timeout: 15_000 }),
            pricingLink.click(),
        ]);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
});
