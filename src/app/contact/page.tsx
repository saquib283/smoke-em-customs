import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './ContactForm';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact Studio & Location — Smoke M Customs',
  description:
    'Visit our car detailing studio in Industrial Area Phase II. Schedule an appointment, submit an inquiry, or speak with our master detailers on WhatsApp.',
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>GET IN TOUCH</span>
          <h1 className={styles.title}>Studio Location & Contact</h1>
          <p className={styles.subtitle}>
            Have an inquiry about paint protection film, ceramic coating, or need directions to our workshop?
            Our detailing concierge is at your service.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Studio Info Card */}
          <div className={styles.infoCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Detailing Facility</h2>
              
              <ul className={styles.infoList}>
                <li className={styles.infoItem}>
                  <span className={styles.icon}>📍</span>
                  <div>
                    <h4 className={styles.itemTitle}>Workshop Address</h4>
                    <p className={styles.itemText}>
                      42 Detailing Boulevard, Phase II, Industrial Auto Zone, India
                    </p>
                    <span className={styles.subtext}>*Easily accessible via Expressway Exit 4</span>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <span className={styles.icon}>⏰</span>
                  <div>
                    <h4 className={styles.itemTitle}>Operating Hours</h4>
                    <p className={styles.itemText}>
                      Monday – Saturday: 10:00 AM – 7:00 PM<br />
                      <strong className={styles.closedText}>Sunday: Closed for deep bay chemical purge</strong>
                    </p>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <span className={styles.icon}>📞</span>
                  <div>
                    <h4 className={styles.itemTitle}>Direct Phone</h4>
                    <a href="tel:+919876543210" className={styles.link}>
                      +91 98765 43210
                    </a>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <span className={styles.icon}>💬</span>
                  <div>
                    <h4 className={styles.itemTitle}>WhatsApp Support (Fastest Response)</h4>
                    <a
                      href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20have%20an%20enquiry"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waLink}
                    >
                      Click to Chat on WhatsApp &rarr;
                    </a>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <span className={styles.icon}>✉️</span>
                  <div>
                    <h4 className={styles.itemTitle}>Email Concierge</h4>
                    <a href="mailto:care@smokecustoms.com" className={styles.link}>
                      care@smokecustoms.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className={styles.directionsCard} style={{ marginTop: 'var(--space-4)' }}>
              <h4 className={styles.dirTitle}>Visiting Guidelines</h4>
              <p className={styles.dirText}>
                Vehicles brought for evaluation should ideally be in dry condition so paint flaws
                and swirl marks can be inspected under our 5000K lamps. Free secure parking is available on site.
              </p>
            </div>
          </div>

          {/* Interactive Lead Generation Contact Form */}
          <div className={styles.actionsCol}>
            <ContactForm />

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
              <Link href="/quote" className="btn btn-secondary btn-full btn-sm">
                Need an Instant Quote?
              </Link>
              <Link href="/book" className="btn btn-outline btn-full btn-sm">
                Reserve Bay Slot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
