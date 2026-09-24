import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { catalogueService } from '@/modules/catalogue';
import { BookPickerClient } from './BookPickerClient';
import styles from './booking.module.css';

export const metadata: Metadata = {
  title: 'Choose Detailing Treatment — Smoke M Customs',
  description:
    'Select a professional car detailing treatment or curated package suite to view available bays and reserve your slot.',
};

interface BookPageProps {
  searchParams: Promise<{ service?: string; package?: string }>;
}

export const revalidate = 60;

export default async function BookPage({ searchParams }: BookPageProps) {
  const { service: queryService, package: queryPackage } = await searchParams;

  if (queryService) {
    redirect(`/book/${queryService}`);
  }
  if (queryPackage) {
    redirect(`/book/${queryPackage}`);
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
