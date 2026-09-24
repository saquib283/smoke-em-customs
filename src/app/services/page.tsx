import type { Metadata } from 'next';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import styles from './services.module.css';

export const metadata: Metadata = {
  title: 'Services Catalogue — Car Detailing & PPF',
  description:
    'Explore our professional car detailing services: Ceramic Coating, Paint Protection Film (PPF), Paint Correction, and Interior Spa Detailing.',
};

export const revalidate = 60;

export default async function ServicesPage() {
  const services = await catalogueService.listServices({ enabledOnly: true });

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  ) as string[];

  return (
    <main className={styles.main}>
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
        {/* Services List */}
        <div className={styles.grid}>
          {services.map((service) => (
            <div key={service.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.category}>{service.category ?? 'Detailing'}</span>
                <span className={styles.price}>
                  From ₹{Number(service.startingPrice).toLocaleString('en-IN')}
                </span>
              </div>
              <h2 className={styles.name}>{service.name}</h2>
              <div className={styles.metaRow}>
                <span>⏱️ Duration: ~{Math.round(service.durationMinutes / 60)} Hours</span>
                <span>🛡️ Professional Warranty</span>
              </div>
              <p className={styles.desc}>
                Engineered for maximum optical clarity, hydrophobic self-cleaning properties,
                and long-term surface resilience.
              </p>
              <div className={styles.cardActions}>
                <Link href={`/services/${service.slug}`} className="btn btn-secondary btn-full">
                  Full Details & Warranty
                </Link>
                <Link href={`/book?service=${service.id}`} className="btn btn-primary btn-full">
                  Book Slot
                </Link>
              </div>
            </div>
          ))}
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
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20have%20a%20custom%20enquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              💬 WhatsApp Chat
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
