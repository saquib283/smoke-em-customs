import { describe, it } from 'node:test';
import assert from 'node:assert';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

function buildWhatsAppDeepLink(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function isFollowUpDue(lastActivityDate: Date, now: Date, thresholdDays = 3): boolean {
  const diffMs = now.getTime() - lastActivityDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

function isDuplicateLeadSubmission(
  lastSubmission: { phone: string; vehicleBrand: string; vehicleModel: string; createdAt: Date },
  currentSubmission: { phone: string; vehicleBrand: string; vehicleModel: string; createdAt: Date },
  windowHours = 24
): boolean {
  const samePhone = normalizePhone(lastSubmission.phone) === normalizePhone(currentSubmission.phone);
  const sameVehicle =
    lastSubmission.vehicleBrand.toLowerCase().trim() === currentSubmission.vehicleBrand.toLowerCase().trim() &&
    lastSubmission.vehicleModel.toLowerCase().trim() === currentSubmission.vehicleModel.toLowerCase().trim();

  const diffHours = (currentSubmission.createdAt.getTime() - lastSubmission.createdAt.getTime()) / (1000 * 60 * 60);

  return samePhone && sameVehicle && diffHours >= 0 && diffHours <= windowHours;
}

describe('CRM Pipeline & Validation Rules (PRD §8.4, §19 AC-6, FR-13, FR-27)', () => {
  it('normalizes Indian phone numbers with country code prefix', () => {
    assert.strictEqual(normalizePhone('9876543210'), '919876543210');
    assert.strictEqual(normalizePhone('+91 98765 43210'), '919876543210');
    assert.strictEqual(normalizePhone('09876543210'), '09876543210');
  });

  it('builds compliant WhatsApp deep-links with pre-filled message (PRD F13)', () => {
    const link = buildWhatsAppDeepLink('9876543210', 'Hi Smoke M Customs, I would like to confirm my booking #SMC-1234');
    assert.ok(link.startsWith('https://wa.me/919876543210?text='));
    assert.ok(link.includes(encodeURIComponent('Hi Smoke M Customs')));
    assert.ok(link.includes('%23SMC-1234'));
  });

  it('flags leads for follow-up if inactive for 3+ days (PRD FR-27 & AC-6)', () => {
    const now = new Date('2026-10-10T12:00:00Z');

    // 2 days ago -> NOT due
    const twoDaysAgo = new Date('2026-10-08T12:00:00Z');
    assert.strictEqual(isFollowUpDue(twoDaysAgo, now, 3), false);

    // 3 days ago -> DUE
    const threeDaysAgo = new Date('2026-10-07T12:00:00Z');
    assert.strictEqual(isFollowUpDue(threeDaysAgo, now, 3), true);

    // 5 days ago -> DUE
    const fiveDaysAgo = new Date('2026-10-05T12:00:00Z');
    assert.strictEqual(isFollowUpDue(fiveDaysAgo, now, 3), true);
  });

  it('detects duplicate lead submissions for same phone and vehicle within 24h (PRD FR-13)', () => {
    const timeA = new Date('2026-10-10T09:00:00Z');
    const timeB = new Date('2026-10-10T14:30:00Z'); // 5.5 hours later
    const timeC = new Date('2026-10-12T09:00:00Z'); // 48 hours later

    const lead1 = { phone: '9876543210', vehicleBrand: 'BMW', vehicleModel: 'M340i', createdAt: timeA };
    const lead2 = { phone: '+91 98765 43210', vehicleBrand: 'bmw', vehicleModel: 'M340i ', createdAt: timeB };
    const lead3 = { phone: '9876543210', vehicleBrand: 'BMW', vehicleModel: 'M340i', createdAt: timeC };

    // Within 24h -> duplicate flag
    assert.strictEqual(isDuplicateLeadSubmission(lead1, lead2, 24), true);

    // After 48h -> not duplicate flag
    assert.strictEqual(isDuplicateLeadSubmission(lead1, lead3, 24), false);
  });
});
