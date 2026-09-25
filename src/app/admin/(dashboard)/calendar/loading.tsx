import { PageSkeleton } from '@/components/ui';

export default function CalendarLoading() {
  return <PageSkeleton variant="table" itemCount={5} />;
}
