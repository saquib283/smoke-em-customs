import React from 'react';
import { quotingService } from '@/modules/quoting';
import { crmService } from '@/modules/crm';
import { catalogueService } from '@/modules/catalogue';
import { bookingService } from '@/modules/booking';
import { QuotesClient } from './QuotesClient';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const [quotes, leads, services, packages, resources, stats] = await Promise.all([
    quotingService.listQuotes(),
    crmService.listLeads(),
    catalogueService.listServices(),
    catalogueService.listPackages(),
    bookingService.listResources(),
    quotingService.getQuoteStats(),
  ]);

  const leadOptions = leads.map((l) => ({
    id: l.id,
    customerName: l.customerName,
    customerId: l.customerId,
    customerPhone: l.customerPhone,
    vehicleText: l.vehicleText,
    vehicleId: l.vehicleId,
  }));

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    startingPrice: s.startingPrice,
  }));

  const packageOptions = packages.map((p) => ({
    id: p.id,
    name: p.name,
    startingPrice: p.startingPrice,
    price: p.price,
  }));

  const resourceOptions = resources
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      name: r.name,
    }));

  return (
    <div>
      <QuotesClient
        initialQuotes={quotes}
        leads={leadOptions}
        services={serviceOptions}
        packages={packageOptions}
        resources={resourceOptions}
        initialStats={stats}
      />
    </div>
  );
}
