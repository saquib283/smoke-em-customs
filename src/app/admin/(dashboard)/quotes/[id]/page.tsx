import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { quotingService } from '@/modules/quoting';
import { bookingService } from '@/modules/booking';
import { catalogueService } from '@/modules/catalogue';
import { QuoteDetailClient } from './QuoteDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quote = await quotingService.getQuote(id);
  if (!quote) return { title: 'Quotation Not Found | Smoke M Customs' };

  return {
    title: `Quotation #${quote.id.slice(-6).toUpperCase()} — ${quote.customerName} | Smoke M Customs`,
    description: `Formal studio quotation proposal for ${quote.customerName}.`,
  };
}

export default async function AdminQuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const quote = await quotingService.getQuote(id);

  if (!quote) {
    notFound();
  }

  const [resources, services, packages] = await Promise.all([
    bookingService.listResources(),
    catalogueService.listServices(),
    catalogueService.listPackages(),
  ]);

  const resourceOptions = resources
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      name: r.name,
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
    <QuoteDetailClient
      initialQuote={quote}
      resources={resourceOptions}
      services={serviceOptions}
      packages={packageOptions}
    />
  );
}
