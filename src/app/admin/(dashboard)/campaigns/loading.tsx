import { PageSkeleton } from '@/components/ui';

export default function CampaignsLoading() {
  return <PageSkeleton variant="cards" itemCount={6} />;
}
