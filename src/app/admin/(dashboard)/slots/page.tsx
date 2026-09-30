import React from 'react';
import { bookingService } from '@/modules/booking';
import { SlotsClient } from './SlotsClient';

export const dynamic = 'force-dynamic';

export default async function SlotsAdminPage() {
  const today = new Date().toISOString().split('T')[0];

  const [
    initialGrid,
    initialResources,
    initialBusinessHours,
    initialBlockedDates,
    initialBlockedRanges,
  ] = await Promise.all([
    bookingService.getLiveDaySlotGrid(today),
    bookingService.listResources(),
    bookingService.getBusinessHours(),
    bookingService.listAllBlockedDates(),
    bookingService.listBlockedTimeRanges(),
  ]);

  return (
    <SlotsClient
      initialGrid={initialGrid}
      initialResources={initialResources}
      initialBusinessHours={initialBusinessHours}
      initialBlockedDates={initialBlockedDates}
      initialBlockedRanges={initialBlockedRanges}
    />
  );
}
