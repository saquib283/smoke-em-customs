import { PageSkeleton } from '@/components/ui';

export default function BookingsLoading() {
  return <PageSkeleton variant="table" itemCount={6} />;
}
