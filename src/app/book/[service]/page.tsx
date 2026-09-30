import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { catalogueService } from '@/modules/catalogue';
import { bookingService } from '@/modules/booking';
import { BookServiceWizard } from '@/components/booking/BookServiceWizard';
import { Icon } from '@/components/common/Icons';
import styles from '../booking.module.css';

interface BookServicePageProps {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ leadId?: string; quoteId?: string }>;
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
  const { leadId, quoteId } = await searchParams;

  // Resolve service or package (supports both slug and UUID)
  let service = await catalogueService.getServiceBySlug(slugOrId);
  if (!service) service = await catalogueService.getServiceById(slugOrId);

  let pkg = null;
  if (!service) {
    pkg = await catalogueService.getPackageBySlug(slugOrId);
    if (!pkg) pkg = await catalogueService.getPackageById(slugOrId);
  }

  // Canonicalize UUID URLs to SEO-friendly slugs
  if (service && slugOrId === service.id && service.slug) {
    const q = new URLSearchParams();
    if (leadId) q.set('leadId', leadId);
    if (quoteId) q.set('quoteId', quoteId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    redirect(`/book/${service.slug}${qs}`);
  }

  if (pkg && slugOrId === pkg.id && pkg.slug) {
    const q = new URLSearchParams();
    if (leadId) q.set('leadId', leadId);
    if (quoteId) q.set('quoteId', quoteId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    redirect(`/book/${pkg.slug}${qs}`);
  }

  // If item doesn't exist or is completely disabled, render 404
  if (!service && !pkg) {
    notFound();
  }
  if (service && !service.isEnabled) {
    notFound();
  }
  if (pkg && !pkg.isEnabled) {
    notFound();
  }

  // If service or package is flagged as non-bookable directly, provide an executive Atelier Consultation card
  if (service && !service.isBookable) {
    return (
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.container}>
            <span className={styles.tag}>ATELIER CONSULTATION REQUIRED</span>
            <h1 className={styles.title}>{service.name}</h1>
            <p className={styles.subtitle}>
              This bespoke treatment requires custom paint depth assessment and technician consultation before scheduling bay allocation.
            </p>
          </div>
        </div>

        <div className={styles.container} style={{ maxWidth: '680px', margin: 'var(--space-8) auto 0' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
              <Icon.Sparkles size={40} color="var(--color-gold)" />
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              Complimentary Atelier Inspection & Assessment
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-6)' }}>
              To ensure surgical optical clarity and safety for your vehicle&apos;s clear coat, our Master Detailer performs an in-person micron gauge profile before reserving cleanroom bay curing hours.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link href={`/quote?service=${service.slug}`} className="btn btn-primary btn-lg btn-full">
                Request Tailored Formal Quotation &rarr;
              </Link>
              <a
                href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20schedule%20a%20consultation%20for%20${encodeURIComponent(service.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg btn-full"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon.WhatsApp size={18} /> Schedule Inspection via WhatsApp
              </a>
              <Link href="/book" className="btn btn-outline btn-full">
                &larr; Explore Immediate Bookable Treatments
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (pkg && !pkg.isBookable) {
    return (
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.container}>
            <span className={styles.tag}>ATELIER CONSULTATION REQUIRED</span>
            <h1 className={styles.title}>{pkg.name}</h1>
            <p className={styles.subtitle}>
              This curated package suite requires on-site vehicle inspection before assigning bay curing schedules.
            </p>
          </div>
        </div>

        <div className={styles.container} style={{ maxWidth: '680px', margin: 'var(--space-8) auto 0' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
              <Icon.Sparkles size={40} color="var(--color-gold)" />
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              Curated Package Consultation
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: 'var(--space-6)' }}>
              Get a custom multi-stage inspection report and bespoke timeline tailored specifically for your vehicle&apos;s condition.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link href={`/quote?package=${pkg.slug}`} className="btn btn-primary btn-lg btn-full">
                Request Tailored Formal Quotation &rarr;
              </Link>
              <a
                href={`https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20the%20${encodeURIComponent(pkg.name)}%20package`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg btn-full"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon.WhatsApp size={18} /> Chat with Specialist on WhatsApp
              </a>
              <Link href="/book" className="btn btn-outline btn-full">
                &larr; Explore Immediate Bookable Treatments
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
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
          quoteId={quoteId}
        />
      </div>
    </main>
  );
}
