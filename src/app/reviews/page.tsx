import type { Metadata } from 'next';
import { contentService } from '@/modules/content';
import { ReviewsClient } from './ReviewsClient';
import styles from './reviews.module.css';

export const metadata: Metadata = {
  title: 'Client Reviews & Wall of Fame — Smoke M Customs',
  description:
    'Read verified client testimonials from BMW, Mercedes-Benz, Porsche, and luxury SUV owners detailing their experience with Smoke M Customs.',
};

export const revalidate = 60;

export default async function ReviewsPage() {
  const reviews = await contentService.listReviews({ publishedOnly: true });

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>VERIFIED CLIENT TESTIMONIALS</span>
          <h1 className={styles.title}>Client Experiences</h1>
          <p className={styles.subtitle}>
            Unfiltered feedback from vehicle owners who trusted us with their performance cars,
            luxury sedans, and flagship off-roaders.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <ReviewsClient initialReviews={reviews} />
      </div>
    </main>
  );
}
