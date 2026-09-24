import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceOrPackageId =
      searchParams.get('serviceId') ||
      searchParams.get('packageId') ||
      searchParams.get('service') ||
      searchParams.get('package') ||
      undefined;

    if (!date) {
      return NextResponse.json(
        { error: 'Missing date parameter (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const slots = await bookingService.getAvailableSlots(date, serviceOrPackageId);

    return NextResponse.json({
      date,
      slots,
      totalAvailable: slots.length,
    });
  } catch (err: any) {
    console.error('Error fetching availability:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
