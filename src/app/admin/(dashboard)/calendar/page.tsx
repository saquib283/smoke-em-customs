import React from 'react';
import { bookingService } from '@/modules/booking';
import { CalendarClient } from './CalendarClient';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);

  const [resources, blockedDates, bookings] = await Promise.all([
    bookingService.listResources(),
    bookingService.getBlockedDates(currentMonth),
    bookingService.listBookings({
      startDate: `${today}T00:00:00.000Z`,
      endDate: `${today}T23:59:59.999Z`,
    }),
  ]);

  return (
    <div>
      <CalendarClient
        initialResources={resources}
        initialBlockedDates={blockedDates}
        initialBookings={bookings}
      />
    </div>
  );
}
