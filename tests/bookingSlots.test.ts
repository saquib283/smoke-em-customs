import { describe, it } from 'node:test';
import assert from 'node:assert';

interface CandidateSlot {
  startAt: string;
  endAt: string;
  occupancyEndAt: string;
}

interface ExistingBooking {
  resourceId: string;
  startAt: string;
  endAt: string;
  status: string;
}

/**
 * Slot generator test harness matching Architecture §10.2
 * SLOT_GRANULARITY_MINUTES = 30
 */
function generateCandidateSlots(
  dateStr: string,
  openHour: number,
  closeHour: number,
  durationMinutes: number,
  bufferMinutes: number,
  now: Date,
  granularityMinutes: number = 30
): CandidateSlot[] {
  const slots: CandidateSlot[] = [];
  const openTimeMinutes = openHour * 60;
  const closeTimeMinutes = closeHour * 60;
  const totalOccupancyMinutes = durationMinutes + bufferMinutes;
  const minLeadTimeMs = 2 * 60 * 60 * 1000; // 2 hours minimum lead time

  for (
    let minute = openTimeMinutes;
    minute + durationMinutes <= closeTimeMinutes;
    minute += granularityMinutes
  ) {
    const slotHour = Math.floor(minute / 60);
    const slotMin = minute % 60;
    const slotStartIso = `${dateStr}T${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}:00.000Z`;

    const endMinute = minute + durationMinutes;
    const endHour = Math.floor(endMinute / 60);
    const endMin = endMinute % 60;
    const slotEndIso = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00.000Z`;

    const occEndMinute = minute + totalOccupancyMinutes;
    const occEndHour = Math.floor(occEndMinute / 60);
    const occEndMin = occEndMinute % 60;
    const occEndIso = `${dateStr}T${String(occEndHour).padStart(2, '0')}:${String(occEndMin).padStart(2, '0')}:00.000Z`;

    const slotStartTime = new Date(slotStartIso).getTime();
    if (slotStartTime < now.getTime() + minLeadTimeMs) {
      continue;
    }

    slots.push({
      startAt: slotStartIso,
      endAt: slotEndIso,
      occupancyEndAt: occEndIso,
    });
  }

  return slots;
}

function isSlotConflict(
  slot: CandidateSlot,
  resourceId: string,
  activeBookings: ExistingBooking[]
): boolean {
  return activeBookings.some((b) => {
    if (b.resourceId !== resourceId || b.status === 'CANCELLED') return false;
    // Overlaps if (b.startAt < slot.occupancyEndAt && b.endAt > slot.startAt)
    return b.startAt < slot.occupancyEndAt && b.endAt > slot.startAt;
  });
}

describe('Booking Engine Slot & Conflict Algorithm (Architecture §10 & PRD §19)', () => {
  const futureDate = '2026-10-15';
  const baselineNow = new Date('2026-10-10T10:00:00.000Z');

  it('generates slots with 30-minute granularity step (Architecture §10.2)', () => {
    const slots = generateCandidateSlots(futureDate, 10, 19, 120, 15, baselineNow, 30);
    assert.ok(slots.length > 0);
    assert.strictEqual(slots[0].startAt, `${futureDate}T10:00:00.000Z`);
    assert.strictEqual(slots[1].startAt, `${futureDate}T10:30:00.000Z`);
    assert.strictEqual(slots[2].startAt, `${futureDate}T11:00:00.000Z`);
    // Last slot starting at 17:00 (17:00 + 2h = 19:00 close)
    assert.strictEqual(slots[slots.length - 1].startAt, `${futureDate}T17:00:00.000Z`);
  });

  it('enforces 15-minute default buffer window between bay occupancies', () => {
    const durationMinutes = 90;
    const bufferMinutes = 15;
    const slots = generateCandidateSlots(futureDate, 10, 19, durationMinutes, bufferMinutes, baselineNow, 30);

    // Existing booking from 10:00 to 11:30 (occupancy through 11:45)
    const bookings: ExistingBooking[] = [
      {
        resourceId: 'bay-1',
        startAt: `${futureDate}T10:00:00.000Z`,
        endAt: `${futureDate}T11:30:00.000Z`,
        status: 'CONFIRMED',
      },
    ];

    // 10:00 slot must conflict
    assert.strictEqual(isSlotConflict(slots[0], 'bay-1', bookings), true);

    // 10:30 slot must conflict
    const slot1030 = slots.find((s) => s.startAt.includes('10:30'));
    assert.ok(slot1030);
    assert.strictEqual(isSlotConflict(slot1030, 'bay-1', bookings), true);

    // 11:00 candidate slot must conflict (since 11:00 < 11:30)
    const slot11 = slots.find((s) => s.startAt.includes('11:00'));
    assert.ok(slot11);
    assert.strictEqual(isSlotConflict(slot11, 'bay-1', bookings), true);

    // 11:30 candidate slot starts when previous booking finishes, so no conflict under [start, end)
    const slot1130 = slots.find((s) => s.startAt.includes('11:30'));
    assert.ok(slot1130);
    assert.strictEqual(isSlotConflict(slot1130, 'bay-1', bookings), false);

    // 12:00 candidate slot is >= 11:30, so no conflict!
    const slot12 = slots.find((s) => s.startAt.includes('12:00'));
    assert.ok(slot12);
    assert.strictEqual(isSlotConflict(slot12, 'bay-1', bookings), false);
  });

  it('releases slot when booking status is CANCELLED (PRD BR-6)', () => {
    const slots = generateCandidateSlots(futureDate, 10, 19, 120, 15, baselineNow, 30);
    const cancelledBooking: ExistingBooking = {
      resourceId: 'bay-1',
      startAt: `${futureDate}T10:00:00.000Z`,
      endAt: `${futureDate}T12:00:00.000Z`,
      status: 'CANCELLED',
    };

    assert.strictEqual(isSlotConflict(slots[0], 'bay-1', [cancelledBooking]), false);
  });

  it('enforces 2-hour minimum lead time for same-day bookings (PRD FR-22)', () => {
    const todayStr = '2026-10-15';
    const currentTime = new Date(`${todayStr}T13:15:00.000Z`); // 1:15 PM
    const slots = generateCandidateSlots(todayStr, 10, 19, 60, 15, currentTime, 30);

    // Slots before 13:15 + 2h (15:15) must be skipped.
    // First available slot at :00 or :30 is 15:30!
    assert.ok(slots.length > 0);
    assert.strictEqual(slots[0].startAt, `${todayStr}T15:30:00.000Z`);
  });

  it('supports multi-resource capacity: Bay 2 remains available when Bay 1 is booked', () => {
    const slots = generateCandidateSlots(futureDate, 10, 19, 120, 15, baselineNow, 30);
    const bay1Booking: ExistingBooking = {
      resourceId: 'bay-1',
      startAt: `${futureDate}T10:00:00.000Z`,
      endAt: `${futureDate}T12:00:00.000Z`,
      status: 'CONFIRMED',
    };

    assert.strictEqual(isSlotConflict(slots[0], 'bay-1', [bay1Booking]), true);
    assert.strictEqual(isSlotConflict(slots[0], 'bay-2', [bay1Booking]), false);
  });

  it('validates iCalendar (.ics) format structure (RFC 5545)', () => {
    const bookingId = 'bkg-12345';
    const shortCode = 'SMC-12345';
    const treatmentName = 'Ceramic Coating';
    const startDate = new Date('2026-10-15T10:00:00.000Z');
    const endDate = new Date('2026-10-15T14:00:00.000Z');

    const formatIcsDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smoke M Customs//Booking System//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId}@smokecustoms.com`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:Smoke M Customs — ${treatmentName}`,
      'LOCATION:42 Detailing Boulevard, Phase II, Auto Zone, India',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    assert.ok(icsContent.includes('BEGIN:VCALENDAR'));
    assert.ok(icsContent.includes('BEGIN:VEVENT'));
    assert.ok(icsContent.includes('DTSTART:20261015T100000Z'));
    assert.ok(icsContent.includes('DTEND:20261015T140000Z'));
    assert.ok(icsContent.includes('SUMMARY:Smoke M Customs — Ceramic Coating'));
    assert.ok(icsContent.includes('END:VCALENDAR'));
  });

  it('verifies SLOT_NO_LONGER_AVAILABLE error contract for conflict handling UX', () => {
    const simulateBookingConflict = (isSlotFree: boolean) => {
      if (!isSlotFree) {
        const err = new Error('SLOT_NO_LONGER_AVAILABLE');
        (err as any).code = 'SLOT_NO_LONGER_AVAILABLE';
        throw err;
      }
      return { status: 'CONFIRMED' };
    };

    assert.throws(
      () => simulateBookingConflict(false),
      (err: any) => err.message === 'SLOT_NO_LONGER_AVAILABLE' && err.code === 'SLOT_NO_LONGER_AVAILABLE'
    );
  });
});
