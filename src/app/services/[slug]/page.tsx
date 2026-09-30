import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { JsonLd } from '@/components/public/JsonLd';
import { Icon } from '@/components/common/Icons';
import styles from './serviceDetail.module.css';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await catalogueService.getServiceBySlug(slug);
  if (!service) {
    return { title: 'Service Not Found' };
  }
  return {
    title: `${service.name} — Smoke M Customs`,
    description: service.description ?? 'Bespoke vehicle protection and detailing treatment.',
  };
}

export const revalidate = 60;

const SERVICE_IMAGES: Record<string, string> = {
  'ceramic-coating': '/ceramic-detail.jpg',
  'paint-protection-film': '/ppf-install.jpg',
  'interior-detailing': '/ppf-craft.jpg',
  'exterior-detailing': '/ceramic-macro.jpg',
  'paint-correction': '/hero-luxury-dark.jpg',
  'windshield-coating': '/ceramic-detail.jpg',
};

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const [service, allPackages] = await Promise.all([
    catalogueService.getServiceBySlug(slug),
    catalogueService.listPackages({ enabledOnly: true }),
  ]);

  if (!service || !service.isEnabled) {
    notFound();
  }

  const relatedPackages = allPackages.filter((pkg) => pkg.serviceIds.includes(service.id));
  const heroImg = service.imageUrl || SERVICE_IMAGES[service.slug] || '/ceramic-detail.jpg';

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'AutoBodyShop',
      name: 'Smoke M Customs',
      url: 'https://smokecustoms.com',
      telephone: '+919876543210',
    },
    offers: {
      '@type': 'Offer',
      price: service.startingPrice,
      priceCurrency: 'INR',
      availability: service.isBookable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className={styles.main}>
      <JsonLd data={serviceSchema} />

      {/* ── Breadcrumb & Header ── */}
      <div className={styles.header}>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/services">Services</Link>
            <span>/</span>
            <span className={styles.currentCrumb}>{service.name}</span>
          </div>

          <div className={styles.titleRow}>
            <div>
              <span className={styles.category}>{service.category ?? 'Detailing Treatment'}</span>
              <h1 className={styles.title}>{service.name}</h1>
            </div>
            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>Starting From</span>
              <span className={styles.priceVal}>
                ₹{Number(service.startingPrice).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Main Details */}
          <div className={styles.mainContent}>
            {/* Treatment Hero Photography */}
            <div className={styles.heroImageWrap}>
              <img
                src={heroImg}
                alt={service.name}
                className={styles.heroImg}
              />
            </div>

            {/* Overview */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Overview & Engineering Scope</h2>
              <p className={styles.description}>
                {service.description ||
                  'Precision-engineered detailing application using imported chemical compounds and certified cleanroom procedures.'}
              </p>

              <div className={styles.specsRow}>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Clock size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Duration</div>
                    <div className={styles.specDesc}>~{Math.round(service.durationMinutes / 60)} Hours</div>
                  </div>
                </div>

                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Shield size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Warranty</div>
                    <div className={styles.specDesc}>{service.warrantyText ?? 'Certified Guarantee'}</div>
                  </div>
                </div>

                <div className={styles.spec}>
                  <div className={styles.specIcon}>
                    <Icon.Check size={18} />
                  </div>
                  <div>
                    <div className={styles.specTitle}>Facility Bay</div>
                    <div className={styles.specDesc}>Climate Controlled</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            {service.benefits.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Protection & Restorative Benefits</h2>
                <ul className={styles.benefitsList}>
                  {service.benefits.map((benefit, idx) => (
                    <li key={idx} className={styles.benefitItem}>
                      <span className={styles.checkIcon}>
                        <Icon.Check size={16} color="var(--color-accent)" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* The Smoke M Protocol */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>The Smoke M Standard Protocol</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 4, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    01. Multi-Stage Chemical Decontamination
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
                    pH-neutral foam bath, iron fallout dissolution, and synthetic clay bar purification to extract embedded airborne particulate.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 4, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    02. Micron-Level Paint Depth Profiling
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
                    Electronic gauge mapping across every panel to establish safe clear coat limits prior to machine compounding.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 4, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    03. Cleanroom Application & Curing
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
                    Applied under 98 CRI high-definition optical inspection lamps in our dust-isolated cleanroom bays.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 4, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    04. Handover & Warranty Certification
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: '1.5' }}>
                    Concourse handover inspection, digital thickness certificates, and aftercare maintenance guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.bookingCard}>
              <h3 className={styles.sidebarTitle}>Reserve Studio Bay</h3>
              <p className={styles.sidebarDesc}>
                Positive-pressure bays operate on strict daily allocation to guarantee unhurried craftsmanship.
              </p>

              <div style={{ padding: 'var(--space-3) 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Starting Price
                </span>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  ₹{Number(service.startingPrice).toLocaleString('en-IN')}
                </div>
              </div>

              <div className={styles.sidebarActions}>
                <Link href={`/book/${service.slug}`} className="btn btn-primary btn-full">
                  Book Slot on Calendar
                </Link>
                <Link href={`/quote?service=${service.slug}`} className="btn btn-secondary btn-full">
                  Get a Free Quote for This Service
                </Link>
                <a
                  href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20enquiring%20about%20${encodeURIComponent(service.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sidebarWaBtn}
                >
                  <Icon.WhatsApp size={16} /> WhatsApp Consultation
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 8 }}>
                <span>&bull; No advance deposit required to reserve date</span>
                <span>&bull; Free date rescheduling available</span>
                <span>&bull; Verification call within 2 hours</span>
              </div>
            </div>

            {/* Related Packages */}
            {relatedPackages.length > 0 && (
              <div className={styles.bookingCard}>
                <h4 className={styles.sidebarTitle} style={{ fontSize: 'var(--text-base)' }}>
                  Bundled in Protection Suites
                </h4>
                <p className={styles.sidebarDesc}>
                  This service is also included in our all-inclusive comprehensive packages:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {relatedPackages.map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/packages/${pkg.slug}`}
                      className={styles.packageCardItem}
                    >
                      <div className={styles.pkgName}>{pkg.name}</div>
                      <div className={styles.pkgPrice}>
                        ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
