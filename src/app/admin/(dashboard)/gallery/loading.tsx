import { PageSkeleton } from '@/components/ui';

export default function GalleryLoading() {
  return <PageSkeleton variant="cards" itemCount={6} />;
}
