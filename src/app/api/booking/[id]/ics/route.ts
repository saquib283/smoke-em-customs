import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/modules/booking';

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await bookingService.getBooking(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const shortCode = `SMC-${booking.id.substring(0, 6).toUpperCase()}`;
    const treatmentName =
      booking.serviceName || booking.packageName || 'Detailing Service';

    const startDate = new Date(booking.startAt);
    const endDate = new Date(booking.endAt);
    const now = new Date();

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smoke M Customs//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id}@smokecustoms.com`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:Smoke M Customs — ${treatmentName}`,
      `DESCRIPTION:Appointment Reference: ${shortCode}\\nClient: ${booking.customerName}\\nVehicle: ${booking.vehicleText || 'Customer Vehicle'}\\nAssigned Bay: ${booking.resourceName}\\nEstimated Amount: ${booking.priceQuoted ? `₹${Number(booking.priceQuoted).toLocaleString('en-IN')}` : 'To be confirmed'}\\nLocation: 42 Detailing Boulevard, Phase II, Auto Zone, India.`,
      'LOCATION:42 Detailing Boulevard, Phase II, Auto Zone, India',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Detailing Bay Appointment with Smoke M Customs in 2 hours',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="smokecustoms-booking-${shortCode}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error generating .ics calendar file:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
