import type { Metadata } from 'next';
import Link from 'next/link';
import { contentService } from '@/modules/content';
import { Icon } from '@/components/common/Icons';
import styles from './offers.module.css';

export const metadata: Metadata = {
  title: 'Studio Privileges & Offers | Smoke M Customs',
  description:
    'Exclusive detailing promotions and seasonal paint protection specials at Smoke M Customs.',
};

export const revalidate = 60;

export default async function OffersPage() {
  const offers = await contentService.listOffers({ activeOnly: true });

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>STUDIO PRIVILEGES</span>
          <h1 className={styles.title}>Seasonal Allocations</h1>
          <p className={styles.subtitle}>
            Reserved vehicle preservation allocations and curated treatment upgrades currently available at the studio.
          </p>
        </div>
      </header>

      <div className={styles.container}>
        {offers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon.Tag size={28} />
            </div>
            <h2 className={styles.emptyTitle}>No Active Seasonal Offers</h2>
            <p className={styles.emptyText}>
              All current studio slots are booked at standard bespoke rates. Inquire directly or explore our standard services catalogue.
            </p>
            <div className={styles.emptyActions}>
              <Link href="/services" className="btn btn-primary btn-md">
                View Services Catalogue
              </Link>
              <Link href="/quote" className="btn btn-secondary btn-md">
                Request Bespoke Quote
              </Link>
            </div>
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
                <article key={offer.id} className={styles.offerCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardBadge}>EXCLUSIVE PRIVILEGE</span>
                    <span className={styles.validityBadge}>
                      <Icon.Clock size={12} /> Valid Thru {endDate}
                    </span>
                  </div>

                  <h2 className={styles.offerTitle}>{offer.title}</h2>
                  <p className={styles.offerDesc}>{offer.description}</p>

                  <div className={styles.scopeDetails}>
                    {offer.serviceName && (
                      <div className={styles.scopeItem}>
                        <Icon.Shield size={14} className={styles.scopeIcon} />
                        <span>Applies to Service: <strong>{offer.serviceName}</strong></span>
                      </div>
                    )}
                    {offer.packageName && (
                      <div className={styles.scopeItem}>
                        <Icon.Package size={14} className={styles.scopeIcon} />
                        <span>Applies to Package: <strong>{offer.packageName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <Link href="/quote" className="btn btn-primary btn-full">
                      Claim via Bespoke Quote
                    </Link>
                    <a
                      href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20inquiring%20about%20the%20${encodeURIComponent(offer.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waBtn}
                    >
                      <Icon.WhatsApp size={16} /> Inquire on WhatsApp
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
