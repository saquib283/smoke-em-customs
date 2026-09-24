import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About Studio — Smoke M Customs',
  description:
    'Learn about Smoke M Customs: our detailing philosophy, dust-free climate bays, certified master technicians, and international quality protocols.',
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>OUR CRAFT & PASSION</span>
          <h1 className={styles.title}>The Smoke M Philosophy</h1>
          <p className={styles.subtitle}>
            Born out of an obsession with automotive perfection. We treat surface preservation
            as high-precision engineering.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Story */}
          <div className={styles.card}>
            <h2 className={styles.cardHeading}>Bespoke Automotive Preservation</h2>
            <p className={styles.paragraph}>
              At Smoke M Customs, we believe your car is more than mere transportation — it is an investment,
              a design marvel, and an extension of your persona. Modern factory clear coats are softer
              and thinner than ever, vulnerable to Indian climate extremes, acid rain, hard water spotting,
              and damaging swirl marks caused by improper washing.
            </p>
            <p className={styles.paragraph}>
              We established our studio to provide supercar-grade paint protection, combining certified
              international techniques with medical-grade bay cleanliness.
            </p>
          </div>

          {/* Pillars */}
          <div className={styles.pillarsGrid}>
            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>🌡️</div>
              <h3 className={styles.pillarTitle}>Climate & Dust Controlled</h3>
              <p className={styles.pillarDesc}>
                Ceramic coatings and PPF require exact humidity (45–55%) and temperature (20–24°C)
                for irreversible covalent bonding. Our bays are hermetically isolated.
              </p>
            </div>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>💡</div>
              <h3 className={styles.pillarTitle}>98 CRI Concourse Lighting</h3>
              <p className={styles.pillarDesc}>
                Standard shop lights hide 60% of clear coat defects. We utilize multi-angle,
                high-CRI inspection lamps calibrated to reveal holograms, buffer trails, and micro-scratches.
              </p>
            </div>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>📏</div>
              <h3 className={styles.pillarTitle}>Non-Destructive Paint Profiling</h3>
              <p className={styles.pillarDesc}>
                We measure paint thickness in microns across every panel before compounding.
                Preserving maximum clear coat is our cardinal rule.
              </p>
            </div>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>🤝</div>
              <h3 className={styles.pillarTitle}>Transparent Consultation</h3>
              <p className={styles.pillarDesc}>
                No aggressive upselling. We assess your vehicle&apos;s real-world usage and recommend
                only the protection that makes technical and financial sense.
              </p>
            </div>
          </div>

          {/* Call to action */}
          <div className={styles.ctaBox}>
            <h3 className={styles.ctaTitle}>Experience the Difference Firsthand</h3>
            <p className={styles.ctaText}>
              Visit our studio for a complimentary paint health checkup and consultation.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/book" className="btn btn-primary btn-lg">
                Schedule Studio Visit
              </Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">
                Contact & Studio Directions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
