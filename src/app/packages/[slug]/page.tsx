import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { Icon } from '@/components/common/Icons';
import styles from './packageDetail.module.css';

interface PackagePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await catalogueService.getPackageBySlug(slug);
  if (!pkg) {
    return { title: 'Package Not Found' };
  }
  return {
    title: `${pkg.name} — Smoke M Customs`,
    description: pkg.description,
  };
}

export const revalidate = 60;

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { slug } = await params;
  const pkg = await catalogueService.getPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/packages">Packages</Link>
            <span>/</span>
            <span className={styles.currentCrumb}>{pkg.name}</span>
          </div>

          <div className={styles.titleRow}>
            <div>
              <span className={styles.tag}>ALL-INCLUSIVE PROTECTION SUITE</span>
              <h1 className={styles.title}>{pkg.name}</h1>
            </div>
            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>Package Price</span>
              <span className={styles.priceVal}>
                ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Main Details */}
          <div className={styles.mainContent}>
            {/* Description */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Package Overview</h2>
              <p className={styles.description}>{pkg.description}</p>
              
              <div className={styles.specsRow}>
                <div className={styles.spec}>
                  <span className={styles.specIcon}><Icon.Clock size={18} color="var(--color-gold)" /></span>
                  <div>
                    <h4 className={styles.specTitle}>Workshop Stay</h4>
                    <span className={styles.specDesc}>~{Math.round(pkg.durationMinutes / 60)} Hours</span>
                  </div>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}><Icon.Shield size={18} color="var(--color-gold)" /></span>
                  <div>
                    <h4 className={styles.specTitle}>Warranty</h4>
                    <span className={styles.specDesc}>{pkg.warrantyText ?? 'Comprehensive Coverage'}</span>
                  </div>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}><Icon.Calendar size={18} color="var(--color-gold)" /></span>
                  <div>
                    <h4 className={styles.specTitle}>Validity</h4>
                    <span className={styles.specDesc}>{pkg.validityText ?? 'Year-Round'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Treatments */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Complete Treatment Scope</h2>
              <div className={styles.benefitsGrid}>
                {pkg.benefits.map((benefit, idx) => (
                  <div key={idx} className={styles.benefitItem}>
                    <span className={styles.benefitCheck} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Icon.Check size={12} color="var(--color-gold)" />
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms and Vehicle Care */}
            {pkg.terms && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Preparation & Drop-off Terms</h2>
                <p className={styles.termsText}>{pkg.terms}</p>
                <div className={styles.noteBox}>
                  <strong>Note:</strong> We request removing personal valuables prior to drop-off.
                  A digital vehicle condition report with high-resolution inspection photos
                  is provided at check-in.
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.bookingBox}>
              <h3 className={styles.sidebarTitle}>Reserve This Package</h3>
              <p className={styles.sidebarText}>
                Due to multi-stage curing and preparation requirements, bay slots are scheduled exclusively.
              </p>

              <div className={styles.sidebarPrice}>
                <span className={styles.sidebarPriceTag}>All-Inclusive</span>
                <span className={styles.sidebarPriceNum}>
                  ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                </span>
              </div>

              <div className={styles.sidebarActions}>
                <Link href={`/book?package=${pkg.id}`} className="btn btn-primary btn-full">
                  Book Package Slot
                </Link>
                <Link href={`/quote?package=${pkg.id}`} className="btn btn-secondary btn-full">
                  Get Customized Estimate
                </Link>
                <a
                  href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20enquiring%20about%20the%20${encodeURIComponent(pkg.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waSidebarBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Icon.WhatsApp size={16} /> Inquire on WhatsApp
                </a>
              </div>

              <div className={styles.guarantees}>
                <div className={styles.guarantee} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Lock size={14} color="var(--color-gold)" /> Zero Advance Booking Fee Required
                </div>
                <div className={styles.guarantee} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.FileText size={14} color="var(--color-gold)" /> Official Warranty Certificate Included
                </div>
                <div className={styles.guarantee} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Car size={14} color="var(--color-gold)" /> Free Follow-up Inspection Check
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
