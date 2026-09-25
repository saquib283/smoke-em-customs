import React from 'react';
import { Metadata } from 'next';
import { crmService } from '@/modules/crm';
import { catalogueService } from '@/modules/catalogue';
import { NewQuoteClient } from './NewQuoteClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Generate Formal Quotation | Smoke M Customs Studio',
  description: 'Create and issue formal studio quotations and treatment packages.',
};

interface Props {
  searchParams: Promise<{ leadId?: string; customerId?: string }>;
}

export default async function NewQuotePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  const [leads, services, packages] = await Promise.all([
    crmService.listLeads(),
    catalogueService.listServices(),
    catalogueService.listPackages(),
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

  return (
    <NewQuoteClient
      leads={leadOptions}
      services={serviceOptions}
      packages={packageOptions}
      initialLeadId={resolvedSearchParams.leadId}
    />
  );
}
