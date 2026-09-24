import React from 'react';
import { contentService } from '@/modules/content';
import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await contentService.listReviews();

  return (
    <div>
      <ReviewsClient initialReviews={reviews} />
    </div>
  );
}
