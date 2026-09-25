import { PageSkeleton } from '@/components/ui';

export default function QuotesLoading() {
  return <PageSkeleton variant="table" itemCount={6} />;
}
