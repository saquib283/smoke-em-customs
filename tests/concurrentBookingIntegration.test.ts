import { describe, it } from 'node:test';
import assert from 'node:assert';

/* ─── Simulated In-Memory Transactional Booking Store ─── */

interface BookingRecord {
  id: string;
  resourceId: string;
  startAt: Date;
  endAt: Date;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
  customerId: string;
}

class SimulatedBookingEngine {
  private bookings: BookingRecord[] = [];
  private bufferMinutes = 15;

  // Mutex simulation for serializing concurrent booking operations on resources
  private locks = new Map<string, Promise<void>>();

  private async acquireLock(resourceId: string): Promise<() => void> {
    while (this.locks.has(resourceId)) {
      await this.locks.get(resourceId);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(resourceId, lockPromise);
    return () => {
      this.locks.delete(resourceId);
      resolveLock();
    };
  }

  async bookSlot(params: {
    bookingId: string;
    resourceId: string;
    startAt: Date;
    durationMinutes: number;
    customerId: string;
  }): Promise<{ success: boolean; booking?: BookingRecord; error?: string }> {
    const unlock = await this.acquireLock(params.resourceId);

    try {
      const startMs = params.startAt.getTime();
      const endMs = startMs + params.durationMinutes * 60 * 1000;
      const bufferMs = this.bufferMinutes * 60 * 1000;

      // Check conflict against all active bookings for this resource
      const hasConflict = this.bookings.some((existing) => {
        if (existing.status === 'CANCELLED') return false;
        if (existing.resourceId !== params.resourceId) return false;

        const existStart = existing.startAt.getTime();
        const existEndWithBuffer = existing.endAt.getTime() + bufferMs;

        // Overlap condition: (StartA < EndB_with_buffer) && (EndA_with_buffer > StartB)
        const newEndWithBuffer = endMs + bufferMs;
        return startMs < existEndWithBuffer && newEndWithBuffer > existStart;
      });

      if (hasConflict) {
        return {
          success: false,
          error: 'SLOT_NO_LONGER_AVAILABLE',
        };
      }

      const newBooking: BookingRecord = {
        id: params.bookingId,
        resourceId: params.resourceId,
        startAt: params.startAt,
        endAt: new Date(endMs),
        status: 'CONFIRMED',
        customerId: params.customerId,
      };

      this.bookings.push(newBooking);
      return { success: true, booking: newBooking };
    } finally {
      unlock();
    }
  }

  cancelBooking(bookingId: string): boolean {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;
    booking.status = 'CANCELLED';
    return true;
  }

  getActiveBookings(): BookingRecord[] {
    return this.bookings.filter((b) => b.status !== 'CANCELLED');
  }
}

describe('Concurrent Booking & Double-Booking Prevention (Architecture §10 & §20)', () => {
  it('resolves concurrent race condition: only one of two simultaneous requests wins the slot', async () => {
    const engine = new SimulatedBookingEngine();
    const slotTime = new Date('2026-10-20T10:00:00.000Z');

    // Fire 2 concurrent booking requests for the exact same slot & resource
    const [resultA, resultB] = await Promise.all([
      engine.bookSlot({
        bookingId: 'book-client-1',
        resourceId: 'bay-1',
        startAt: slotTime,
        durationMinutes: 120,
        customerId: 'customer-1',
      }),
      engine.bookSlot({
        bookingId: 'book-client-2',
        resourceId: 'bay-1',
        startAt: slotTime,
        durationMinutes: 120,
        customerId: 'customer-2',
      }),
    ]);

    // Exactly one should succeed, one should fail with SLOT_NO_LONGER_AVAILABLE
    const succeeded = [resultA, resultB].filter((r) => r.success);
    const failed = [resultA, resultB].filter((r) => !r.success);

    assert.strictEqual(succeeded.length, 1);
    assert.strictEqual(failed.length, 1);
    assert.strictEqual(failed[0].error, 'SLOT_NO_LONGER_AVAILABLE');
    assert.strictEqual(engine.getActiveBookings().length, 1);
  });

  it('rejects booking that starts inside the 15-minute post-booking buffer window', async () => {
    const engine = new SimulatedBookingEngine();
    // Bay 1: 10:00 to 12:00 -> Occupied with 15m buffer until 12:15
    const book1 = await engine.bookSlot({
      bookingId: 'book-prev',
      resourceId: 'bay-1',
      startAt: new Date('2026-10-20T10:00:00.000Z'),
      durationMinutes: 120,
      customerId: 'cust-1',
    });
    assert.strictEqual(book1.success, true);

    // Attempt booking starting at 12:00 (inside buffer) -> FAILS
    const insideBuffer = await engine.bookSlot({
      bookingId: 'book-inside-buffer',
      resourceId: 'bay-1',
      startAt: new Date('2026-10-20T12:00:00.000Z'),
      durationMinutes: 60,
      customerId: 'cust-2',
    });
    assert.strictEqual(insideBuffer.success, false);
    assert.strictEqual(insideBuffer.error, 'SLOT_NO_LONGER_AVAILABLE');

    // Attempt booking starting at 12:15 (exact end of buffer) -> SUCCEEDS
    const afterBuffer = await engine.bookSlot({
      bookingId: 'book-after-buffer',
      resourceId: 'bay-1',
      startAt: new Date('2026-10-20T12:15:00.000Z'),
      durationMinutes: 60,
      customerId: 'cust-3',
    });
    assert.strictEqual(afterBuffer.success, true);
  });

  it('allows simultaneous parallel bookings across different detailing bays', async () => {
    const engine = new SimulatedBookingEngine();
    const commonSlot = new Date('2026-10-20T14:00:00.000Z');

    // Two concurrent requests for different resources
    const [resBay1, resBay2] = await Promise.all([
      engine.bookSlot({
        bookingId: 'book-bay1',
        resourceId: 'bay-1',
        startAt: commonSlot,
        durationMinutes: 180,
        customerId: 'cust-bay1',
      }),
      engine.bookSlot({
        bookingId: 'book-bay2',
        resourceId: 'bay-2',
        startAt: commonSlot,
        durationMinutes: 180,
        customerId: 'cust-bay2',
      }),
    ]);

    assert.strictEqual(resBay1.success, true);
    assert.strictEqual(resBay2.success, true);
    assert.strictEqual(engine.getActiveBookings().length, 2);
  });

  it('immediately frees slot for re-booking when existing booking is cancelled', async () => {
    const engine = new SimulatedBookingEngine();
    const slot = new Date('2026-10-21T09:00:00.000Z');

    // Customer books
    const initial = await engine.bookSlot({
      bookingId: 'book-first',
      resourceId: 'bay-1',
      startAt: slot,
      durationMinutes: 90,
      customerId: 'cust-cancel',
    });
    assert.strictEqual(initial.success, true);

    // Cancel booking
    engine.cancelBooking('book-first');

    // Another customer books same slot -> succeeds
    const replacement = await engine.bookSlot({
      bookingId: 'book-replacement',
      resourceId: 'bay-1',
      startAt: slot,
      durationMinutes: 90,
      customerId: 'cust-new',
    });
    assert.strictEqual(replacement.success, true);
  });
});
