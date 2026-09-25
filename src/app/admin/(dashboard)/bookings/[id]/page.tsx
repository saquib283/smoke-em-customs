import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bookingService } from '@/modules/booking';
import { notificationsService } from '@/modules/notifications';
import { listAuditLogs } from '@/lib/audit';
import { BookingDetailClient } from './BookingDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const booking = await bookingService.getBooking(id);
  if (!booking) return { title: 'Booking Not Found | Smoke M Customs' };

  return {
    title: `Booking #${booking.id.slice(-6).toUpperCase()} — ${booking.customerName} | Smoke M Customs`,
    description: `Studio detailing dossier for ${booking.customerName}, allocated to ${booking.resourceName}.`,
  };
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const booking = await bookingService.getBooking(id);

  if (!booking) {
    notFound();
  }

  const [communications, auditLogs] = await Promise.all([
    notificationsService.listCommunications({
      customerId: booking.customerId,
    }),
    listAuditLogs({
      entityType: 'BOOKING',
      entityId: booking.id,
      limit: 20,
    }),
  ]);

  return (
    <BookingDetailClient
      initialBooking={booking}
      initialCommunications={communications}
      initialAuditLogs={auditLogs}
    />
  );
}
