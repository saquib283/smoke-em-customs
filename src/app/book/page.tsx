import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { catalogueService } from '@/modules/catalogue';
import { BookPickerClient } from './BookPickerClient';
import styles from './booking.module.css';

import { quotingService } from '@/modules/quoting';

export const metadata: Metadata = {
  title: 'Choose Detailing Treatment — Smoke M Customs',
  description:
    'Select a professional car detailing treatment or curated package suite to view available bays and reserve your slot.',
};

interface BookPageProps {
  searchParams: Promise<{ service?: string; package?: string; quoteId?: string }>;
}

export const revalidate = 60;

export default async function BookPage({ searchParams }: BookPageProps) {
  const { service: queryService, package: queryPackage, quoteId: queryQuoteId } = await searchParams;

  if (queryQuoteId) {
    try {
      const quote = await quotingService.getQuote(queryQuoteId);
      if (quote && quote.items.length > 0) {
        const firstItem = quote.items[0];
        if (firstItem.serviceId) {
          const s = await catalogueService.getServiceById(firstItem.serviceId);
          if (s) {
            redirect(`/book/${s.slug}?quoteId=${queryQuoteId}`);
          }
        } else if (firstItem.packageId) {
          const p = await catalogueService.getPackageById(firstItem.packageId);
          if (p) {
            redirect(`/book/${p.slug}?quoteId=${queryQuoteId}`);
          }
        }
      }
    } catch {
      // Fallback
    }

    const availableServices = await catalogueService.listServices({ enabledOnly: true });
    if (availableServices.length > 0) {
      redirect(`/book/${availableServices[0].slug}?quoteId=${queryQuoteId}`);
    }
  }

  if (queryService) {
    let target = queryService;
    const s = (await catalogueService.getServiceById(queryService)) || (await catalogueService.getServiceBySlug(queryService));
    if (s) target = s.slug;
    redirect(`/book/${target}`);
  }
  if (queryPackage) {
    let target = queryPackage;
    const p = (await catalogueService.getPackageById(queryPackage)) || (await catalogueService.getPackageBySlug(queryPackage));
    if (p) target = p.slug;
    redirect(`/book/${target}`);
  }

  const [services, packages] = await Promise.all([
    catalogueService.listServices({ enabledOnly: true }),
    catalogueService.listPackages({ enabledOnly: true }),
  ]);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>REAL-TIME BAY SCHEDULING</span>
          <h1 className={styles.title}>Book Detailing Bay</h1>
          <p className={styles.subtitle}>
            Select your preferred treatment, inspect available bay hours, and reserve your slot with zero upfront deposit.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: 'var(--space-10) auto 0', padding: '0 var(--space-4)' }}>
        <BookPickerClient services={services} packages={packages} />
      </div>
    </main>
  );
}
