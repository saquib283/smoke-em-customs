import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    const date = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const resources = await bookingService.listResources();
    const blockedDates = month ? await bookingService.getBlockedDates(month) : [];

    // If a specific date is requested, get bookings for that full day
    let startQuery = startDate;
    let endQuery = endDate;

    if (date) {
      startQuery = `${date}T00:00:00.000Z`;
      endQuery = `${date}T23:59:59.999Z`;
    }

    const bookings = await bookingService.listBookings({
      startDate: startQuery || undefined,
      endDate: endQuery || undefined,
    });

    return NextResponse.json({
      success: true,
      resources,
      blockedDates,
      bookings,
    });
  } catch (err: any) {
    console.error('Error fetching calendar data:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, reason } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    if (action === 'BLOCK_DATE') {
      await bookingService.blockDate(date, reason);
      return NextResponse.json({ success: true, message: `Date ${date} blocked successfully` });
    }

    if (action === 'UNBLOCK_DATE') {
      await bookingService.unblockDate(date);
      return NextResponse.json({ success: true, message: `Date ${date} unblocked successfully` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error modifying calendar:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
