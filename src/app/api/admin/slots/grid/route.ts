import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    const grid = await bookingService.getLiveDaySlotGrid(targetDate);

    return NextResponse.json({
      success: true,
      grid,
    });
  } catch (err: any) {
    console.error('Error fetching live day slot grid:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch slot grid' },
      { status: 500 }
    );
  }
}
