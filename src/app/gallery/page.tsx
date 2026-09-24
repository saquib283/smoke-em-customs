import type { Metadata } from 'next';
import Link from 'next/link';
import { contentService } from '@/modules/content';
import styles from './gallery.module.css';

export const metadata: Metadata = {
  title: 'Before & After Gallery — Smoke M Customs',
  description:
    'Visual proof of paint correction, 9H ceramic coating, and PPF installations on exotic, luxury, and performance vehicles.',
};

export const revalidate = 60;

export default async function GalleryPage() {
  const items = await contentService.listGalleryItems({ publishedOnly: true });

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>TRANSFORMATION ARCHIVES</span>
          <h1 className={styles.title}>Before & After Gallery</h1>
          <p className={styles.subtitle}>
            Explore our portfolio of concourse transformations. From heavy swirl mark correction
            to seamless paint protection film installations.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.imagePair}>
                <div className={styles.imgBox}>
                  {item.beforeImageUrl && (
                    <img
                      src={item.beforeImageUrl}
                      alt={`${item.title} Before`}
                      className={styles.image}
                    />
                  )}
                  <span className={`${styles.pill} ${styles.pillBefore}`}>BEFORE</span>
                </div>
                <div className={styles.imgBox}>
                  {item.afterImageUrl && (
                    <img
                      src={item.afterImageUrl}
                      alt={`${item.title} After`}
                      className={styles.image}
                    />
                  )}
                  <span className={`${styles.pill} ${styles.pillAfter}`}>AFTER</span>
                </div>
              </div>

              <div className={styles.info}>
                <div className={styles.metaRow}>
                  <span className={styles.carBadge}>{item.vehicleBrand} {item.vehicleModel}</span>
                  <span className={styles.cat}>{item.serviceCategory}</span>
                </div>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <div className={styles.cardActions}>
                  <Link href={`/gallery/${item.slug}`} className="btn btn-secondary btn-full">
                    View Case Study & Scope
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery CTA */}
        <div className={styles.ctaBox}>
          <div>
            <h3 className={styles.ctaHeading}>Want Your Car Featured in Our Showcase?</h3>
            <p className={styles.ctaText}>
              Every vehicle undergoes our standardized before/after photo documentation process under 5000K inspection lighting.
            </p>
          </div>
          <Link href="/book" className="btn btn-primary btn-lg">
            Schedule Detailing Bay
          </Link>
        </div>
      </div>
    </main>
  );
}
