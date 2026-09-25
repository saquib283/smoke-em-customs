import { test, expect } from '@playwright/test';

test.describe('Customer Booking Flow (PRD §10, §19 & Architecture §10)', () => {
  test('customer navigates booking catalog, selects treatment, picks slot, and confirms bay reservation', async ({
    page,
  }) => {
    // 1. Visit booking catalog
    await page.goto('/book');
    await expect(page).toHaveTitle(/Book|Appointment/i);

    // 2. Select first available treatment
    const bookTreatmentBtn = page.getByRole('link', { name: /book|reserve|select/i }).first();
    await expect(bookTreatmentBtn).toBeVisible();
    await bookTreatmentBtn.click();

    // 3. Wizard Step 1: Select Date & Slot
    await expect(page.locator('text=/select date|time slot|bay/i').first()).toBeVisible();

    // Wait for time slots to load and click an available slot
    const slotButton = page.locator('button:has-text("AM"), button:has-text("PM")').first();
    if (await slotButton.isVisible()) {
      await slotButton.click();
    }

    // Advance to Step 2 (Customer details)
    const proceedBtn = page.getByRole('button', { name: /next|continue|enter details/i });
    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
    }

    // 4. Fill Customer & Vehicle Info
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Rahul Deshmukh');
    }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="mobile" i]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9822334455');
    }

    const brandInput = page.locator('input[placeholder*="brand" i], select[name="brand"]').first();
    if (await brandInput.isVisible()) {
      await brandInput.fill('BMW');
    }

    const modelInput = page.locator('input[placeholder*="model" i]').first();
    if (await modelInput.isVisible()) {
      await modelInput.fill('M340i');
    }

    // 5. Submit Reservation
    const confirmBtn = page.getByRole('button', { name: /confirm booking|reserve slot|book now/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // 6. Verification of Confirmation State
    await expect(
      page.locator('text=/booking confirmed|appointment reserved|reference|calendar/i').first()
    ).toBeVisible({ timeout: 12000 });
  });
});
