import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hours = await bookingService.getBusinessHours();
    return NextResponse.json({ success: true, hours });
  } catch (err: any) {
    console.error('Error fetching business hours:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dayOfWeek, startTime, endTime, isClosed } = body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Valid day of week (0-6) is required' }, { status: 400 });
    }

    if (!isClosed && (!startTime || !endTime)) {
      return NextResponse.json({ error: 'Start and end time are required' }, { status: 400 });
    }

    const hours = await bookingService.updateBusinessHours(
      dayOfWeek,
      startTime || '10:00',
      endTime || '19:00',
      !!isClosed
    );

    return NextResponse.json({
      success: true,
      message: 'Operating hours updated successfully',
      hours,
    });
  } catch (err: any) {
    console.error('Error updating business hours:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
