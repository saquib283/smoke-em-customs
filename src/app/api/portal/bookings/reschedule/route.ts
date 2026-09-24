import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerSession } from '@/lib/customer-auth';
import { bookingService } from '@/modules/booking';
import { notificationsService } from '@/modules/notifications';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('smc_customer_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: please sign in with mobile OTP' }, { status: 401 });
    }

    const session = verifyCustomerSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, newStartAt } = body;

    if (!bookingId || !newStartAt) {
      return NextResponse.json({ error: 'Missing bookingId or new appointment time' }, { status: 400 });
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: booking does not belong to your account' }, { status: 403 });
    }

    const updated = await bookingService.rescheduleBooking(bookingId, newStartAt);

    // Audit log
    await logAudit({
      action: 'CUSTOMER_RESCHEDULED_BOOKING',
      entityType: 'BOOKING',
      entityId: bookingId,
      before: { startAt: booking.startAt },
      after: { startAt: newStartAt },
    });

    // Notify admin
    await notificationsService.createNotification({
      type: 'NEW_BOOKING_PENDING',
      title: 'Booking Rescheduled by Client',
      body: `${session.name} rescheduled booking #${bookingId.substring(0, 8)} to ${new Date(newStartAt).toLocaleString('en-IN')}`,
      entityType: 'BOOKING',
      entityId: bookingId,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    console.error('Error rescheduling booking via customer portal:', err);
    return NextResponse.json({ error: err.message || 'Failed to reschedule appointment' }, { status: 400 });
  }
}
