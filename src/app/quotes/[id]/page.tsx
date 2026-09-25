import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { quotingService } from '@/modules/quoting';
import { PrintableQuoteView } from './PrintableQuoteView';

export const dynamic = 'force-dynamic';

interface QuotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  const { id } = await params;
  const quote = await quotingService.getQuote(id);
  if (!quote) {
    return { title: 'Quotation Not Found | Smoke M Customs' };
  }
  return {
    title: `Quotation #${quote.id.slice(-6).toUpperCase()} — ${quote.customerName} | Smoke M Customs`,
    description: `Formal detailing quotation for ${quote.customerName}. Total: ₹${Number(quote.total).toLocaleString('en-IN')}.`,
  };
}

export default async function QuoteDetailPage({ params }: QuotePageProps) {
  const { id } = await params;
  const quote = await quotingService.getQuote(id);

  if (!quote) {
    notFound();
  }

  return <PrintableQuoteView quote={quote} />;
}
