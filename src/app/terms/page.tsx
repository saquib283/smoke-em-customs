import type { Metadata } from 'next';
import styles from '../privacy/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and Conditions for Smoke M Customs. Studio booking terms, vehicle handover protocols, warranties, and cancellation policies.',
};

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>TERMS & CONDITIONS</span>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.subtitle}>Last updated: September 2024</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Detailing Bay Bookings & Appointments</h2>
            <p className={styles.paragraph}>
              All bay appointments booked via our online platform are subject to availability and studio confirmation.
              A booking made online is marked as <strong>Pending Confirmation</strong> until our studio team verifies the bay schedule and reaches out to the client.
            </p>
            <p className={styles.paragraph}>
              We request customers to arrive within 15 minutes of their scheduled bay slot to ensure adequate treatment time.
              Delays exceeding 45 minutes may require rescheduling to avoid conflict with subsequent vehicle bays.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Vehicle Inspection & Handover Protocols</h2>
            <p className={styles.paragraph}>
              Prior to initiating any service (including wash, decontamination, paint correction, or PPF application), a joint pre-service digital inspection is conducted with the client.
              Existing rock chips, paint thin spots, deep dents, or aftermarket repaints will be documented on the digital job card.
            </p>
            <ul className={styles.list}>
              <li>Clients must remove all personal belongings, cash, and high-value accessories before handing over the vehicle keys.</li>
              <li>Smoke M Customs is not liable for personal items left unattended inside the vehicle.</li>
              <li>Vehicles must possess valid registration and third-party insurance coverage during their stay in our studio premises.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Quotes & Preliminary Estimates</h2>
            <p className={styles.paragraph}>
              Algorithmic estimates provided on the website are non-binding preliminary calculations based on typical vehicle sizes and standard paint hardness.
              The final binding price is determined following in-person paint depth gauge readings and defect inspection at our climate bay.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Warranty & Aftercare Guidelines</h2>
            <p className={styles.paragraph}>
              Warranties for Ceramic Coatings and Paint Protection Films (PPF) cover bubbling, peeling, cracking, or premature gloss degradation when accompanied by documented annual maintenance inspections:
            </p>
            <ul className={styles.list}>
              <li>Warranties do not cover damage resulting from vehicular accidents, stone impact tears exceeding film tensile limits, vandalism, or harsh chemical/acid contamination.</li>
              <li>Automated drive-through brush car washes void ceramic and PPF surface warranties. We recommend two-bucket wash methods with pH-neutral shampoos.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Rescheduling & Cancellation</h2>
            <p className={styles.paragraph}>
              Cancellations or slot reschedules must be requested at least 24 hours prior to the booked time slot via telephone or WhatsApp.
              Refunds for any advance deposit fees follow the studio deposit policy established during formal quote acceptance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
