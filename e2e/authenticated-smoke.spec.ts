import { expect, test } from '@playwright/test';

test.describe('authenticated smoke', () => {
    test.beforeEach(async ({ page }) => {
        const secret = process.env.E2E_TEST_SECRET;
        if (!secret) throw new Error('E2E_TEST_SECRET is required for authenticated smoke tests');

        const response = await page.request.post('/api/auth/e2e/session', {
            headers: { 'x-e2e-test-secret': secret },
        });
        expect(response.status()).toBe(204);
    });

    test('should open the library and subscription pages without an application error', async ({
        page,
    }) => {
        await page.goto('/en/library');
        await expect(page).toHaveURL(/\/en\/library$/);
        await expect(page.getByRole('navigation')).toBeVisible();

        await page.goto('/en/account/subscription');
        await expect(page).toHaveURL(/\/en\/account\/subscription$/);
        await expect(page.getByText('Current plan')).toBeVisible();
    });
});
