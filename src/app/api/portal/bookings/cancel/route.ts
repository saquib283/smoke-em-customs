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
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const booking = await bookingService.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: booking does not belong to your account' }, { status: 403 });
    }

    const cancellationReason = reason?.trim() || 'Cancelled by client via self-service portal';
    const updated = await bookingService.cancelBooking(bookingId, cancellationReason);

    // Audit log
    await logAudit({
      action: 'CUSTOMER_CANCELLED_BOOKING',
      entityType: 'BOOKING',
      entityId: bookingId,
      before: { status: booking.status },
      after: { status: 'CANCELLED', reason: cancellationReason },
    });

    // Notify admin
    await notificationsService.createNotification({
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled by Client',
      body: `${session.name} cancelled booking #${bookingId.substring(0, 8)}. Reason: ${cancellationReason}`,
      entityType: 'BOOKING',
      entityId: bookingId,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    console.error('Error cancelling booking via customer portal:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel appointment' }, { status: 400 });
  }
}
