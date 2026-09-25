import React from 'react';
import { Metadata } from 'next';
import { crmService } from '@/modules/crm';
import { catalogueService } from '@/modules/catalogue';
import { bookingService } from '@/modules/booking';
import { NewBookingClient } from './NewBookingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Schedule Bay Appointment | Smoke M Customs Studio',
  description: 'Book studio detailing bays, assign technicians, and schedule customer appointments.',
};

interface Props {
  searchParams: Promise<{
    customerId?: string;
    leadId?: string;
    quoteId?: string;
    vehicleId?: string;
    serviceId?: string;
    packageId?: string;
    date?: string;
  }>;
}

export default async function NewBookingPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const [customers, services, packages, resources] = await Promise.all([
    crmService.listCustomers(),
    catalogueService.listServices({ enabledOnly: true }),
    catalogueService.listPackages({ enabledOnly: true }),
    bookingService.listResources(),
  ]);

  const customerOptions = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    vehicleCount: c.vehicleCount,
  }));

  const serviceOptions = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category || 'General',
    startingPrice: s.startingPrice,
    durationMinutes: s.durationMinutes,
  }));

  const packageOptions = packages.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    startingPrice: p.startingPrice,
    price: p.price,
    durationMinutes: p.durationMinutes,
  }));

  const resourceOptions = resources
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: 'Detailing Bay',
    }));

  return (
    <NewBookingClient
      customers={customerOptions}
      services={serviceOptions}
      packages={packageOptions}
      resources={resourceOptions}
      initialCustomerId={resolvedParams.customerId}
      initialLeadId={resolvedParams.leadId}
      initialQuoteId={resolvedParams.quoteId}
      initialVehicleId={resolvedParams.vehicleId}
      initialServiceId={resolvedParams.serviceId}
      initialPackageId={resolvedParams.packageId}
      initialDate={resolvedParams.date}
    />
  );
}
