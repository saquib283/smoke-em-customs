import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blockId } = body;

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required to unlock a slot.' },
        { status: 400 }
      );
    }

    await bookingService.deleteBlockedTimeRange(blockId);

    return NextResponse.json({
      success: true,
      message: 'Slot unlocked successfully',
    });
  } catch (err: any) {
    console.error('Error unlocking bay slot:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to unlock bay slot' },
      { status: 500 }
    );
  }
}
