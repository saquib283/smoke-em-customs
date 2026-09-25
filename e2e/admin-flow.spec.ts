import { test, expect } from '@playwright/test';

test.describe('Admin Authentication & Operations Flow (Architecture §14 & PRD §7, §8)', () => {
  test('admin logs in, accesses dashboard KPIs, manages leads pipeline, and inspects calendar', async ({
    page,
  }) => {
    // 1. Visit admin login page
    await page.goto('/admin/login');
    await expect(page).toHaveTitle(/Admin Login|Smoke M Customs/i);

    // 2. Fill admin credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passInput = page.locator('input[type="password"], input[name="password"]');

    await emailInput.fill('admin@smokecustoms.com');
    await passInput.fill('SmokeMCustoms2024!');

    const loginButton = page.getByRole('button', { name: /sign in|log in/i });
    await loginButton.click();

    // 3. Arrive at Admin Dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=/overview|dashboard|active leads|revenue|bays/i').first()).toBeVisible({
      timeout: 10000,
    });

    // 4. Navigate to Leads Management
    const leadsNavLink = page.getByRole('link', { name: /leads/i }).first();
    await leadsNavLink.click();
    await expect(page).toHaveURL(/\/admin\/leads/);
    await expect(page.locator('h1, h2')).toContainText(/Leads/i);

    // 5. Navigate to Calendar / Bookings
    const calendarNavLink = page.getByRole('link', { name: /calendar|bookings/i }).first();
    await calendarNavLink.click();
    await expect(page).toHaveURL(/\/admin\/(calendar|bookings)/);

    // 6. Navigate to Quotes Management
    const quotesNavLink = page.getByRole('link', { name: /quotes/i }).first();
    if (await quotesNavLink.isVisible()) {
      await quotesNavLink.click();
      await expect(page).toHaveURL(/\/admin\/quotes/);
      await expect(page.locator('h1, h2')).toContainText(/Quotes/i);
    }
  });
});
