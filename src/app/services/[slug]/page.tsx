import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { JsonLd } from '@/components/public/JsonLd';
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
    description: service.description,
  };
}

export const revalidate = 60;

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await catalogueService.getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

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
    <main className={styles.main}>
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
              <span className={styles.category}>{service.category ?? 'Detailing'}</span>
              <h1 className={styles.title}>{service.name}</h1>
            </div>
            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>Starting From</span>
              <span className={styles.priceVal}>₹{Number(service.startingPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Main Details */}
          <div className={styles.mainContent}>
            {/* Overview */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Overview & Process</h2>
              <p className={styles.description}>{service.description}</p>
              
              <div className={styles.specsRow}>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>⏱️</span>
                  <div>
                    <h4 className={styles.specTitle}>Duration</h4>
                    <span className={styles.specDesc}>~{Math.round(service.durationMinutes / 60)} Hours</span>
                  </div>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>🛡️</span>
                  <div>
                    <h4 className={styles.specTitle}>Warranty</h4>
                    <span className={styles.specDesc}>{service.warrantyText ?? 'Craftsmanship Guarantee'}</span>
                  </div>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>🏛️</span>
                  <div>
                    <h4 className={styles.specTitle}>Bay Environment</h4>
                    <span className={styles.specDesc}>Dust-Free Climate Controlled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Key Protection Benefits</h2>
              <div className={styles.benefitsGrid}>
                {service.benefits.map((benefit, idx) => (
                  <div key={idx} className={styles.benefitItem}>
                    <span className={styles.benefitCheck}>✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Process Standard */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>The Smoke M Protocol</h2>
              <div className={styles.processSteps}>
                <div className={styles.step}>
                  <span className={styles.stepNum}>01</span>
                  <div>
                    <h4 className={styles.stepTitle}>Multi-Stage Chemical Decontamination</h4>
                    <p className={styles.stepDesc}>pH-neutral foam bath, iron fallout removal, and synthetic clay bar treatment to lift embedded particulate from clear coat pores.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>02</span>
                  <div>
                    <h4 className={styles.stepTitle}>Digital Paint Depth Mapping</h4>
                    <p className={styles.stepDesc}>Electronic measuring of clear coat thickness across all steel, aluminum, and composite panels to establish a safe compounding baseline.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>03</span>
                  <div>
                    <h4 className={styles.stepTitle}>Precision Application & Curing</h4>
                    <p className={styles.stepDesc}>Applied under specialized high-CRI inspection lamps in our sealed bay, ensuring bubble-free alignment and complete chemical bond.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>04</span>
                  <div>
                    <h4 className={styles.stepTitle}>Final Concourse Inspection</h4>
                    <p className={styles.stepDesc}>Double-blind quality inspection checklist, handover warranty documentation, and maintenance guidelines provided upon delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <aside className={styles.sidebar}>
            <div className={styles.bookingBox}>
              <h3 className={styles.sidebarTitle}>Reserve Detailing Bay</h3>
              <p className={styles.sidebarText}>
                Secure your slot in advance. Our positive-pressure bays host limited vehicles per day to maintain meticulous quality.
              </p>

              <div className={styles.sidebarPrice}>
                <span className={styles.sidebarPriceTag}>Starting at</span>
                <span className={styles.sidebarPriceNum}>₹{Number(service.startingPrice).toLocaleString('en-IN')}</span>
              </div>

              <div className={styles.sidebarActions}>
                <Link href={`/book?service=${service.id}`} className="btn btn-primary btn-full">
                  Book Slot on Calendar
                </Link>
                <Link href={`/quote?service=${service.id}`} className="btn btn-secondary btn-full">
                  Get Customized Quote
                </Link>
                <a
                  href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20enquiring%20about%20${encodeURIComponent(service.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waSidebarBtn}
                >
                  💬 Inquire on WhatsApp
                </a>
              </div>

              <div className={styles.guarantees}>
                <div className={styles.guarantee}>
                  <span>🔒</span> No Advance Payment Required to Reserve
                </div>
                <div className={styles.guarantee}>
                  <span>📞</span> Confirmation Call Within 2 Hours
                </div>
                <div className={styles.guarantee}>
                  <span>🔄</span> Free Rescheduling Allowed
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
