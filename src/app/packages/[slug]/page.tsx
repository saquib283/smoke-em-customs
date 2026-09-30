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
    description: pkg.description ?? 'All-inclusive vehicle protection and detailing suite.',
  };
}

export const revalidate = 60;

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { slug } = await params;
  const [pkg, allServices] = await Promise.all([
    catalogueService.getPackageBySlug(slug),
    catalogueService.listServices({ enabledOnly: true }),
  ]);

  if (!pkg || !pkg.isEnabled) {
    notFound();
  }

  // Find linked services
  const includedServices = allServices.filter((s) => pkg.serviceIds.includes(s.id));

  return (
    <div className={styles.main}>
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
          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Overview */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Suite Overview</h2>
              <p className={styles.description}>{pkg.description}</p>

              <div className={styles.specsRow}>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Clock size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Workshop Stay</div>
                    <div className={styles.specDesc}>~{Math.round(pkg.durationMinutes / 60)} Hours</div>
                  </div>
                </div>

                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Shield size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Warranty</div>
                    <div className={styles.specDesc}>{pkg.warrantyText ?? 'Comprehensive Coverage'}</div>
                  </div>
                </div>

                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Calendar size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Validity</div>
                    <div className={styles.specDesc}>{pkg.validityText ?? 'Year-Round'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Services */}
            {includedServices.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Included Services in This Suite</h2>
                <div className={styles.includedServicesList}>
                  {includedServices.map((svc) => (
                    <div key={svc.id} className={styles.includedServiceItem}>
                      <div>
                        <div className={styles.svcName}>{svc.name}</div>
                        <div className={styles.svcCategory}>{svc.category ?? 'Detailing Treatment'}</div>
                      </div>
                      <Link href={`/services/${svc.slug}`} className="btn btn-secondary btn-sm">
                        View Service &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits Checklist */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Comprehensive Scope of Work</h2>
              <ul className={styles.benefitsList}>
                {pkg.benefits.map((benefit, idx) => (
                  <li key={idx} className={styles.benefitItem}>
                    <span className={styles.checkIcon}>
                      <Icon.Check size={16} color="var(--color-accent)" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Terms & Drop-off */}
            {pkg.terms && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle} style={{ fontSize: 'var(--text-h3)' }}>
                  Drop-Off & Curing Guidelines
                </h3>
                <p className={styles.description}>{pkg.terms}</p>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.bookingCard}>
              <h3 className={styles.sidebarTitle}>Reserve This Package</h3>
              <p className={styles.sidebarDesc}>
                Lock in your workshop slot directly for this complete treatment suite.
              </p>

              <div className={styles.sidebarPriceBox}>
                <div className={styles.sidebarPriceTag}>All-Inclusive Suite Price</div>
                <div className={styles.sidebarPriceVal}>
                  ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                </div>
              </div>

              <div className={styles.sidebarActions}>
                <Link href={`/book/${pkg.slug}`} className="btn btn-primary btn-full">
                  Book This Package
                </Link>
                <Link href="/quote" className="btn btn-secondary btn-full">
                  Get Customized Estimate
                </Link>
                <a
                  href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20enquiring%20about%20the%20${encodeURIComponent(pkg.name)}%20package`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sidebarWaBtn}
                >
                  <Icon.WhatsApp size={16} /> Ask Questions on WhatsApp
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 8 }}>
                <span>&bull; Dedicated cleanroom bay allocation</span>
                <span>&bull; Full manufacturer warranty certification</span>
                <span>&bull; Complimentary 6-month inspection</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
