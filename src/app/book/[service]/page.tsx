import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { catalogueService } from '@/modules/catalogue';
import { bookingService } from '@/modules/booking';
import { BookServiceWizard } from '@/components/booking/BookServiceWizard';
import styles from '../booking.module.css';

interface BookServicePageProps {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ leadId?: string }>;
}

export async function generateMetadata({
  params,
}: BookServicePageProps): Promise<Metadata> {
  const { service: slugOrId } = await params;

  let service = await catalogueService.getServiceBySlug(slugOrId);
  if (!service) service = await catalogueService.getServiceById(slugOrId);

  if (service) {
    return {
      title: `Book ${service.name} — Smoke M Customs`,
      description: `Reserve an appointment slot in our positive-pressure bay for ${service.name}.`,
    };
  }

  let pkg = await catalogueService.getPackageBySlug(slugOrId);
  if (!pkg) pkg = await catalogueService.getPackageById(slugOrId);

  if (pkg) {
    return {
      title: `Book ${pkg.name} — Smoke M Customs`,
      description: `Reserve an appointment slot in our positive-pressure bay for ${pkg.name}.`,
    };
  }

  return {
    title: 'Book Appointment — Smoke M Customs',
  };
}

export const revalidate = 60;

export default async function BookServicePage({
  params,
  searchParams,
}: BookServicePageProps) {
  const { service: slugOrId } = await params;
  const { leadId } = await searchParams;

  // Resolve service or package
  let service = await catalogueService.getServiceBySlug(slugOrId);
  if (!service) service = await catalogueService.getServiceById(slugOrId);

  let pkg = null;
  if (!service) {
    pkg = await catalogueService.getPackageBySlug(slugOrId);
    if (!pkg) pkg = await catalogueService.getPackageById(slugOrId);
  }

  if (!service && !pkg) {
    notFound();
  }

  const treatment = service
    ? {
        id: service.id,
        slug: service.slug,
        name: service.name,
        type: 'service' as const,
        durationMinutes: service.durationMinutes,
        price: service.startingPrice,
        category: service.category || 'Specialized Detailing',
        warranty: service.warrantyText,
      }
    : {
        id: pkg!.id,
        slug: pkg!.slug,
        name: pkg!.name,
        type: 'package' as const,
        durationMinutes: pkg!.durationMinutes,
        price: pkg!.price ?? pkg!.startingPrice ?? '0',
        category: 'Curated Package Suite',
        warranty: pkg!.warrantyText,
      };

  // Fetch blocked dates for current and next month
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonth = nextMonthDate.toISOString().slice(0, 7);

  const [b1, b2] = await Promise.all([
    bookingService.getBlockedDates(currentMonth),
    bookingService.getBlockedDates(nextMonth),
  ]);
  const blockedDates = Array.from(new Set([...b1, ...b2]));

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.container}>
          <span className={styles.tag}>BAY APPOINTMENT SCHEDULER</span>
          <h1 className={styles.title}>Book {treatment.name}</h1>
          <p className={styles.subtitle}>
            Select your preferred bay slot, provide your vehicle information, and confirm with zero upfront deposit.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <BookServiceWizard
          treatment={treatment}
          blockedDates={blockedDates}
          leadId={leadId}
        />
      </div>
    </main>
  );
}
