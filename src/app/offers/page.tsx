import type { Metadata } from 'next';
import Link from 'next/link';
import { contentService } from '@/modules/content';
import styles from './offers.module.css';

export const metadata: Metadata = {
  title: 'Current Offers & Promotions — Smoke M Customs',
  description:
    'Exclusive detailing promotions and seasonal paint protection specials at Smoke M Customs.',
};

export const revalidate = 60;

export default async function OffersPage() {
  const offers = await contentService.listOffers({ activeOnly: true });

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>LIMITED TIME PRIVILEGES</span>
          <h1 className={styles.title}>Exclusive Studio Offers</h1>
          <p className={styles.subtitle}>
            Take advantage of seasonal preservation promotions and bundled treatment upgrades.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {offers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No active promotional specials at this time. Standard studio pricing applies.</p>
            <Link href="/services" className="btn btn-primary btn-md">
              View Services Catalogue
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {offers.map((offer) => {
              const endDate = new Date(offer.endAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={offer.id} className={styles.offerCard}>
                  <div className={styles.cardBadge}>LIMITED TIME DEAL</div>
                  <h2 className={styles.offerTitle}>{offer.title}</h2>
                  <p className={styles.offerDesc}>{offer.description}</p>

                  <div className={styles.validityRow}>
                    <span>⏳ Valid Until: <strong>{endDate}</strong></span>
                    {offer.serviceName && <span>📌 Applies to: {offer.serviceName}</span>}
                    {offer.packageName && <span>📦 Applies to: {offer.packageName}</span>}
                  </div>

                  <div className={styles.actions}>
                    <Link href="/quote" className="btn btn-primary btn-full">
                      Claim via Instant Quote
                    </Link>
                    <a
                      href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20want%20to%20claim%20the%20${encodeURIComponent(offer.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waBtn}
                    >
                      💬 Claim on WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
