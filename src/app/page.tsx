import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { contentService } from '@/modules/content';
import { JsonLd } from '@/components/public/JsonLd';
import { Icon } from '@/components/common/Icons';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const [services, packages, reviews, galleryItems, offers] = await Promise.all([
    catalogueService.listServices({ enabledOnly: true }),
    catalogueService.listPackages({ enabledOnly: true }),
    contentService.listReviews({ publishedOnly: true, featured: true }),
    contentService.listGalleryItems({ publishedOnly: true, featured: true }),
    contentService.listOffers({ activeOnly: true }),
  ]);

  const studioSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutoBodyShop',
    name: 'Smoke M Customs',
    alternateName: 'Smoke M Customs Detailing Studio',
    description:
      'Premier automotive detailing, 9H ceramic coating, self-healing paint protection film (PPF), and concourse paint correction studio.',
    url: 'https://smokecustoms.com',
    telephone: '+919876543210',
    priceRange: '₹₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '42 Detailing Boulevard, Phase II, Auto Zone',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '48',
      bestRating: '5',
    },
    sameAs: ['https://instagram.com/smokecustoms', 'https://youtube.com/@smokecustoms'],
  };

  return (
    <main className={styles.main}>
      <JsonLd data={studioSchema} />
      {/* ── 1. Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              PREMIER CAR DETAILING & SURFACE PROTECTION STUDIO
            </div>
            <h1 className={styles.heroTitle}>
              PRECISION CRAFT.<br />
              <span className="gradient-text">SHOWROOM PERFECTION.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Experience bespoke automotive preservation. From high-grade 9H ceramic coatings
              to self-healing TPU Paint Protection Films (PPF) and multi-stage paint correction,
              we treat every vehicle with uncompromising standards in our dust-controlled bays.
            </p>
            <div className={styles.heroActions}>
              <Link href="/quote" className="btn btn-primary btn-lg">
                Get an Instant Quote
              </Link>
              <Link href="/book" className="btn btn-secondary btn-lg">
                Book Detailing Bay
              </Link>
              <a
                href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20interested%20in%20protecting%20my%20car"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroWaBtn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Icon.WhatsApp size={18} /> WhatsApp Us
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Vehicles Perfected</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                4.9 <Icon.Star size={18} color="var(--color-gold)" fill="var(--color-gold)" />
              </span>
              <span className={styles.statLabel}>Google Rating (40+ Reviews)</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10 Yrs</span>
              <span className={styles.statLabel}>PPF Warranty Coverage</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Climate-Controlled Bay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Studio Offers Banner ── */}
      {offers.length > 0 && (
        <section className={styles.offersBanner}>
          <div className={styles.container}>
            <div className={styles.offersBannerInner}>
              <div className={styles.offersBannerLeft}>
                <span className={styles.offersBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon.Zap size={14} /> LIMITED PRIVILEGE
                </span>
                <div>
                  <h3 className={styles.offersTitle}>{offers[0].title}</h3>
                  <span className={styles.offersDesc}>{offers[0].description}</span>
                </div>
              </div>
              <div className={styles.offersActions}>
                <Link href="/quote" className="btn btn-primary btn-sm">
                  Claim Offer
                </Link>
                <Link href="/offers" className="btn btn-secondary btn-sm">
                  View Offers ({offers.length})
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Featured Services ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>SERVICES CATALOGUE</span>
            <h2 className={styles.sectionTitle}>Engineered Protection for Every Curve</h2>
            <p className={styles.sectionSubtitle}>
              Each service uses imported chemicals, certified tools, and exacting methodologies to restore and preserve your paint.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {services.slice(0, 6).map((service) => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <span className={styles.serviceCategory}>{service.category ?? 'Detailing'}</span>
                  <span className={styles.servicePrice}>From ₹{Number(service.startingPrice).toLocaleString('en-IN')}</span>
                </div>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <div className={styles.serviceMeta}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Clock size={14} color="var(--color-gold)" /> ~{Math.round(service.durationMinutes / 60)} Hours
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Shield size={14} color="var(--color-gold)" /> Professional Grade
                  </span>
                </div>
                <div className={styles.serviceActions}>
                  <Link href={`/services/${service.slug}`} className="btn btn-secondary btn-sm">
                    View Details
                  </Link>
                  <Link href={`/book?service=${service.id}`} className="btn btn-primary btn-sm">
                    Book Slot
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerAction}>
            <Link href="/services" className="btn btn-outline btn-lg">
              Explore All Services &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Before & After Showcase ── */}
      <section className={`${styles.section} ${styles.sectionDarker}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>TRANSFORMATION PROOF</span>
            <h2 className={styles.sectionTitle}>Before & After Craftsmanship</h2>
            <p className={styles.sectionSubtitle}>
              Witness swirl-damaged, oxidized surfaces restored to deep mirror reflections.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryItems.slice(0, 2).map((item) => (
              <div key={item.id} className={styles.galleryCard}>
                <div className={styles.imagePair}>
                  <div className={styles.imageBox}>
                    {item.beforeImageUrl && (
                      <img
                        src={item.beforeImageUrl}
                        alt={`${item.title} Before`}
                        className={styles.comparisonImg}
                      />
                    )}
                    <span className={`${styles.imgPill} ${styles.pillBefore}`}>BEFORE</span>
                  </div>
                  <div className={styles.imageBox}>
                    {item.afterImageUrl && (
                      <img
                        src={item.afterImageUrl}
                        alt={`${item.title} After`}
                        className={styles.comparisonImg}
                      />
                    )}
                    <span className={`${styles.imgPill} ${styles.pillAfter}`}>AFTER</span>
                  </div>
                </div>
                <div className={styles.galleryInfo}>
                  <div className={styles.galleryMeta}>
                    <span className={styles.galleryCar}>{item.vehicleBrand} {item.vehicleModel}</span>
                    <span className={styles.galleryCat}>{item.serviceCategory}</span>
                  </div>
                  <h3 className={styles.galleryTitle}>{item.title}</h3>
                  <Link href={`/gallery/${item.slug}`} className={styles.galleryLink}>
                    View Case Study &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerAction}>
            <Link href="/gallery" className="btn btn-secondary btn-lg">
              Browse Full Studio Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Why Choose Us ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE SMOKE M DIFFERENCE</span>
            <h2 className={styles.sectionTitle}>Why Discerning Owners Trust Us</h2>
            <p className={styles.sectionSubtitle}>
              We treat vehicle protection as engineering, not just a wash. Every process is measured and documented.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon.Wind size={24} /></div>
              <h3 className={styles.featureTitle}>Dust-Free Climate Bay</h3>
              <p className={styles.featureDesc}>
                Ceramic coatings and PPF require precise temperature and zero airborne contaminants.
                Our closed, positive-pressure bays guarantee pristine adhesion.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon.Shield size={24} /></div>
              <h3 className={styles.featureTitle}>Self-Healing TPU Film</h3>
              <p className={styles.featureDesc}>
                We exclusively install premium aliphatic TPU films that heal micro-scratches with sunlight or warm water.
                10-year manufacturer warranty against yellowing and bubbling.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon.Microscope size={24} /></div>
              <h3 className={styles.featureTitle}>Digital Paint Depth Gauge</h3>
              <p className={styles.featureDesc}>
                Before any machine touches your clear coat, we map paint thickness across all panels
                to ensure safe, responsible correction without compromising factory clear.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon.Certificate size={24} /></div>
              <h3 className={styles.featureTitle}>Documented Warranty</h3>
              <p className={styles.featureDesc}>
                Receive a physical and digital warranty card with scheduled free 6-month inspection
                and maintenance washes to ensure your protection stays at peak performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. How It Works (4-Stage Protocol) ── */}
      <section className={`${styles.section} ${styles.sectionDarker}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE 4-STAGE METHODOLOGY</span>
            <h2 className={styles.sectionTitle}>How We Elevate & Protect Your Vehicle</h2>
            <p className={styles.sectionSubtitle}>
              Every automobile follows our aerospace-grade preservation protocol in hermetically sealed bays.
            </p>
          </div>

          <div className={styles.howItWorksGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>01</span>
                <span className={styles.stepIcon}><Icon.Clipboard size={22} /></span>
              </div>
              <h3 className={styles.stepTitle}>Intake & Digital Paint Gauge Mapping</h3>
              <p className={styles.stepDesc}>
                We measure clear coat depth across every metal panel using ultrasonic gauges and map all swirls, rock chips, and holograms under 5000K inspection lights.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>02</span>
                <span className={styles.stepIcon}><Icon.Soap size={22} /></span>
              </div>
              <h3 className={styles.stepTitle}>Multi-Stage Chemical Decontamination</h3>
              <p className={styles.stepDesc}>
                pH-neutral foam bath, iron fallout dissolution, synthetic clay bar treatment, and delicate trim masking ensure a surgically sterile surface.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>03</span>
                <span className={styles.stepIcon}><Icon.Shield size={22} /></span>
              </div>
              <h3 className={styles.stepTitle}>Climate-Controlled Application</h3>
              <p className={styles.stepDesc}>
                In our temperature and humidity controlled bays, certified technicians apply dual-layer 9H nano-ceramic coatings or custom edge-wrapped TPU PPF.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>04</span>
                <span className={styles.stepIcon}><Icon.Sparkles size={22} /></span>
              </div>
              <h3 className={styles.stepTitle}>Infrared Curing & Warranty Handover</h3>
              <p className={styles.stepDesc}>
                Shortwave IR lamps cure the coating to peak hardness. You receive a digital warranty certificate, maintenance booklet, and aftercare consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Packages ── */}
      <section className={`${styles.section} ${styles.sectionDarker}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>CURATED PACKAGES</span>
            <h2 className={styles.sectionTitle}>Complete Vehicle Protection Suites</h2>
            <p className={styles.sectionSubtitle}>
              All-inclusive service combinations designed for new car delivery or restorative transformation.
            </p>
          </div>

          <div className={styles.packagesGrid}>
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className={`${styles.packageCard} ${idx === 1 ? styles.popularPackage : ''}`}
              >
                {idx === 1 && <span className={styles.popularBadge}>MOST POPULAR</span>}
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packagePrice}>
                  ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                  <span className={styles.pricePeriod}> / package</span>
                </p>
                <div className={styles.packageMeta}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Clock size={14} color="var(--color-gold)" /> ~{Math.round(pkg.durationMinutes / 60)} Hours
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Shield size={14} color="var(--color-gold)" /> Multi-Year Warranty
                  </span>
                </div>
                <ul className={styles.packageBenefits}>
                  {pkg.benefits.map((b, i) => (
                    <li key={i}>
                      <span className={styles.checkIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Icon.Check size={12} color="var(--color-gold)" />
                      </span> {b}
                    </li>
                  ))}
                </ul>
                <div className={styles.packageActions}>
                  <Link href={`/book?package=${pkg.id}`} className="btn btn-primary btn-full">
                    Book This Package
                  </Link>
                  <Link href={`/packages/${pkg.slug}`} className="btn btn-secondary btn-full">
                    View Package Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Verified Customer Reviews ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>REVIEWS & FEEDBACK</span>
            <h2 className={styles.sectionTitle}>Trusted by Automotive Enthusiasts</h2>
            <p className={styles.sectionSubtitle}>
              Read genuine feedback from sports car, luxury sedan, and SUV owners across the city.
            </p>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.map((r) => (
              <div key={r.id} className={styles.reviewCard}>
                <div className={styles.reviewStars} style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon.Star
                      key={i}
                      size={14}
                      color={i < r.rating ? 'var(--color-gold)' : 'var(--color-border)'}
                      fill={i < r.rating ? 'var(--color-gold)' : 'transparent'}
                    />
                  ))}
                </div>
                <p className={styles.reviewBody}>&ldquo;{r.body}&rdquo;</p>
                <div className={styles.reviewAuthor}>
                  <div className={styles.authorAvatar}>
                    {r.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className={styles.authorName}>{r.customerName}</h4>
                    <span className={styles.authorCar}>{r.vehicleText ?? 'Verified Client'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerAction}>
            <Link href="/reviews" className="btn btn-secondary btn-lg">
              Read All Verified Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Call To Action Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <span className={styles.ctaTag}>READY FOR THE TRANSFORMATION?</span>
              <h2 className={styles.ctaTitle}>Give Your Vehicle the Shield It Deserves</h2>
              <p className={styles.ctaDesc}>
                Whether you just took delivery of a brand new car or want to eliminate swirl marks
                from your daily driver, our master detailers are ready.
              </p>
              <div className={styles.ctaButtons}>
                <Link href="/quote" className="btn btn-primary btn-lg">
                  Instant Online Quote
                </Link>
                <Link href="/book" className="btn btn-secondary btn-lg">
                  Check Bay Availability
                </Link>
                <a
                  href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20schedule%20a%20visit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.heroWaBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Icon.WhatsApp size={18} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
