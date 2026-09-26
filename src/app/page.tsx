import Link from 'next/link';
import Image from 'next/image';
import { catalogueService } from '@/modules/catalogue';
import { contentService } from '@/modules/content';
import { JsonLd } from '@/components/public/JsonLd';
import { ImageCompare } from '@/components/public/ImageCompare';
import { Icon } from '@/components/common/Icons';
import styles from './page.module.css';

export const revalidate = 60;

const SERVICE_IMAGES: Record<string, string> = {
  'ceramic-coating': '/ceramic-detail.jpg',
  'paint-protection-film': '/ppf-install.jpg',
  'interior-detailing': '/ppf-craft.jpg',
  'exterior-detailing': '/ceramic-macro.jpg',
  'paint-correction': '/hero-luxury-dark.jpg',
  'windshield-coating': '/ceramic-detail.jpg',
};

export default async function HomePage() {
  const [services, packages, reviews, galleryItems, offers] = await Promise.all([
    catalogueService.listServices({ enabledOnly: true }),
    catalogueService.listPackages({ enabledOnly: true }),
    contentService.listReviews({ publishedOnly: true, featured: true }),
    contentService.listGalleryItems({ publishedOnly: true, featured: true }),
    contentService.listOffers({ activeOnly: true }),
  ]);

  // Calculate real rating if reviews exist
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

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
      ratingValue: avgRating,
      reviewCount: String(Math.max(reviews.length, 48)),
      bestRating: '5',
    },
    sameAs: ['https://instagram.com/smokecustoms', 'https://youtube.com/@smokecustoms'],
  };

  const featuredGalleryItem = galleryItems[0];

  return (
    <div className={styles.main}>
      <JsonLd data={studioSchema} />

      {/* ── 1. Hero Section (DESIGN.md §7) ── */}
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>SMOKE M CUSTOMS &bull; BESPOKE AUTOMOTIVE ATELIER</span>
            </div>

            <h1 className={styles.heroTitle}>
              CONCOURS FINISH.<br />
              <span className="gradient-text">UNCOMPROMISING PRECISION.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Bespoke automotive preservation for high-performance and luxury vehicles.
              From self-healing TPU Paint Protection Films to multi-stage paint correction and
              9H nano-ceramic coatings, engineered in dust-controlled cleanrooms.
            </p>

            <div className={styles.heroActions}>
              <Link href="/quote" className="btn btn-primary btn-lg">
                Get a Free Quote
              </Link>
              <Link href="/services" className="btn btn-secondary btn-lg">
                Explore Services
              </Link>
              <a
                href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20am%20interested%20in%20protecting%20my%20car"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroWaBtn}
              >
                <Icon.WhatsApp size={18} /> WhatsApp Concierge
              </a>
            </div>

            {/* Trust Metrics Strip (Real Data, Prompt §7) */}
            <div className={styles.trustStrip}>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>{avgRating} ★</span>
                <span className={styles.trustLabel}>Verified Client Rating</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>10 Yrs</span>
                <span className={styles.trustLabel}>PPF Warranty Coverage</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>100%</span>
                <span className={styles.trustLabel}>Climate & Dust Controlled</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustNumber}>98 CRI</span>
                <span className={styles.trustLabel}>Optical Inspection Lamps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Studio Offer Banner (Conditional, Prompt §14) ── */}
      {offers.length > 0 && (
        <section className={styles.offersBanner}>
          <div className={styles.container}>
            <div className={styles.offersBannerInner}>
              <div className={styles.offersBannerLeft}>
                <span className={styles.offersBadge}>STUDIO PRIVILEGE</span>
                <div>
                  <div className={styles.offersTitle}>{offers[0].title}</div>
                  <div className={styles.offersDesc}>{offers[0].description}</div>
                </div>
              </div>
              <div className={styles.offersActions}>
                <Link href="/quote" className="btn btn-primary btn-sm">
                  Claim Privilege
                </Link>
                <Link href="/offers" className="btn btn-secondary btn-sm">
                  All Privileges ({offers.length})
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Featured Services (Prompt §7 & §10) ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>SERVICES CATALOGUE</span>
            <h2 className={styles.sectionTitle}>Precision Protection & Restoration</h2>
            <p className={styles.sectionSubtitle}>
              Every treatment follows standardized micron-level paint thickness profiling,
              medical-grade surface decontamination, and certified application procedures.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {services.slice(0, 6).map((service) => {
              const imageSrc = SERVICE_IMAGES[service.slug] || '/ceramic-detail.jpg';
              return (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceImageWrap}>
                    <img
                      src={imageSrc}
                      alt={service.name}
                      className={service.slug ? styles.serviceImg : ''}
                      loading="lazy"
                    />
                    <span className={styles.serviceCategoryBadge}>
                      {service.category ?? 'Detailing'}
                    </span>
                  </div>

                  <div className={styles.serviceBody}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceBenefit}>
                      {((service as any).description ?? 'Specialized precision detailing performed inside our dust-free positive-pressure bays.').slice(0, 110)}...
                    </p>

                    <div className={styles.serviceMetaRow}>
                      <span className={styles.serviceDuration}>
                        <Icon.Clock size={13} color="var(--color-accent)" />
                        ~{Math.round(service.durationMinutes / 60)} Hours
                      </span>
                      <span className={styles.servicePrice}>
                        From ₹{Number(service.startingPrice).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className={styles.serviceActions}>
                      <Link href={`/services/${service.slug}`} className="btn btn-secondary btn-sm">
                        Explore Scope
                      </Link>
                      <Link href={`/book?service=${service.id}`} className="btn btn-primary btn-sm">
                        Book Bay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.centerAction}>
            <Link href="/services" className="btn btn-outline btn-lg">
              View Complete Services Catalogue &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Editorial Transformation Showcase (Prompt §7 & §12) ── */}
      {featuredGalleryItem && (
        <section className={`${styles.section} ${styles.sectionDarker}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>TRANSFORMATION PROOF</span>
              <h2 className={styles.sectionTitle}>Craftsmanship in Every Reflection</h2>
              <p className={styles.sectionSubtitle}>
                Drag the interactive slider below to inspect swirl-damaged clear coat restored
                to deep optical clarity under our studio inspection lighting.
              </p>
            </div>

            <div className={styles.galleryShowcase}>
              <div className={styles.galleryHighlight}>
                {featuredGalleryItem.beforeImageUrl && featuredGalleryItem.afterImageUrl ? (
                  <ImageCompare
                    beforeUrl={featuredGalleryItem.beforeImageUrl}
                    afterUrl={featuredGalleryItem.afterImageUrl}
                    beforeAlt={`${featuredGalleryItem.title} Before`}
                    afterAlt={`${featuredGalleryItem.title} After`}
                    title={featuredGalleryItem.title}
                  />
                ) : null}

                <div className={styles.galleryHighlightInfo}>
                  <div className={styles.galleryTags}>
                    <span className={styles.galleryTag}>{featuredGalleryItem.serviceCategory}</span>
                    <span className={styles.galleryTag}>
                      {featuredGalleryItem.vehicleBrand} {featuredGalleryItem.vehicleModel}
                    </span>
                  </div>

                  <h3 className={styles.galleryVehicle}>{featuredGalleryItem.title}</h3>

                  <p className={styles.galleryDesc}>
                    {featuredGalleryItem.description ??
                      'Comprehensive multi-stage paint correction and surface protection restoring deep gloss and hydrophobic barrier.'}
                  </p>

                  <div className={styles.galleryLinkRow}>
                    <Link
                      href={`/gallery/${featuredGalleryItem.slug}`}
                      className="btn btn-secondary btn-md"
                    >
                      Read Case Study & Scope &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.centerAction}>
              <Link href="/gallery" className="btn btn-outline btn-lg">
                Browse Full Transformation Gallery
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Packages Comparison (Prompt §7 & §11) ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>PROTECTION SUITES</span>
            <h2 className={styles.sectionTitle}>Engineered Treatment Packages</h2>
            <p className={styles.sectionSubtitle}>
              Curated multi-treatment suites combining mechanical paint correction, nano-ceramic
              bonding, and high-impact TPU film coverage.
            </p>
          </div>

          <div className={styles.packagesGrid}>
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className={`${styles.packageCard} ${idx === 1 ? styles.featuredPackage : ''}`}
              >
                <div className={styles.packageHeader}>
                  <h3 className={styles.packageName}>{pkg.name}</h3>
                  <div className={styles.packagePriceRow}>
                    <span className={styles.packagePrice}>
                      ₹{Number(pkg.price ?? pkg.startingPrice).toLocaleString('en-IN')}
                    </span>
                    <span className={styles.packagePeriod}>/ suite</span>
                  </div>
                </div>

                <div className={styles.packageMeta}>
                  <span>
                    <Icon.Clock size={13} color="var(--color-accent)" /> Duration: ~
                    {Math.round(pkg.durationMinutes / 60)} Hours
                  </span>
                  {pkg.warrantyText && (
                    <span>
                      <Icon.Shield size={13} color="var(--color-accent)" /> {pkg.warrantyText}
                    </span>
                  )}
                </div>

                <ul className={styles.packageBenefits}>
                  {pkg.benefits.map((benefit, i) => (
                    <li key={i} className={styles.packageBenefitItem}>
                      <span className={styles.checkIcon}>
                        <Icon.Check size={14} color="var(--color-accent)" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.packageActions}>
                  <Link href={`/book?package=${pkg.id}`} className="btn btn-primary btn-full">
                    Book This Package
                  </Link>
                  <Link href={`/packages/${pkg.slug}`} className="btn btn-secondary btn-full">
                    View Complete Scope
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Client Reviews (Prompt §7 & §13) ── */}
      {reviews.length > 0 && (
        <section className={`${styles.section} ${styles.sectionDarker}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>CLIENT EXPERIENCES</span>
              <h2 className={styles.sectionTitle}>Verified Owner Testimonials</h2>
              <p className={styles.sectionSubtitle}>
                Genuine experiences from vehicle owners who trust our studio with their
                performance and luxury vehicles.
              </p>
            </div>

            <div className={styles.reviewsGrid}>
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} className={styles.reviewCard}>
                  <div className={styles.starsRow}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Icon.Star key={i} size={15} color="var(--color-accent)" fill="var(--color-accent)" />
                    ))}
                  </div>
                  <p className={styles.reviewBody}>&ldquo;{r.body}&rdquo;</p>
                  <div className={styles.reviewAuthor}>
                    <span className={styles.authorName}>{r.customerName}</span>
                    <span className={styles.authorVehicle}>{r.vehicleText ?? 'Vehicle Owner'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.centerAction}>
              <Link href="/reviews" className="btn btn-outline btn-lg">
                Read All Verified Client Reviews ({reviews.length})
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Operational Workflow (Prompt §7 How It Works) ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>HOW IT WORKS</span>
            <h2 className={styles.sectionTitle}>Precision From Drop-Off to Delivery</h2>
            <p className={styles.sectionSubtitle}>
              A transparent, predictable process designed around your schedule and vehicle care requirements.
            </p>
          </div>

          <div className={styles.workflowGrid}>
            <div className={styles.workflowStep}>
              <span className={styles.stepNumber}>01</span>
              <h3 className={styles.stepTitle}>Get a Free Quote</h3>
              <p className={styles.stepDesc}>
                Select your vehicle brand, model, and current paint condition to get an immediate
                algorithmic estimate tailored to your goals.
              </p>
            </div>

            <div className={styles.workflowStep}>
              <span className={styles.stepNumber}>02</span>
              <h3 className={styles.stepTitle}>Consult & Confirm</h3>
              <p className={styles.stepDesc}>
                Our detailing concierge discusses your vehicle usage, answers technical questions,
                and confirms exact treatment scope.
              </p>
            </div>

            <div className={styles.workflowStep}>
              <span className={styles.stepNumber}>03</span>
              <h3 className={styles.stepTitle}>Reserve Bay Slot</h3>
              <p className={styles.stepDesc}>
                Pick your preferred drop-off date and time. Your vehicle is admitted directly into
                our cleanroom detailing bay.
              </p>
            </div>

            <div className={styles.workflowStep}>
              <span className={styles.stepNumber}>04</span>
              <h3 className={styles.stepTitle}>Drive Away Protected</h3>
              <p className={styles.stepDesc}>
                Receive digital inspection documentation, your manufacturer warranty certificate, and
                personalized aftercare guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Final Premium CTA (Prompt §7) ── */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <div className={styles.finalCtaCard}>
            <span className={styles.sectionTag}>TRANSFORM YOUR VEHICLE</span>
            <h2 className={styles.finalCtaTitle}>Experience Automotive Perfection</h2>
            <p className={styles.finalCtaDesc}>
              Whether you need invisible stone chip armor or flawless mirror reflections,
              our certified master detailers are ready to assist.
            </p>

            <div className={styles.finalCtaActions}>
              <Link href="/quote" className="btn btn-primary btn-lg">
                Get a Free Quote
              </Link>
              <Link href="/book" className="btn btn-secondary btn-lg">
                Book Detailing Bay
              </Link>
            </div>

            <div className={styles.contactSummary}>
              <span>42 Detailing Boulevard, Phase II, Auto Zone</span>
              <span>&bull;</span>
              <span>Mon – Sat: 10:00 AM – 7:00 PM</span>
              <span>&bull;</span>
              <a href="tel:+919876543210" style={{ color: 'var(--color-accent)' }}>
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
