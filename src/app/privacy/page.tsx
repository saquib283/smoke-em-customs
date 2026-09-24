import type { Metadata } from 'next';
import styles from './legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Smoke M Customs. Learn how we handle customer vehicle details, contact data, and service records.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>LEGAL & COMPLIANCE</span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>Last updated: September 2024</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
            <p className={styles.paragraph}>
              At Smoke M Customs, we respect your privacy and are committed to safeguarding your personal information.
              When you interact with our website, request a quote, or book an appointment, we may collect the following details:
            </p>
            <ul className={styles.list}>
              <li><strong>Contact Information:</strong> Full name, phone number, and optional email address.</li>
              <li><strong>Vehicle Specifications:</strong> Make, model, manufacturing year, vehicle type, and current paint condition.</li>
              <li><strong>Visual Documentation:</strong> Customer-uploaded photographs of paint defects, panels, or swirl marks to assist in preliminary estimations.</li>
              <li><strong>Appointment Data:</strong> Selected detailing bay dates, service preferences, and special customer requests.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. How We Use Your Data</h2>
            <p className={styles.paragraph}>
              We process your data strictly for legitimate operational purposes:
            </p>
            <ul className={styles.list}>
              <li>Generating algorithmic preliminary quotes and personalized treatment recommendations.</li>
              <li>Coordinating detailing bay reservations, scheduling, and technician assignment.</li>
              <li>Sending appointment confirmations and service updates via WhatsApp or direct phone consultation.</li>
              <li>Maintaining warranty records for long-term Paint Protection Film (PPF) and Ceramic Coating packages.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Information Sharing & Security</h2>
            <p className={styles.paragraph}>
              We do not sell, rent, or trade your personal or vehicle information with third-party marketers.
              Your data is stored securely in encrypted databases and is accessible only to authorized studio staff.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. WhatsApp & Direct Communications</h2>
            <p className={styles.paragraph}>
              By submitting a quote enquiry or bay booking, you authorize Smoke M Customs to contact you regarding your
              enquiry via WhatsApp or telephone. You may opt out of future updates at any time by replying STOP or contacting our support team.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Contact Us</h2>
            <p className={styles.paragraph}>
              If you have any questions regarding this Privacy Policy or wish to access or update your customer records,
              please reach out to us at <a href="mailto:privacy@smokecustoms.com" style={{ color: 'var(--color-accent-text)' }}>privacy@smokecustoms.com</a> or call our studio directly at +91 98765 43210.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
