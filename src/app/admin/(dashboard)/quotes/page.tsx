import React from 'react';
import { quotingService } from '@/modules/quoting';
import { crmService } from '@/modules/crm';
import { catalogueService } from '@/modules/catalogue';
import { QuotesClient } from './QuotesClient';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const [quotes, leads, services] = await Promise.all([
    quotingService.listQuotes(),
    crmService.listLeads(),
    catalogueService.listServices(),
  ]);

  const leadOptions = leads.map((l) => ({
    id: l.id,
    customerName: l.customerName,
    customerId: l.customerId,
    customerPhone: l.customerPhone,
    vehicleText: l.vehicleText,
  }));

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    startingPrice: s.startingPrice,
  }));

  return (
    <div>
      <QuotesClient
        initialQuotes={quotes}
        leads={leadOptions}
        services={serviceOptions}
      />
    </div>
  );
}
