import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';
import { db } from '@/prisma/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const booking = await bookingService.getBooking(id);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, booking });
    }

    const status = searchParams.get('status') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const bookings = await bookingService.listBookings({
      status,
      resourceId,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bookingId, reason, newStartAt, newResourceId, status, internalNotes, bookingData } = body;

    if (action === 'CREATE') {
      if (!bookingData || !bookingData.customerId || !bookingData.resourceId || !bookingData.startAt) {
        return NextResponse.json(
          { error: 'Missing customer, bay resource, or start time' },
          { status: 400 }
        );
      }
      const booking = await bookingService.createBooking({
        customerId: bookingData.customerId,
        vehicleId: bookingData.vehicleId ?? undefined,
        leadId: bookingData.leadId ?? undefined,
        quoteId: bookingData.quoteId ?? undefined,
        serviceId: bookingData.serviceId ?? undefined,
        packageId: bookingData.packageId ?? undefined,
        resourceId: bookingData.resourceId,
        startAt: bookingData.startAt,
        durationMinutes: bookingData.durationMinutes || 120,
        source: 'admin',
        priceQuoted: bookingData.priceQuoted ? String(bookingData.priceQuoted) : undefined,
        customerNotes: bookingData.customerNotes ?? undefined,
        internalNotes: bookingData.internalNotes ?? undefined,
      });

      await logAudit({
        action: 'BOOKING_CREATED_BY_ADMIN',
        entityType: 'BOOKING',
        entityId: booking.id,
        after: {
          quoteId: bookingData.quoteId,
          startAt: bookingData.startAt,
          resourceId: bookingData.resourceId,
        },
      });

      return NextResponse.json({ success: true, booking });
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    if (action === 'CONFIRM') {
      const updated = await bookingService.confirmBooking(bookingId);
      await logAudit({
        action: 'BOOKING_CONFIRMED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'CONFIRMED' },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'START_JOB') {
      const updated = await bookingService.startJob(bookingId);
      await logAudit({
        action: 'BOOKING_STARTED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'IN_PROGRESS' },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'COMPLETE_JOB' || action === 'COMPLETE') {
      const updated = await bookingService.completeBooking(bookingId);
      await logAudit({
        action: 'BOOKING_COMPLETED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'COMPLETED' },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'CANCEL') {
      const updated = await bookingService.cancelBooking(bookingId, reason);
      await logAudit({
        action: 'BOOKING_CANCELLED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'CANCELLED', reason },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'RESCHEDULE') {
      if (!newStartAt) {
        return NextResponse.json({ error: 'Missing newStartAt' }, { status: 400 });
      }
      const updated = await bookingService.rescheduleBooking(bookingId, newStartAt);
      await logAudit({
        action: 'BOOKING_RESCHEDULED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'RESCHEDULED', newStartAt },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'NO_SHOW') {
      const updated = await bookingService.markNoShow(bookingId);
      await logAudit({
        action: 'BOOKING_NO_SHOW',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status: 'NO_SHOW' },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'REASSIGN_BAY') {
      if (!newResourceId) {
        return NextResponse.json({ error: 'Missing newResourceId' }, { status: 400 });
      }
      const updated = await bookingService.reassignBay(bookingId, newResourceId);
      await logAudit({
        action: 'BOOKING_BAY_REASSIGNED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { resourceId: newResourceId },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'UPDATE_STATUS') {
      if (!status) {
        return NextResponse.json({ error: 'Missing status' }, { status: 400 });
      }
      await db.orm.public.Booking.where({ id: bookingId }).update({ status });
      const updated = await bookingService.getBooking(bookingId);
      await logAudit({
        action: 'BOOKING_STATUS_UPDATED',
        entityType: 'BOOKING',
        entityId: bookingId,
        after: { status },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    if (action === 'UPDATE_NOTES') {
      await db.orm.public.Booking.where({ id: bookingId }).update({
        internalNotes: internalNotes ?? null,
      });
      const updated = await bookingService.getBooking(bookingId);
      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in admin bookings API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
