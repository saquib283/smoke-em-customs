import React from 'react';
import { bookingService } from '@/modules/booking';
import { BookingsClient } from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const bookings = await bookingService.listBookings();

  return (
    <div>
      <BookingsClient initialBookings={bookings} />
    </div>
  );
}
