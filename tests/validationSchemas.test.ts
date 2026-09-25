import { describe, it } from 'node:test';
import assert from 'node:assert';

/* ─── Validation helper implementations ─── */

function validatePhone(phone: string): { valid: boolean; normalized?: string; error?: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return { valid: true, normalized: `91${digits}` };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { valid: true, normalized: digits };
  }
  return { valid: false, error: 'Phone must be a valid 10-digit Indian mobile number.' };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface BookingInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  startAt?: string;
  resourceId?: string;
  durationMinutes?: number;
}

function validateBookingInput(input: BookingInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.customerName || input.customerName.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters.');
  }

  if (!input.customerPhone) {
    errors.push('Customer phone is required.');
  } else {
    const phoneCheck = validatePhone(input.customerPhone);
    if (!phoneCheck.valid) {
      errors.push(phoneCheck.error!);
    }
  }

  if (input.customerEmail && !validateEmail(input.customerEmail)) {
    errors.push('Invalid email format.');
  }

  if (!input.startAt) {
    errors.push('Start time is required.');
  } else {
    const parsedDate = new Date(input.startAt);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid start time format.');
    }
  }

  if (!input.resourceId || !input.resourceId.trim()) {
    errors.push('Resource/Bay selection is required.');
  }

  if (input.durationMinutes !== undefined && (input.durationMinutes < 30 || !Number.isInteger(input.durationMinutes))) {
    errors.push('Duration must be an integer of at least 30 minutes.');
  }

  return { valid: errors.length === 0, errors };
}

interface ReviewInput {
  customerName?: string;
  rating?: number;
  body?: string;
}

function validateReviewInput(input: ReviewInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.customerName || input.customerName.trim().length < 2) {
    errors.push('Customer name is required.');
  }

  if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    errors.push('Rating must be an integer between 1 and 5 stars.');
  }

  if (!input.body || input.body.trim().length < 10) {
    errors.push('Review body must be at least 10 characters.');
  }

  return { valid: errors.length === 0, errors };
}

interface OfferInput {
  title?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  startDate?: string;
  endDate?: string;
}

function validateOfferInput(input: OfferInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 3) {
    errors.push('Offer title is required.');
  }

  if (input.discountValue === undefined || input.discountValue <= 0) {
    errors.push('Discount value must be greater than 0.');
  } else if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
    errors.push('Percentage discount cannot exceed 100%.');
  }

  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate).getTime();
    const end = new Date(input.endDate).getTime();
    if (start > end) {
      errors.push('Start date cannot be after end date.');
    }
  }

  return { valid: errors.length === 0, errors };
}

describe('Validation Schemas & Input Constraints (PRD §19 & Architecture §15)', () => {
  it('validates a complete and correct booking submission', () => {
    const validBooking: BookingInput = {
      customerName: 'Aarav Patel',
      customerPhone: '+91 98765 43210',
      customerEmail: 'aarav@example.com',
      startAt: '2026-10-15T10:00:00.000Z',
      resourceId: 'bay-1',
      durationMinutes: 120,
    };

    const result = validateBookingInput(validBooking);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('catches missing or invalid fields in booking submissions', () => {
    const badBooking: BookingInput = {
      customerName: 'A', // Too short
      customerPhone: '12345', // Invalid phone
      customerEmail: 'not-an-email', // Invalid email
      startAt: 'invalid-date', // Bad date
      resourceId: '', // Empty bay
      durationMinutes: 15, // Under 30 min
    };

    const result = validateBookingInput(badBooking);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 6);
  });

  it('validates review ratings strictly between 1 and 5 stars', () => {
    assert.strictEqual(
      validateReviewInput({ customerName: 'Raj', rating: 5, body: 'Flawless ceramic finish on my car.' }).valid,
      true
    );
    assert.strictEqual(
      validateReviewInput({ customerName: 'Raj', rating: 0, body: 'Valid body text here' }).valid,
      false
    );
    assert.strictEqual(
      validateReviewInput({ customerName: 'Raj', rating: 6, body: 'Valid body text here' }).valid,
      false
    );
    assert.strictEqual(
      validateReviewInput({ customerName: 'Raj', rating: 4.5, body: 'Valid body text here' }).valid,
      false // Must be integer
    );
  });

  it('validates promotional offer validity windows and discount boundaries', () => {
    const goodOffer: OfferInput = {
      title: 'Monsoon Detailing Privilege',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      startDate: '2026-07-01',
      endDate: '2026-08-31',
    };
    assert.strictEqual(validateOfferInput(goodOffer).valid, true);

    // Percentage > 100% rejected
    const excessivePercent: OfferInput = {
      title: 'Over 100%',
      discountType: 'PERCENTAGE',
      discountValue: 120,
    };
    assert.strictEqual(validateOfferInput(excessivePercent).valid, false);

    // Start date after end date rejected
    const invertedDates: OfferInput = {
      title: 'Inverted Window',
      discountType: 'FIXED',
      discountValue: 1000,
      startDate: '2026-09-01',
      endDate: '2026-08-01',
    };
    assert.strictEqual(validateOfferInput(invertedDates).valid, false);
  });
});
