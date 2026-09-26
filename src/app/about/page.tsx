import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/common/Icons';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Atelier Philosophy & Standards | Smoke M Customs',
  description:
    'Discover Smoke M Customs: our surface preservation philosophy, dust-free climate bays, certified master technicians, and international quality protocols.',
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>ATELIER PHILOSOPHY & CRAFTSMANSHIP</span>
          <h1 className={styles.title}>The Standard of Surface Perfection</h1>
          <p className={styles.subtitle}>
            Born out of an uncompromising obsession with automotive excellence. We approach paint preservation not as a trade, but as meticulous optical engineering.
          </p>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.contentStack}>
          {/* Editorial Section with Image */}
          <section className={styles.storySection}>
            <div className={styles.storyText}>
              <span className={styles.sectionLabel}>CRAFTSMANSHIP MANIFESTO</span>
              <h2 className={styles.storyHeading}>Engineered for India&apos;s Harshest Environments</h2>
              <p className={styles.paragraph}>
                Modern factory clear coats are thinner and softer than ever before, frequently measuring less than 110 microns. Indian climate realities—harsh UV radiation, airborne industrial fallout, mineral-dense tap water, and uncalibrated roadside washes—induce micro-marring, severe swirl marks, and rapid oxidation within months of delivery.
              </p>
              <p className={styles.paragraph}>
                Smoke M Customs was founded to offer an uncompromising sanctuary for discerning vehicle owners. We combine clinical-grade bay environments, lab-tested ceramic polymers, and optically pure aliphatic polyurethane films with methodical multi-stage paint correction.
              </p>
              <div className={styles.storyStats}>
                <div className={styles.statBox}>
                  <span className={styles.statValue}>98+</span>
                  <span className={styles.statLabel}>CRI Color Accuracy</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statValue}>±1 µm</span>
                  <span className={styles.statLabel}>Digital Gauge Precision</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statValue}>100%</span>
                  <span className={styles.statLabel}>Dust-Filtered Bays</span>
                </div>
              </div>
            </div>

            <div className={styles.storyImageWrapper}>
              <Image
                src="/ppf-craft.jpg"
                alt="Smoke M Customs technician precision wrapping automotive panel"
                width={800}
                height={600}
                style={{ width: '100%', height: 'auto' }}
                className={styles.storyImage}
                priority
              />
              <div className={styles.imageCaption}>
                <span>Precision tucking and seamless edge wrap in progress</span>
              </div>
            </div>
          </section>

          {/* Pillars Grid */}
          <section className={styles.pillarsSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>TECHNICAL STANDARDS</span>
              <h2 className={styles.sectionTitle}>Four Pillars of Studio Integrity</h2>
            </div>

            <div className={styles.pillarsGrid}>
              <div className={styles.pillar}>
                <div className={styles.pillarIcon}>
                  <Icon.Thermometer size={24} />
                </div>
                <h3 className={styles.pillarTitle}>Climate & Dust-Isolated Cleanroom</h3>
                <p className={styles.pillarDesc}>
                  Ceramic coatings and PPF require precise atmospheric control (45–55% humidity, 21–24°C) for covalent bonding. Our hermetically sealed bays prevent airborne particulates from interfering with adhesive surfaces.
                </p>
              </div>

              <div className={styles.pillar}>
                <div className={styles.pillarIcon}>
                  <Icon.Lightbulb size={24} />
                </div>
                <h3 className={styles.pillarTitle}>98 CRI Concourse Optical Lighting</h3>
                <p className={styles.pillarDesc}>
                  Generic workshop lighting conceals up to 60% of clear coat imperfections. Our bays feature calibrated multi-wavelength inspection fixtures that reveal holograms, micro-marring, and buffer trails before inspection.
                </p>
              </div>

              <div className={styles.pillar}>
                <div className={styles.pillarIcon}>
                  <Icon.Ruler size={24} />
                </div>
                <h3 className={styles.pillarTitle}>Non-Destructive Micron Profiling</h3>
                <p className={styles.pillarDesc}>
                  Before compounding, every body panel undergoes multi-point ultrasonic paint depth measurement. Preserving maximum factory clear coat thickness is our foundational operational rule.
                </p>
              </div>

              <div className={styles.pillar}>
                <div className={styles.pillarIcon}>
                  <Icon.Handshake size={24} />
                </div>
                <h3 className={styles.pillarTitle}>Honest Technical Consultation</h3>
                <p className={styles.pillarDesc}>
                  We do not practice aggressive upselling. We evaluate your vehicle&apos;s real-world driving conditions, storage, and clear coat health to recommend only the bespoke treatments that genuinely protect your asset.
                </p>
              </div>
            </div>
          </section>

          {/* Call to action */}
          <section className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <span className={styles.ctaTag}>DIRECT EXPERIENCE</span>
              <h3 className={styles.ctaTitle}>Experience the Difference Firsthand</h3>
              <p className={styles.ctaText}>
                Schedule a complimentary 20-minute vehicle paint health assessment and witness our studio cleanrooms in person.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/book" className="btn btn-primary btn-lg">
                  Schedule Studio Consultation
                </Link>
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  Studio Location & Directions
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
