import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId, startAt, endAt, reason } = body;

    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: 'Start and end time are required to lock a slot.' },
        { status: 400 }
      );
    }

    const block = await bookingService.createBlockedTimeRange({
      resourceId: resourceId || undefined,
      startAt,
      endAt,
      reason: reason || 'Admin Bay Hold',
    });

    return NextResponse.json({
      success: true,
      message: 'Slot locked successfully',
      block,
    });
  } catch (err: any) {
    console.error('Error locking bay slot:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to lock bay slot' },
      { status: 500 }
    );
  }
}
