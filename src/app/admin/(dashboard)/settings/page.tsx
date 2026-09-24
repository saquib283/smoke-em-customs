import React from 'react';
import { bookingService } from '@/modules/booking';
import { getBookingRules } from '@/lib/studio-config';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [resources, hours, blockedDates] = await Promise.all([
    bookingService.listResources(),
    bookingService.getBusinessHours(),
    bookingService.listAllBlockedDates(),
  ]);

  const bookingRules = getBookingRules();

  return (
    <div>
      <SettingsClient
        initialResources={resources}
        initialHours={hours}
        initialBlockedDates={blockedDates}
        initialBookingRules={bookingRules}
      />
    </div>
  );
}
