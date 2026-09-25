'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import { useToast } from '@/components/ui';
import type { BookingDetail } from '@/modules/booking';
import styles from './bookingDetail.module.css';

interface ResourceItem {
  id: string;
  name: string;
  isActive: boolean;
}

interface BookingDetailClientProps {
  initialBooking: BookingDetail;
  initialCommunications: any[];
  initialAuditLogs?: any[];
}

export function BookingDetailClient({
  initialBooking,
  initialCommunications,
  initialAuditLogs = [],
}: BookingDetailClientProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [booking, setBooking] = useState<BookingDetail>(initialBooking);
  const [communications, setCommunications] = useState<any[]>(initialCommunications);
  const [auditLogs, setAuditLogs] = useState<any[]>(initialAuditLogs);
  const [actionLoading, setActionLoading] = useState(false);

  // Notes state
  const [internalNotes, setInternalNotes] = useState(booking.internalNotes || '');
  const [notesSaving, setNotesSaving] = useState(false);

  // Reschedule state
  const [showRescheduleBox, setShowRescheduleBox] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');

  // Cancel state
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Bay reassignment state
  const [showReassignBox, setShowReassignBox] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedNewBay, setSelectedNewBay] = useState('');

  // Communication logger state
  const [commChannel, setCommChannel] = useState<'WHATSAPP' | 'CALL' | 'EMAIL' | 'SMS'>('WHATSAPP');
  const [commDirection, setCommDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [commSummary, setCommSummary] = useState('');
  const [commLoading, setCommLoading] = useState(false);

  // Client Initials
  const clientInitials = (() => {
    const parts = (booking.customerName || 'Customer').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (booking.customerName[0] || 'C').toUpperCase();
  })();

  // Format Duration
  const formatDuration = (mins: number) => {
    if (!mins) return '—';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs > 0 && remainder > 0) return `${hrs}h ${remainder}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // Fetch resources for bay reassignment
  useEffect(() => {
    fetch('/api/admin/calendar?month=' + new Date().toISOString().slice(0, 7))
      .then((r) => r.json())
      .then((data) => {
        if (data.resources) setResources(data.resources.filter((r: ResourceItem) => r.isActive));
      })
      .catch(() => {});
  }, []);

  // Status Formatter
  const formatStatus = (st: string) => {
    switch (st) {
      case 'PENDING_CONFIRMATION':
        return 'Pending Confirmation';
      case 'CONFIRMED':
        return 'Confirmed Bay Slot';
      case 'IN_PROGRESS':
        return 'In Bay Treatment';
      case 'COMPLETED':
        return 'Job Completed';
      case 'CANCELLED':
        return 'Booking Cancelled';
      case 'RESCHEDULED':
        return 'Rescheduled';
      case 'NO_SHOW':
        return 'No-Show';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  // Date Formatters
  const startDate = new Date(booking.startAt);
  const endDate = new Date(booking.endAt);

  const formattedStart = startDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedEnd = endDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Stepper state index
  const stepMap: Record<string, number> = {
    PENDING_CONFIRMATION: 1,
    CONFIRMED: 2,
    RESCHEDULED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  const currentStep = stepMap[booking.status] ?? 1;

  // Execute Workflow Action
  const executeAction = async (actionPayload: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, ...actionPayload }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBooking(data.booking);
        setShowCancelBox(false);
        setShowRescheduleBox(false);

        if (actionPayload.action === 'CONFIRM') {
          success('Booking slot confirmed! Bay allocation locked.');
        } else if (actionPayload.action === 'START_JOB') {
          info('Vehicle checked in. Bay treatment marked IN PROGRESS.');
        } else if (actionPayload.action === 'COMPLETE_JOB') {
          success('Detailing job completed! Ready for customer handover.');
        } else if (actionPayload.action === 'RESCHEDULE') {
          success('Appointment successfully rescheduled to new bay time.');
        } else if (actionPayload.action === 'CANCEL') {
          info('Booking cancelled.');
        } else if (actionPayload.action === 'NO_SHOW') {
          info('Recorded as customer no-show.');
        } else if (actionPayload.action === 'REASSIGN_BAY') {
          success('Detaling bay reassigned successfully.');
        }

        // Add to audit trail
        setAuditLogs((prev) => [
          {
            id: 'local-' + Date.now(),
            action: `BOOKING_${actionPayload.action}`,
            createdAt: new Date().toISOString(),
            after: actionPayload,
          },
          ...prev,
        ]);
      } else {
        toastError(data.error || 'Failed to update booking status');
      }
    } catch {
      toastError('Network error connecting to booking service');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          action: 'UPDATE_NOTES',
          internalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success('Internal studio notes saved');
      } else {
        toastError(data.error || 'Failed to save notes');
      }
    } catch {
      toastError('Error saving notes');
    } finally {
      setNotesSaving(false);
    }
  };

  // Log Communication
  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;

    setCommLoading(true);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: booking.customerId,
          leadId: booking.leadId || undefined,
          channel: commChannel,
          direction: commDirection,
          summary: commSummary.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.communication) {
        setCommunications((prev) => [data.communication, ...prev]);
        setCommSummary('');
        success('Communication logged to customer dossier');
      } else {
        toastError(data.error || 'Failed to log communication');
      }
    } catch {
      toastError('Network error logging communication');
    } finally {
      setCommLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Top Navigation Bar ── */}
      <div className={styles.topNav}>
        <Link href="/admin/bookings" className={styles.backBtn} id="btn-back-to-bookings">
          <Icon.ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to All Bookings</span>
        </Link>

        <div className={styles.topActions}>
          <a
            href={`/api/booking/${booking.id}/ics`}
            className={styles.actionBtn}
            title="Download iCalendar file"
            download={`smokecustoms_booking_${booking.id.slice(-6)}.ics`}
          >
            <Icon.Calendar size={14} />
            <span>Export .ICS</span>
          </a>

          <Link href="/admin/calendar" className={styles.actionBtn}>
            <Icon.Bay size={14} />
            <span>Bay Calendar &rarr;</span>
          </Link>

          <WhatsAppCTA
            phone={booking.customerPhone}
            message={`Hello ${booking.customerName}, Smoke M Customs checking in regarding your ${booking.serviceName || booking.packageName || 'detailing'} appointment on ${formattedStart}.`}
            label="WhatsApp Client"
            variant="outline"
            size="sm"
            logCommunication={{
              customerId: booking.customerId,
              summary: `Outbound WhatsApp chat opened regarding booking #${booking.id.slice(-6).toUpperCase()}`,
            }}
          />

          <a href={`tel:${booking.customerPhone}`} className={styles.actionBtn} title="Call Client">
            <Icon.Phone size={14} />
            <span>Call Mobile</span>
          </a>
        </div>
      </div>

      {/* ── Header Dossier Card ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.bookingAvatar}>{clientInitials}</div>
          <div className={styles.headerMeta}>
            <div className={styles.eyebrow}>
              <span>Studio Operations</span>
              <span className={styles.eyebrowDot} />
              <span>Bay Schedule</span>
              <span className={styles.eyebrowDot} />
              <span>Dossier #{booking.id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className={styles.pageTitle}>
              {booking.customerName} — {booking.serviceName || booking.packageName || 'Detailing Session'}
            </h1>
            <div className={styles.headerSubtext}>
              <span>{booking.vehicleText || 'Unassigned Vehicle'}</span>
              <span>•</span>
              <span>Allocated to {booking.resourceName}</span>
              <span>•</span>
              <span
                className={`${styles.statusPill} ${
                  styles[`status${booking.status}`] || styles.statusPENDING_CONFIRMATION
                }`}
              >
                <span className={styles.statusDot} />
                <span>{formatStatus(booking.status)}</span>
              </span>
            </div>
          </div>
        </div>

        {booking.priceQuoted && (
          <div className={styles.priceTag}>
            Contract: ₹{Number(booking.priceQuoted).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className={styles.grid}>
        {/* ── Left Column: Primary Dossier ── */}
        <div className={styles.mainColumn}>
          {/* Card: Hero Service & Vehicle Banner */}
          <div className={styles.bookingHero}>
            <div className={styles.heroDetails}>
              <div className={styles.heroIconWrap}>
                <Icon.Bay size={22} />
              </div>
              <div>
                <h3 className={styles.heroServiceTitle}>
                  {booking.serviceName || booking.packageName || 'Bespoke Detailing Appointment'}
                </h3>
                <div className={styles.heroMetaLine}>
                  <span>Client: <strong>{booking.customerName}</strong></span>
                  <span>•</span>
                  <span>Vehicle: <strong>{booking.vehicleText || 'Unspecified'}</strong></span>
                  <span>•</span>
                  <span>Workstation: <strong>{booking.resourceName}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Duration:</span>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>
                {formatDuration(booking.durationMinutes)}
              </span>
            </div>
          </div>

          {/* Card 1: Client & Vehicle Parameters */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Users size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Client & Vehicle Parameters</h3>
                  <p className={styles.cardSubtitle}>
                    Verified client contact credentials, vehicle model, and CRM acquisition history.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Customer Name</span>
                  <span className={styles.infoValue}>{booking.customerName}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Direct Contact Mobile</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={styles.infoValue} style={{ fontFeatureSettings: 'tnum' }}>
                      {booking.customerPhone}
                    </span>
                    <a
                      href={`tel:${booking.customerPhone}`}
                      style={{ color: '#B45309', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Dial ↗
                    </a>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Vehicle Model / Spec</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                    <Icon.Car size={15} color="#B45309" />
                    <span className={styles.infoValue}>{booking.vehicleText || 'Unspecified'}</span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Acquisition Channel</span>
                  <span className={styles.infoValue}>{(booking.source || 'Studio').toUpperCase()}</span>
                </div>

                {booking.leadId && (
                  <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>CRM Lead Lineage</span>
                    <Link href={`/admin/leads/${booking.leadId}`} className={styles.lineageLink}>
                      <Icon.Link size={13} />
                      <span>Linked Inbound Lead #{booking.leadId.slice(-6).toUpperCase()} &rarr;</span>
                    </Link>
                  </div>
                )}

                {booking.quoteId && (
                  <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Commercial Quote Agreement</span>
                    <Link href={`/admin/quotes/${booking.quoteId}`} className={styles.lineageLink}>
                      <Icon.FileText size={13} />
                      <span>Linked Formal Quotation #{booking.quoteId.slice(-6).toUpperCase()} &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Schedule & Bay Allocation */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Calendar size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Schedule & Bay Allocation</h3>
                  <p className={styles.cardSubtitle}>
                    Workstation bay reservation window, arrival time, and estimated delivery.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Assigned Detailing Bay</span>
                  <span className={styles.infoValue}>{booking.resourceName}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Current Status</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span
                      className={`${styles.statusPill} ${
                        styles[`status${booking.status}`] || styles.statusPENDING_CONFIRMATION
                      }`}
                    >
                      <span className={styles.statusDot} />
                      <span>{formatStatus(booking.status)}</span>
                    </span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Appointment Start</span>
                  <span className={styles.infoValue}>{formattedStart}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Estimated Job Duration</span>
                  <span className={styles.infoValue}>{formatDuration(booking.durationMinutes)}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Target Handover Window</span>
                  <span className={styles.infoValue}>{formattedEnd}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Payment Status</span>
                  <span className={styles.infoValue}>{booking.paymentStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Notes & Instructions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.FileText size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Internal Detailing Notes & Instructions</h3>
                  <p className={styles.cardSubtitle}>
                    Technician instructions, paint inspection observations, and client requests.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {booking.customerNotes && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Customer Inbound Special Request</span>
                  <span style={{ fontSize: '0.875rem', color: '#1E293B', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {booking.customerNotes}
                  </span>
                </div>
              )}

              {booking.cancellationReason && (
                <div className={styles.actionBoxDanger}>
                  <span className={styles.actionBoxTitleDanger}>Cancellation Reason Recorded</span>
                  <span style={{ fontSize: '0.8125rem', color: '#B91C1C' }}>
                    {booking.cancellationReason}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className={styles.infoLabel}>Studio Technician Internal Notes</span>
                <textarea
                  className={`${styles.inputField} ${styles.textareaField}`}
                  placeholder="Record paint depth measurements, ceramic cure times, defect locations..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.actionBtn}
                  style={{ alignSelf: 'flex-start' }}
                  disabled={notesSaving}
                  onClick={handleSaveNotes}
                >
                  <Icon.Check size={14} />
                  <span>{notesSaving ? 'Saving...' : 'Save Internal Notes'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Customer Communication History */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Phone size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Client Communication Log</h3>
                  <p className={styles.cardSubtitle}>
                    Audit trail of WhatsApp messages, phone discussions, and status alerts.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {/* Quick Logger Form */}
              <form onSubmit={handleLogCommunication} className={styles.actionBox}>
                <span className={styles.actionBoxTitle}>Log New Communication</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    className={styles.inputField}
                    style={{ flex: 1, minWidth: '130px' }}
                    value={commChannel}
                    onChange={(e) => setCommChannel(e.target.value as any)}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS Alert</option>
                  </select>

                  <select
                    className={styles.inputField}
                    style={{ flex: 1, minWidth: '130px' }}
                    value={commDirection}
                    onChange={(e) => setCommDirection(e.target.value as any)}
                  >
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                  </select>
                </div>

                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Brief summary of discussion, appointment reminder, or confirmation..."
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                />

                <button
                  type="submit"
                  className={styles.actionBtn}
                  style={{ alignSelf: 'flex-start' }}
                  disabled={commLoading || !commSummary.trim()}
                >
                  {commLoading ? 'Logging...' : '+ Record Communication'}
                </button>
              </form>

              {/* Communications List */}
              <div className={styles.metaList}>
                {communications.length === 0 ? (
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8', textAlign: 'center', padding: '1rem' }}>
                    No recorded communications yet. Use WhatsApp CTA or the form above to log interactions.
                  </span>
                ) : (
                  communications.map((c) => (
                    <div key={c.id} className={styles.commCard}>
                      <div className={styles.commHeader}>
                        <span style={{ fontWeight: 700, color: '#B45309' }}>
                          {c.channel} • {c.direction}
                        </span>
                        <span style={{ color: '#94A3B8' }}>
                          {new Date(c.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className={styles.commBody}>{c.summary}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Audit Trail & Bay Activity Timeline */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconGold}`}>
                  <Icon.Clock size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Bay Lifecycle & Audit History</h3>
                  <p className={styles.cardSubtitle}>
                    Verified chronological log of bay operations, state transitions, and reallocations.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {auditLogs.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  No historical state changes recorded yet. Initial reservation created on {formattedStart}.
                </div>
              ) : (
                <div className={styles.timelineList}>
                  {auditLogs.map((log) => {
                    const actionLabel =
                      log.action === 'BOOKING_CREATED_BY_ADMIN'
                        ? 'Bay Reservation Initialized'
                        : log.action === 'BOOKING_CONFIRMED' || log.action === 'BOOKING_CONFIRM'
                        ? 'Bay Allocation Confirmed & Locked'
                        : log.action === 'BOOKING_STARTED' || log.action === 'BOOKING_START_JOB'
                        ? 'Vehicle Checked In & Treatment Started'
                        : log.action === 'BOOKING_COMPLETED' || log.action === 'BOOKING_COMPLETE_JOB'
                        ? 'Detailing Session Completed & Delivered'
                        : log.action === 'BOOKING_RESCHEDULED' || log.action === 'BOOKING_RESCHEDULE'
                        ? 'Appointment Rescheduled'
                        : log.action === 'BOOKING_NO_SHOW'
                        ? 'Marked as Customer No-Show'
                        : log.action === 'BOOKING_CANCELLED' || log.action === 'BOOKING_CANCEL'
                        ? 'Booking Slot Cancelled'
                        : log.action === 'BOOKING_BAY_REASSIGNED' || log.action === 'BOOKING_REASSIGN_BAY'
                        ? 'Bay Resource Reassigned'
                        : log.action.replace(/_/g, ' ');

                    const d = new Date(log.createdAt);
                    const formattedDate = d.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={log.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineTitle}>{actionLabel}</span>
                          <span className={styles.timelineTime}>{formattedDate}</span>
                        </div>
                        {log.after?.reason && (
                          <div className={styles.timelineDetail}>
                            Reason: {log.after.reason}
                          </div>
                        )}
                        {log.after?.newStartAt && (
                          <div className={styles.timelineDetail}>
                            New Slot: {new Date(log.after.newStartAt).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Workflow Console (Sticky) ── */}
        <div className={styles.sidebarColumn}>
          {/* Card: Bay Workflow Operations Console */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Tag size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Bay Operations Console</h3>
                  <p className={styles.cardSubtitle}>Slot confirmation & treatment lifecycle</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {/* Stepper Progress Visualizer */}
              <div className={styles.stepperTrack}>
                <div className={styles.stepperLine} />
                <div
                  className={styles.stepperLineActive}
                  style={{
                    width: currentStep <= 1 ? '0%' : currentStep === 2 ? '33%' : currentStep === 3 ? '66%' : '100%',
                  }}
                />

                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepNode} ${
                      currentStep >= 1 ? (currentStep > 1 ? styles.stepNodeDone : styles.stepNodeActive) : ''
                    }`}
                  >
                    1
                  </div>
                  <span className={`${styles.stepText} ${currentStep === 1 ? styles.stepTextActive : ''}`}>
                    Pending
                  </span>
                </div>

                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepNode} ${
                      currentStep >= 2 ? (currentStep > 2 ? styles.stepNodeDone : styles.stepNodeActive) : ''
                    }`}
                  >
                    2
                  </div>
                  <span className={`${styles.stepText} ${currentStep === 2 ? styles.stepTextActive : ''}`}>
                    Confirmed
                  </span>
                </div>

                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepNode} ${
                      currentStep >= 3 ? (currentStep > 3 ? styles.stepNodeDone : styles.stepNodeActive) : ''
                    }`}
                  >
                    3
                  </div>
                  <span className={`${styles.stepText} ${currentStep === 3 ? styles.stepTextActive : ''}`}>
                    In Bay
                  </span>
                </div>

                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepNode} ${
                      currentStep >= 4 ? styles.stepNodeDone : ''
                    }`}
                  >
                    4
                  </div>
                  <span className={`${styles.stepText} ${currentStep === 4 ? styles.stepTextActive : ''}`}>
                    Completed
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className={styles.actionGroup}>
                {booking.status === 'PENDING_CONFIRMATION' && (
                  <button
                    type="button"
                    className={styles.btnPrimaryLarge}
                    disabled={actionLoading}
                    onClick={() => executeAction({ action: 'CONFIRM' })}
                    id="btn-confirm-booking"
                  >
                    <Icon.Check size={16} />
                    <span>{actionLoading ? 'Updating Bay...' : 'Confirm Bay Slot'}</span>
                  </button>
                )}

                {booking.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    className={styles.btnPrimaryLarge}
                    disabled={actionLoading}
                    onClick={() => executeAction({ action: 'START_JOB' })}
                    id="btn-start-job"
                  >
                    <Icon.Bay size={16} />
                    <span>{actionLoading ? 'Updating Bay...' : 'Check In & Start Treatment'}</span>
                  </button>
                )}

                {booking.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    className={`${styles.btnPrimaryLarge} ${styles.btnGreenLarge}`}
                    disabled={actionLoading}
                    onClick={() => executeAction({ action: 'COMPLETE_JOB' })}
                    id="btn-complete-job"
                  >
                    <Icon.Check size={16} />
                    <span>{actionLoading ? 'Completing...' : 'Mark Job Completed & Deliver'}</span>
                  </button>
                )}

                {booking.status === 'COMPLETED' && (
                  <div className={styles.actionBox} style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#15803D' }}>
                      ✓ Detailing Session Successfully Completed
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                      Vehicle has undergone quality inspection and handover to client.
                    </span>
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    className={styles.btnDangerOutline}
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={actionLoading}
                    onClick={() => executeAction({ action: 'NO_SHOW' })}
                    id="btn-no-show"
                  >
                    <Icon.AlertTriangle size={14} />
                    <span>{actionLoading ? 'Updating...' : 'Mark as No-Show'}</span>
                  </button>
                )}

                {booking.status === 'NO_SHOW' && (
                  <div className={styles.actionBoxDanger}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#B91C1C' }}>
                      ⚠ Customer No-Show Recorded
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>
                      Customer did not arrive for scheduled appointment.
                    </span>
                  </div>
                )}

                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.status !== 'NO_SHOW' && (
                  <div className={styles.secondaryRow}>
                    <button
                      type="button"
                      className={styles.btnSecondaryOutline}
                      onClick={() => {
                        setShowRescheduleBox(!showRescheduleBox);
                        setShowCancelBox(false);
                        setShowReassignBox(false);
                      }}
                      id="btn-reschedule-toggle"
                    >
                      <Icon.Calendar size={14} />
                      <span>Reschedule</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnSecondaryOutline}
                      onClick={() => {
                        setShowReassignBox(!showReassignBox);
                        setShowRescheduleBox(false);
                        setShowCancelBox(false);
                      }}
                      id="btn-reassign-bay-toggle"
                    >
                      <Icon.Bay size={14} />
                      <span>Reassign Bay</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnDangerOutline}
                      onClick={() => {
                        setShowCancelBox(!showCancelBox);
                        setShowRescheduleBox(false);
                        setShowReassignBox(false);
                      }}
                      id="btn-cancel-toggle"
                    >
                      <Icon.Cross size={14} />
                      <span>Cancel Slot</span>
                    </button>
                  </div>
                )}

                {/* Inline Reschedule Box */}
                {showRescheduleBox && (
                  <div className={styles.actionBox}>
                    <span className={styles.actionBoxTitle}>Select New Appointment Time</span>
                    <input
                      type="datetime-local"
                      className={styles.inputField}
                      value={newRescheduleDate}
                      onChange={(e) => setNewRescheduleDate(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={styles.btnPrimaryLarge}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                        disabled={actionLoading || !newRescheduleDate}
                        onClick={() =>
                          executeAction({
                            action: 'RESCHEDULE',
                            newStartAt: new Date(newRescheduleDate).toISOString(),
                          })
                        }
                      >
                        {actionLoading ? 'Rescheduling...' : 'Apply Reschedule'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondaryOutline}
                        onClick={() => setShowRescheduleBox(false)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Bay Reassignment Box */}
                {showReassignBox && (
                  <div className={styles.actionBox}>
                    <span className={styles.actionBoxTitle}>Reassign to Different Bay</span>
                    <select
                      className={styles.inputField}
                      value={selectedNewBay}
                      onChange={(e) => setSelectedNewBay(e.target.value)}
                    >
                      <option value="">Select a bay...</option>
                      {resources
                        .filter((r) => r.id !== booking.resourceId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={styles.btnPrimaryLarge}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                        disabled={actionLoading || !selectedNewBay}
                        onClick={() =>
                          executeAction({
                            action: 'REASSIGN_BAY',
                            newResourceId: selectedNewBay,
                          })
                        }
                      >
                        {actionLoading ? 'Reassigning...' : 'Confirm Bay Change'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondaryOutline}
                        onClick={() => setShowReassignBox(false)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Cancel Box */}
                {showCancelBox && (
                  <div className={styles.actionBoxDanger}>
                    <span className={styles.actionBoxTitleDanger}>Reason for Cancellation</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. Client travel postponement, emergency rebooking..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={styles.btnDangerOutline}
                        style={{ backgroundColor: '#DC2626', color: '#FFFFFF', borderColor: '#DC2626' }}
                        disabled={actionLoading || !cancelReason.trim()}
                        onClick={() => executeAction({ action: 'CANCEL', reason: cancelReason })}
                      >
                        {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondaryOutline}
                        onClick={() => setShowCancelBox(false)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Studio Dispatch Metadata */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Tag size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Dispatch Registry</h3>
                  <p className={styles.cardSubtitle}>Audit stamps and system records</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.metaList}>
                <div className={styles.metaRow}>
                  <span>Booking Reference:</span>
                  <span className={styles.metaValue} style={{ fontSize: '0.6875rem' }}>
                    {booking.id}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span>Workstation ID:</span>
                  <span className={styles.metaValue}>{booking.resourceId.slice(-6).toUpperCase()}</span>
                </div>

                <div className={styles.metaRow}>
                  <span>Created Timestamp:</span>
                  <span className={styles.metaValue}>
                    {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span>Calendar Synchronization:</span>
                  <span className={styles.metaValue} style={{ color: '#16A34A' }}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
