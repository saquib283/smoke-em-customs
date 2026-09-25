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
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>ALL-INCLUSIVE SUITES</span>
          <h1 className={styles.title}>Protection Packages</h1>
          <p className={styles.subtitle}>
            Maximize value and protection. Our packages bundle paint correction, ceramic coatings,
            and self-healing PPF into a unified treatment for complete vehicle defense.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {packages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className={`${styles.card} ${idx === 1 ? styles.featuredCard : ''}`}
            >
              {idx === 1 && <span className={styles.featuredBadge}>MOST POPULAR</span>}
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
                  <Icon.Clock size={14} color="var(--color-gold)" /> ~{Math.round(pkg.durationMinutes / 60)} Hours
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Shield size={14} color="var(--color-gold)" /> Multi-Year Warranty
                </span>
              </div>

              <div className={styles.cardBody}>
                <h4 className={styles.benefitsTitle}>Included In Package:</h4>
                <ul className={styles.benefitsList}>
                  {pkg.benefits.map((b, i) => (
                    <li key={i}>
                      <span className={styles.check} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Icon.Check size={12} color="var(--color-gold)" />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardActions}>
                <Link href={`/book?package=${pkg.id}`} className="btn btn-primary btn-full">
                  Book Package
                </Link>
                <Link href={`/packages/${pkg.slug}`} className="btn btn-secondary btn-full">
                  Package Details & Scope
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Consultation */}
        <div className={styles.consultationBanner}>
          <div>
            <h3 className={styles.consultTitle}>Unsure Which Package Fits Your Car?</h3>
            <p className={styles.consultDesc}>
              Tell us your vehicle make, daily driving conditions, and budget. We provide tailored recommendations.
            </p>
          </div>
          <div className={styles.consultActions}>
            <Link href="/quote" className="btn btn-primary btn-lg">
              Calculate Instant Estimate
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20guidance%20on%20choosing%20a%20package"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Icon.WhatsApp size={18} /> Speak with Master Detailer
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
