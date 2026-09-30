import type { Metadata } from 'next';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { Icon } from '@/components/common/Icons';
import styles from './services.module.css';

export const metadata: Metadata = {
  title: 'Services Catalogue — Smoke M Customs',
  description:
    'Explore our professional car detailing and protection services: 9H Ceramic Coating, TPU Paint Protection Film (PPF), Multi-Stage Paint Correction, and Interior Sanitization.',
};

export const revalidate = 60;

const SERVICE_IMAGES: Record<string, string> = {
  'ceramic-coating': '/ceramic-detail.jpg',
  'paint-protection-film': '/ppf-install.jpg',
  'interior-detailing': '/ppf-craft.jpg',
  'exterior-detailing': '/ceramic-macro.jpg',
  'paint-correction': '/hero-luxury-dark.jpg',
  'windshield-coating': '/ceramic-detail.jpg',
};

export default async function ServicesPage() {
  const services = await catalogueService.listServices({ enabledOnly: true });

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>BESPOKE VEHICLE PRESERVATION</span>
          <h1 className={styles.title}>Services Catalogue</h1>
          <p className={styles.subtitle}>
            From microscopic swirl removal to military-grade TPU self-healing films,
            our services are engineered to restore, enhance, and protect your vehicle.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Services Grid */}
        <div className={styles.grid}>
          {services.map((service) => {
            const imageSrc = service.imageUrl || SERVICE_IMAGES[service.slug] || '/ceramic-detail.jpg';
            return (
              <div key={service.id} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <img
                    src={imageSrc}
                    alt={service.name}
                    className={styles.cardImg}
                    loading="lazy"
                  />
                  <span className={styles.cardTopBadge}>
                    {service.category ?? 'Detailing'}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h2 className={styles.name}>{service.name}</h2>

                  <div className={styles.metaRow}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon.Clock size={13} color="var(--color-accent)" />
                      ~{Math.round(service.durationMinutes / 60)} Hours
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon.Shield size={13} color="var(--color-accent)" />
                      {service.warrantyText ? service.warrantyText.split(' ')[0] + ' Warranty' : 'Certified Standard'}
                    </span>
                  </div>

                  <p className={styles.desc}>
                    {service.description ||
                      'Engineered for maximum optical clarity, hydrophobic self-cleaning properties, and long-term surface resilience.'}
                  </p>

                  <div className={styles.cardPriceRow}>
                    <span className={styles.priceLabel}>Starting Price</span>
                    <span className={styles.priceVal}>
                      ₹{Number(service.startingPrice).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={`/services/${service.slug}`} className="btn btn-secondary btn-full">
                      View Scope
                    </Link>
                    <Link href={`/book/${service.slug}`} className="btn btn-primary btn-full">
                      Book Slot
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Quote Callout */}
        <div className={styles.quoteCallout}>
          <div>
            <h3 className={styles.calloutTitle}>Looking for a Custom Package or Multiple Vehicles?</h3>
            <p className={styles.calloutText}>
              Share your vehicle condition and requirements. We provide instant estimated pricing and custom bespoke packages.
            </p>
          </div>
          <div className={styles.calloutActions}>
            <Link href="/quote" className="btn btn-primary btn-lg">
              Get an Instant Quote
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20have%20multiple%20vehicles%20for%20detailing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
