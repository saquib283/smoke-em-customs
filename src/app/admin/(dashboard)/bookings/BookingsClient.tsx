'use client';

import React, { useState } from 'react';
import styles from './bookings.module.css';

interface BookingItem {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleText: string | null;
  serviceName: string | null;
  packageName: string | null;
  resourceName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  source: string;
  createdAt: string;
}

interface BookingsClientProps {
  initialBookings: BookingItem[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [showReschedulePrompt, setShowReschedulePrompt] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const statuses = ['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const filtered = bookings.filter((b) => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        (b.vehicleText && b.vehicleText.toLowerCase().includes(q)) ||
        (b.serviceName && b.serviceName.toLowerCase().includes(q)) ||
        (b.packageName && b.packageName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openBookingDetail = async (id: string) => {
    setSelectedBookingId(id);
    setDetailLoading(true);
    setShowCancelPrompt(false);
    setShowReschedulePrompt(false);
    try {
      const res = await fetch(`/api/admin/bookings?id=${id}`);
      const data = await res.json();
      if (data.booking) {
        setSelectedBookingDetail(data.booking);
        setEditNotes(data.booking.internalNotes || '');
      }
    } catch {
      // Ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const executeAction = async (actionPayload: any) => {
    if (!selectedBookingId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBookingId, ...actionPayload }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setSelectedBookingDetail(data.booking);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBookingId
              ? {
                  ...b,
                  status: data.booking.status,
                  startAt: data.booking.startAt,
                  endAt: data.booking.endAt,
                }
              : b
          )
        );
        setShowCancelPrompt(false);
        setShowReschedulePrompt(false);
      } else {
        alert(data.error || 'Failed to update booking');
      }
    } catch {
      alert('Network error updating booking');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Studio Bookings & Schedule</h1>
          <p className={styles.headerSubtitle}>
            Manage detailing bay assignments, customer check-ins, and job lifecycles.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {statuses.map((st) => (
            <button
              key={st}
              className={`${styles.tabBtn} ${filterStatus === st ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by customer, phone, car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service / Package</th>
                <th>Assigned Bay</th>
                <th>Appointment Slot</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const { date, time } = formatDateTime(b.startAt);
                  return (
                    <tr key={b.id} className={styles.row}>
                      <td>
                        <div className={styles.customerCell}>
                          <span className={styles.customerName}>{b.customerName}</span>
                          <span className={styles.customerPhone}>{b.customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.vehicleCell}>{b.vehicleText || '—'}</span>
                      </td>
                      <td>
                        <strong>{b.serviceName || b.packageName || 'Detailing Job'}</strong>
                      </td>
                      <td>
                        <span className={styles.bayBadge}>🏛 {b.resourceName}</span>
                      </td>
                      <td>
                        <div className={styles.slotCell}>
                          <span className={styles.slotDate}>{date}</span>
                          <span className={styles.slotTime}>{time}</span>
                        </div>
                      </td>
                      <td>{b.durationMinutes} mins</td>
                      <td>
                        <span className={`${styles.badge} ${styles['badge' + b.status]}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => openBookingDetail(b.id)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal Drawer */}
      {selectedBookingId && (
        <div className={styles.modalOverlay} onClick={() => setSelectedBookingId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Booking #{selectedBookingId.slice(-6).toUpperCase()}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedBookingId(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {detailLoading || !selectedBookingDetail ? (
                <p>Loading booking details...</p>
              ) : (
                <>
                  {/* Customer & Vehicle Info */}
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Client & Vehicle Details</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Customer Name</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.customerName}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Phone Number</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.customerPhone}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Vehicle</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.vehicleText || 'Not specified'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Booking Source</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.source.toUpperCase()}
                        </span>
                      </div>
                      {selectedBookingDetail.leadId && (
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>CRM Lead Lineage</span>
                          <span className={styles.infoValue} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                            🔗 Linked Lead #{selectedBookingDetail.leadId.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Schedule & Bay */}
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Schedule & Bay Allocation</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Assigned Bay</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.resourceName}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Current Status</span>
                        <span
                          className={`${styles.badge} ${
                            styles['badge' + selectedBookingDetail.status]
                          }`}
                        >
                          {selectedBookingDetail.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Appointment Start</span>
                        <span className={styles.infoValue}>
                          {new Date(selectedBookingDetail.startAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Expected Finish</span>
                        <span className={styles.infoValue}>
                          {new Date(selectedBookingDetail.endAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Service / Package</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.serviceName ||
                            selectedBookingDetail.packageName ||
                            'Detailing Job'}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Quoted Amount</span>
                        <span className={styles.infoValue}>
                          {selectedBookingDetail.priceQuoted
                            ? `₹${Number(selectedBookingDetail.priceQuoted).toLocaleString('en-IN')}`
                            : 'Standard Rates'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {selectedBookingDetail.customerNotes && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Customer Request Notes</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {selectedBookingDetail.customerNotes}
                      </p>
                    </div>
                  )}

                  {/* Internal Workshop Notes */}
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Workshop & Technician Notes</h3>
                    <textarea
                      className={styles.notesInput}
                      placeholder="Add bay observations, paint gauge readings, special instructions..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                    <button
                      className={styles.tabBtn}
                      style={{ alignSelf: 'flex-start' }}
                      disabled={actionLoading}
                      onClick={() =>
                        executeAction({
                          action: 'UPDATE_NOTES',
                          internalNotes: editNotes,
                        })
                      }
                    >
                      Save Notes
                    </button>
                  </div>

                  {/* Workflow Lifecycle Actions */}
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Lifecycle Actions</h3>
                    <div className={styles.actionGrid}>
                      {selectedBookingDetail.status === 'PENDING_CONFIRMATION' && (
                        <button
                          className={styles.btnConfirm}
                          disabled={actionLoading}
                          onClick={() => executeAction({ action: 'CONFIRM' })}
                        >
                          ✓ Confirm Booking
                        </button>
                      )}

                      {selectedBookingDetail.status === 'CONFIRMED' && (
                        <button
                          className={styles.btnProgress}
                          disabled={actionLoading}
                          onClick={() =>
                            executeAction({
                              action: 'UPDATE_STATUS',
                              status: 'IN_PROGRESS',
                            })
                          }
                        >
                          ▶ Vehicle In Bay (Start Job)
                        </button>
                      )}

                      {selectedBookingDetail.status === 'IN_PROGRESS' && (
                        <button
                          className={styles.btnComplete}
                          disabled={actionLoading}
                          onClick={() => executeAction({ action: 'COMPLETE' })}
                        >
                          ★ Mark Detailing Completed
                        </button>
                      )}

                      <button
                        className={styles.tabBtn}
                        onClick={() => setShowReschedulePrompt(!showReschedulePrompt)}
                      >
                        ⏱ Reschedule Slot
                      </button>

                      {selectedBookingDetail.status !== 'CANCELLED' && (
                        <button
                          className={styles.btnCancel}
                          onClick={() => setShowCancelPrompt(!showCancelPrompt)}
                        >
                          ✕ Cancel Booking
                        </button>
                      )}

                      {/* WhatsApp Pre-filled Quick Action */}
                      <a
                        className={styles.btnWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://wa.me/${selectedBookingDetail.customerPhone.replace(
                          /[^0-9]/g,
                          ''
                        )}?text=${encodeURIComponent(
                          `Hello ${selectedBookingDetail.customerName}, this is Smoke M Customs confirming your appointment on ${new Date(
                            selectedBookingDetail.startAt
                          ).toLocaleDateString('en-IN')} for ${
                            selectedBookingDetail.serviceName ||
                            selectedBookingDetail.packageName ||
                            'Car Detailing'
                          }. Please let us know if you need directions to the studio!`
                        )}`}
                      >
                        💬 Message on WhatsApp
                      </a>
                    </div>

                    {/* Reschedule Form */}
                    {showReschedulePrompt && (
                      <div className={styles.rescheduleBox}>
                        <input
                          type="datetime-local"
                          className={styles.dateInput}
                          value={newRescheduleDate}
                          onChange={(e) => setNewRescheduleDate(e.target.value)}
                        />
                        <button
                          className={styles.btnConfirm}
                          disabled={!newRescheduleDate || actionLoading}
                          onClick={() =>
                            executeAction({
                              action: 'RESCHEDULE',
                              newStartAt: new Date(newRescheduleDate).toISOString(),
                            })
                          }
                        >
                          Confirm Reschedule
                        </button>
                      </div>
                    )}

                    {/* Cancel Prompt */}
                    {showCancelPrompt && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <input
                          type="text"
                          className={styles.searchInput}
                          placeholder="Reason for cancellation (e.g. customer postponed)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          style={{ marginBottom: 'var(--space-2)' }}
                        />
                        <button
                          className={styles.btnCancel}
                          disabled={actionLoading}
                          onClick={() =>
                            executeAction({
                              action: 'CANCEL',
                              reason: cancelReason,
                            })
                          }
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
