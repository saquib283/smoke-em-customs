import type { Metadata } from 'next';
import { catalogueService } from '@/modules/catalogue';
import { QuoteForm } from './QuoteForm';
import styles from './quote.module.css';

export const metadata: Metadata = {
  title: 'Instant Quote — Smoke M Customs',
  description:
    'Configure your vehicle requirements and get a transparent, algorithm-calculated instant detailing estimate for PPF, ceramic coating, or restorative correction.',
};

interface QuotePageProps {
  searchParams: Promise<{ service?: string; package?: string }>;
}

export const revalidate = 60;

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { service: preselectedServiceId } = await searchParams;
  const services = await catalogueService.listServices({ enabledOnly: true });

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    startingPrice: s.startingPrice,
  }));

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>TRANSPARENT ALGORITHMIC PRICING</span>
          <h1 className={styles.title}>Car Requirement & Quote</h1>
          <p className={styles.subtitle}>
            Select your vehicle model, paint condition, and protection goals. Receive an instant estimate
            and direct dispatch to our workshop queue.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <QuoteForm
          services={serviceOptions}
          preselectedServiceId={preselectedServiceId}
        />
      </div>
    </main>
  );
}
