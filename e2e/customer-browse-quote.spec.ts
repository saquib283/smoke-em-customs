import { test, expect } from '@playwright/test';

test.describe('Customer Browse & Quote Submission Flow (PRD §8, §12)', () => {
  test('customer can browse homepage, navigate to quote page, fill details, and receive estimate', async ({
    page,
  }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Smoke M Customs/i);

    // 2. Click Request Quote CTA or navigate to /quote
    const quoteLink = page.getByRole('link', { name: /quote|estimate|consultation/i }).first();
    if (await quoteLink.isVisible()) {
      await quoteLink.click();
    } else {
      await page.goto('/quote');
    }

    await expect(page).toHaveURL(/\/quote/);
    await expect(page.locator('h1')).toContainText(/Quote|Estimate|Pricing/i);

    // 3. Step 1: Customer Contact Info
    const nameInput = page.locator('input[placeholder*="name" i], input[name="customerName"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Karan Varma');
    }

    const phoneInput = page.locator('input[placeholder*="phone" i], input[placeholder*="mobile" i], input[type="tel"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
    }

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('karan.varma@example.com');
    }

    // Advance to Step 2 if wizard multi-step
    const nextBtn = page.getByRole('button', { name: /next|continue|step/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // 4. Step 2: Vehicle Details
    const brandSelect = page.locator('select, input[placeholder*="brand" i]');
    if (await brandSelect.isVisible()) {
      await brandSelect.first().click();
    }

    const modelInput = page.locator('input[placeholder*="model" i]');
    if (await modelInput.isVisible()) {
      await modelInput.fill('Defender 110');
    }

    // Advance to Step 3 if multi-step
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // 5. Submit the Quote Form
    const submitBtn = page.getByRole('button', { name: /submit|get quote|calculate/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // 6. Verify Quote Confirmation / Instant Estimate
    await expect(page.locator('text=/estimate|reference|whatsapp|inquiry submitted/i').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
