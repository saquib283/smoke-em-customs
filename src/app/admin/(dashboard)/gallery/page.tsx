import React from 'react';
import { contentService } from '@/modules/content';
import { GalleryClient } from './GalleryClient';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage() {
  const items = await contentService.listGalleryItems();

  return (
    <div>
      <GalleryClient initialGallery={items} />
    </div>
  );
}
