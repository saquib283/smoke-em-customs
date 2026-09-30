import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [blockedDates, blockedRanges] = await Promise.all([
      bookingService.listAllBlockedDates(),
      bookingService.listBlockedTimeRanges(),
    ]);

    return NextResponse.json({
      success: true,
      blockedDates,
      blockedRanges,
    });
  } catch (err: any) {
    console.error('Error fetching closures and blocks:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, reason, resourceId, startAt, endAt } = body;

    if (action === 'BLOCK_DATE') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }
      await bookingService.blockDate(date, reason);
      const list = await bookingService.listAllBlockedDates();
      return NextResponse.json({ success: true, message: `Studio closed on ${date}`, blockedDates: list });
    }

    if (action === 'UNBLOCK_DATE') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }
      await bookingService.unblockDate(date);
      const list = await bookingService.listAllBlockedDates();
      return NextResponse.json({ success: true, message: `Studio reopened on ${date}`, blockedDates: list });
    }

    if (action === 'BLOCK_RANGE') {
      if (!startAt || !endAt) {
        return NextResponse.json({ error: 'Start and end time are required' }, { status: 400 });
      }
      const block = await bookingService.createBlockedTimeRange({
        resourceId,
        startAt,
        endAt,
        reason,
      });
      return NextResponse.json({ success: true, message: 'Bay time range blocked', block });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error modifying closures:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const rangeId = searchParams.get('rangeId');

    if (date) {
      await bookingService.unblockDate(date);
      return NextResponse.json({ success: true, message: `Date ${date} unblocked` });
    }

    if (rangeId) {
      await bookingService.deleteBlockedTimeRange(rangeId);
      return NextResponse.json({ success: true, message: 'Time range block removed' });
    }

    return NextResponse.json({ error: 'Missing date or rangeId query parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('Error deleting block:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
