import { PageSkeleton } from '@/components/ui';

export default function CustomersLoading() {
  return <PageSkeleton variant="table" itemCount={8} />;
}
