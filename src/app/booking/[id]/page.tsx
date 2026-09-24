import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { bookingService } from '@/modules/booking';
import styles from './bookingStatus.module.css';

interface BookingStatusPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BookingStatusPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking #${id.substring(0, 8).toUpperCase()} — Smoke M Customs`,
    robots: { index: false, follow: false }, // Private transaction per PRD FR-8
  };
}

export default async function BookingStatusPage({ params }: BookingStatusPageProps) {
  const { id } = await params;
  const booking = await bookingService.getBooking(id);

  if (!booking) {
    notFound();
  }

  const startDate = new Date(booking.startAt);
  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const shortCode = `SMC-${booking.id.substring(0, 6).toUpperCase()}`;

  const treatmentName = booking.serviceName || booking.packageName || 'Detailing Service';

  const waText = encodeURIComponent(
    `Hi Smoke M Customs, I am contacting you regarding my appointment ${shortCode} for ${treatmentName} on ${formattedDate} at ${formattedTime}.`
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.statusCard}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.statusBadgeRow}>
              <span className={`${styles.statusBadge} ${styles[booking.status] || ''}`}>
                {booking.status.replace(/_/g, ' ')}
              </span>
              <span className={styles.bookingRef}>Reference: {shortCode}</span>
            </div>
            <h1 className={styles.cardTitle}>Appointment Scheduled</h1>
            <p className={styles.cardSubtitle}>
              {booking.status === 'PENDING_CONFIRMATION'
                ? 'Your appointment has been logged in our bay queue. Our manager will call you shortly to confirm drop-off details.'
                : 'Your detailing bay has been confirmed and reserved.'}
            </p>
          </div>

          {/* Details Table */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Treatment</span>
              <span className={styles.detailValHighlight}>{treatmentName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Scheduled Date</span>
              <span className={styles.detailVal}>{formattedDate}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bay Allocation & Time</span>
              <span className={styles.detailVal}>
                {formattedTime} &bull; {booking.resourceName}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Vehicle</span>
              <span className={styles.detailVal}>{booking.vehicleText ?? 'Customer Vehicle'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Client Name</span>
              <span className={styles.detailVal}>{booking.customerName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Estimated Fee</span>
              <span className={styles.detailValGold}>
                {booking.priceQuoted ? `₹${Number(booking.priceQuoted).toLocaleString('en-IN')}` : 'To be confirmed'}
              </span>
            </div>
          </div>

          {/* Location & Drop-off info */}
          <div className={styles.locationBox}>
            <h3 className={styles.locTitle}>Studio Drop-Off Location</h3>
            <p className={styles.locDesc}>
              📍 42 Detailing Boulevard, Phase II, Auto Zone, India<br />
              ⏰ Operating Hours: Monday – Saturday: 10:00 AM – 7:00 PM
            </p>
            <p className={styles.locNotes}>
              *Please arrive 10 minutes prior to your allocated time slot for initial paint condition assessment.
            </p>
          </div>

          {/* Actions */}
          <div className={styles.actionsRow}>
            <a
              href={`/api/booking/${booking.id}/ics`}
              download={`smokecustoms-booking-${shortCode}.ics`}
              className="btn btn-secondary btn-lg"
              title="Add to Google Calendar, Apple Calendar, or Outlook"
            >
              📅 Download Calendar Invite (.ics)
            </a>
            <a
              href={`https://wa.me/919876543210?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              💬 WhatsApp Concierge
            </a>
            <a href="tel:+919876543210" className="btn btn-outline btn-lg">
              📞 Call Studio
            </a>
            <Link href="/" className="btn btn-outline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
