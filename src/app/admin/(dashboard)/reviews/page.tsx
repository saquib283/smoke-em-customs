import React from 'react';
import { contentService } from '@/modules/content';
import { catalogueService } from '@/modules/catalogue';
import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const [reviews, services] = await Promise.all([
    contentService.listReviews(),
    catalogueService.listServices(),
  ]);

  return (
    <div>
      <ReviewsClient
        initialReviews={reviews}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
