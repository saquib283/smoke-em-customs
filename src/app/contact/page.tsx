import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './ContactForm';
import { Icon } from '@/components/common/Icons';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Atelier Location & Direct Concierge | Smoke M Customs',
  description:
    'Visit our car detailing studio in Industrial Area Phase II. Schedule an appointment, submit an inquiry, or speak with our master detailers on WhatsApp.',
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>STUDIO LOCATION & CONCIERGE</span>
          <h1 className={styles.title}>Connect With The Atelier</h1>
          <p className={styles.subtitle}>
            Have an inquiry regarding bespoke paint protection film, ceramic coatings, or workshop bay reservations? Our technical concierge is at your service.
          </p>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Studio Info Card */}
          <div className={styles.infoCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTag}>WORKSHOP FACILITY</span>
                <h2 className={styles.cardTitle}>Smoke M Studio</h2>
              </div>
              
              <ul className={styles.infoList}>
                <li className={styles.infoItem}>
                  <div className={styles.iconWrapper}>
                    <Icon.MapPin size={18} />
                  </div>
                  <div>
                    <h4 className={styles.itemTitle}>Workshop Address</h4>
                    <p className={styles.itemText}>
                      42 Detailing Boulevard, Phase II, Industrial Auto Zone, India
                    </p>
                    <span className={styles.subtext}>Directly accessible via Expressway Exit 4</span>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.iconWrapper}>
                    <Icon.Clock size={18} />
                  </div>
                  <div>
                    <h4 className={styles.itemTitle}>Operating Hours</h4>
                    <p className={styles.itemText}>
                      Monday – Saturday: 10:00 AM – 7:00 PM
                    </p>
                    <span className={styles.closedText}>Sunday: Closed for deep bay chemical purge & sterilization</span>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.iconWrapper}>
                    <Icon.Phone size={18} />
                  </div>
                  <div>
                    <h4 className={styles.itemTitle}>Direct Phone</h4>
                    <a href="tel:+919876543210" className={styles.link}>
                      +91 98765 43210
                    </a>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.iconWrapper}>
                    <Icon.WhatsApp size={18} />
                  </div>
                  <div>
                    <h4 className={styles.itemTitle}>WhatsApp VIP Support</h4>
                    <a
                      href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20have%20an%20enquiry"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waLink}
                    >
                      Connect on WhatsApp &rarr;
                    </a>
                  </div>
                </li>

                <li className={styles.infoItem}>
                  <div className={styles.iconWrapper}>
                    <Icon.Mail size={18} />
                  </div>
                  <div>
                    <h4 className={styles.itemTitle}>Direct Email</h4>
                    <a href="mailto:care@smokecustoms.com" className={styles.link}>
                      care@smokecustoms.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className={styles.directionsCard}>
              <div className={styles.dirHeader}>
                <Icon.Shield size={16} className={styles.dirIcon} />
                <h4 className={styles.dirTitle}>Pre-Visit Vehicle Guidelines</h4>
              </div>
              <p className={styles.dirText}>
                Vehicles brought for preliminary paint evaluation should ideally arrive dry so micro-marring and clear coat defects can be profiled under our 5000K inspection array. Secure indoor parking is reserved for your appointment.
              </p>
            </div>
          </div>

          {/* Interactive Lead Generation Contact Form */}
          <div className={styles.actionsCol}>
            <ContactForm />

            <div className={styles.secondaryActions}>
              <Link href="/quote" className="btn btn-secondary btn-full btn-sm">
                Get an Algorithmic Quote &rarr;
              </Link>
              <Link href="/book" className="btn btn-secondary btn-full btn-sm">
                Book a Specific Studio Slot &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
