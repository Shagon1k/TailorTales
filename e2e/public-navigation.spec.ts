import { expect, test } from '@playwright/test';

test.describe('public navigation', () => {
    test('should render the landing page and open pricing', async ({ page }) => {
        await page.goto('/en');

        await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
        await page.getByRole('link', { name: 'Pricing' }).click();

        await expect(page).toHaveURL(/\/en\/pricing$/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
});
