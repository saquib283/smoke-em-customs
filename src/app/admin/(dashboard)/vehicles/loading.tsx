import { PageSkeleton } from '@/components/ui';

export default function VehiclesLoading() {
  return <PageSkeleton variant="table" itemCount={6} />;
}
