import type { Metadata } from 'next';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { Icon } from '@/components/common/Icons';
import styles from './packages.module.css';

export const metadata: Metadata = {
  title: 'Protection Packages — Smoke M Customs',
  description:
    'Comprehensive automotive protection suites: Ceramic Shield Pro, Full PPF Armor, and Signature Detail Packages.',
};

export const revalidate = 60;

export default async function PackagesPage() {
  const packages = await catalogueService.listPackages({ enabledOnly: true });

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>ALL-INCLUSIVE PROTECTION SUITES</span>
          <h1 className={styles.title}>Bespoke Packages</h1>
          <p className={styles.subtitle}>
            Maximize value and comprehensive defense. Our multi-treatment suites bundle paint correction,
            dual-layer ceramic coatings, and self-healing PPF into a unified treatment for complete vehicle preservation.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {packages.map((pkg) => (
            <div key={pkg.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.name}>{pkg.name}</h2>
                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                  </span>
                  <span className={styles.pricePeriod}>/ complete suite</span>
                </div>
              </div>

              <div className={styles.metaRow}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Clock size={13} color="var(--color-accent)" />
                  ~{Math.round(pkg.durationMinutes / 60)} Hours
                </span>
                {pkg.warrantyText && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Shield size={13} color="var(--color-accent)" />
                    {pkg.warrantyText}
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.benefitsTitle}>Included In Package:</div>
                <ul className={styles.benefitsList}>
                  {pkg.benefits.map((b, i) => (
                    <li key={i}>
                      <span className={styles.check}>
                        <Icon.Check size={14} color="var(--color-accent)" />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardActions}>
                <Link href={`/book/${pkg.slug}`} className="btn btn-primary btn-full">
                  Book This Package
                </Link>
                <Link href={`/packages/${pkg.slug}`} className="btn btn-secondary btn-full">
                  View Full Package Scope
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
