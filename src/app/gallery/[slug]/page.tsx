import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { contentService } from '@/modules/content';
import { ImageCompare } from '@/components/public/ImageCompare';
import styles from './galleryDetail.module.css';

interface GalleryDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GalleryDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await contentService.getGalleryItem(slug);
  if (!item) {
    return { title: 'Project Not Found' };
  }
  return {
    title: `${item.title} — Smoke M Customs Gallery`,
    description: item.description ?? 'Vehicle transformation case study.',
  };
}

export const revalidate = 60;

export default async function GalleryDetailPage({ params }: GalleryDetailProps) {
  const { slug } = await params;
  const item = await contentService.getGalleryItem(slug);

  if (!item) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/gallery">Gallery</Link>
            <span>/</span>
            <span className={styles.currentCrumb}>{item.title}</span>
          </div>

          <span className={styles.tag}>{item.serviceCategory ?? 'Transformation Project'}</span>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.carInfo}>
            <span>🚗 {item.vehicleBrand} {item.vehicleModel}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Interactive Split-Slider Comparison */}
          {item.beforeImageUrl && item.afterImageUrl && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <ImageCompare
                beforeUrl={item.beforeImageUrl}
                afterUrl={item.afterImageUrl}
                beforeAlt={`${item.title} Before`}
                afterAlt={`${item.title} After`}
                title={item.title}
              />
            </div>
          )}

          {/* Side-by-side or stacked Before / After */}
          <div className={styles.imagesSection}>
            <div className={styles.imageBlock}>
              <div className={styles.imageWrapper}>
                {item.beforeImageUrl && (
                  <img
                    src={item.beforeImageUrl}
                    alt={`${item.title} Before`}
                    className={styles.image}
                  />
                )}
                <span className={`${styles.badge} ${styles.badgeBefore}`}>STAGE 1: BEFORE CONDITION</span>
              </div>
              <p className={styles.caption}>Swirled clear coat, micro-marring, and loss of reflection prior to treatment.</p>
            </div>

            <div className={styles.imageBlock}>
              <div className={styles.imageWrapper}>
                {item.afterImageUrl && (
                  <img
                    src={item.afterImageUrl}
                    alt={`${item.title} After`}
                    className={styles.image}
                  />
                )}
                <span className={`${styles.badge} ${styles.badgeAfter}`}>STAGE 2: COMPLETED PERFECTION</span>
              </div>
              <p className={styles.caption}>Zero swirl defects, amplified depth, metallic flake pop, and hydrophobic seal.</p>
            </div>
          </div>

          {/* Project Narrative */}
          <div className={styles.narrativeCard}>
            <h2 className={styles.narrativeTitle}>Project Details & Scope</h2>
            <p className={styles.narrativeText}>{item.description}</p>

            <div className={styles.tagsRow}>
              {item.tags.map((tag, i) => (
                <span key={i} className={styles.tagPill}>#{tag}</span>
              ))}
            </div>

            <div className={styles.actionRow}>
              <Link href="/quote" className="btn btn-primary btn-lg">
                Get Quote for Similar Vehicle
              </Link>
              <Link href="/book" className="btn btn-secondary btn-lg">
                Book Bay Slot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
