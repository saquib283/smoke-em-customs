'use client';

import React, { useState } from 'react';
import styles from './settings.module.css';

interface Resource {
  id: string;
  name: string;
  isActive: boolean;
}

interface BusinessHour {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

interface BookingRules {
  bufferMinutes: number;
  minLeadTimeHours: number;
  slotGranularityMinutes: number;
}

interface SettingsClientProps {
  initialResources: Resource[];
  initialHours: BusinessHour[];
  initialBlockedDates: BlockedDate[];
  initialBookingRules: BookingRules;
}

export function SettingsClient({
  initialResources,
  initialHours,
  initialBlockedDates,
  initialBookingRules,
}: SettingsClientProps) {
  // ── States ──
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [newBayName, setNewBayName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Business Hours
  const [hours, setHours] = useState<BusinessHour[]>(initialHours);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('10:00');
  const [editEnd, setEditEnd] = useState('19:00');
  const [editIsClosed, setEditIsClosed] = useState(false);

  // Blocked Dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Booking Tolerances
  const [rules, setRules] = useState<BookingRules>(initialBookingRules);
  const [rulesSavedMsg, setRulesSavedMsg] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ── Bay Actions ──
  const handleCreateBay = async () => {
    if (!newBayName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_BAY', name: newBayName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.resource) {
        setResources((prev) => [...prev, data.resource]);
        setNewBayName('');
      } else {
        alert(data.error || 'Failed to add bay');
      }
    } catch {
      alert('Error creating bay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBay = async (id: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_BAY', resourceId: id, isActive: currentActive }),
      });
      const data = await res.json();
      if (data.success && data.resources) {
        setResources(data.resources);
      }
    } catch {
      alert('Failed to toggle bay status');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Business Hours Actions ──
  const openEditHour = (dIndex: number) => {
    const existing = hours.find((h) => h.dayOfWeek === dIndex);
    setEditingDay(dIndex);
    if (existing) {
      setEditStart(existing.startTime);
      setEditEnd(existing.endTime);
      setEditIsClosed(false);
    } else {
      setEditStart('10:00');
      setEditEnd('19:00');
      setEditIsClosed(true);
    }
  };

  const handleSaveHours = async () => {
    if (editingDay === null) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_HOURS',
          dayOfWeek: editingDay,
          startTime: editStart,
          endTime: editEnd,
          isClosed: editIsClosed,
        }),
      });
      const data = await res.json();
      if (data.success && data.hours) {
        setHours(data.hours);
        setEditingDay(null);
      } else {
        alert(data.error || 'Failed to update schedule');
      }
    } catch {
      alert('Error saving business hours');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Blocked Dates Actions ──
  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_BLOCKED_DATE',
          date: newBlockedDate,
          reason: newBlockedReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.blockedDates) {
        setBlockedDates(data.blockedDates);
        setNewBlockedDate('');
        setNewBlockedReason('');
      } else {
        alert(data.error || 'Failed to block date');
      }
    } catch {
      alert('Error adding blocked date');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlockedDate = async (date: string) => {
    if (!confirm(`Are you sure you want to unblock ${date}? Public appointments will be accepted for this day.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_BLOCKED_DATE', date }),
      });
      const data = await res.json();
      if (data.success && data.blockedDates) {
        setBlockedDates(data.blockedDates);
      }
    } catch {
      alert('Error unblocking date');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Booking Rules Actions ──
  const handleSaveRules = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BOOKING_RULES',
          ...rules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRulesSavedMsg(true);
        setTimeout(() => setRulesSavedMsg(false), 3000);
      }
    } catch {
      alert('Error updating booking rules');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.headerTitle}>Studio Settings & Configuration</h1>
        <p className={styles.headerSubtitle}>
          Manage detailing bays, operating schedules, holiday blackouts, and slot allocation rules.
        </p>
      </div>

      <div className={styles.grid}>
        {/* ── 1. Detailing Bays ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🏛 Detailing Bays & Workstations</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Active bays appear in the booking engine for parallel appointment slots.
          </p>

          <div className={styles.bayList}>
            {resources.map((r) => (
              <div key={r.id} className={styles.bayRow}>
                <div>
                  <span className={styles.bayName}>{r.name}</span>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    ID: {r.id.slice(-6).toUpperCase()}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    background: r.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${r.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: r.isActive ? '#10B981' : '#EF4444',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  disabled={actionLoading}
                  onClick={() => handleToggleBay(r.id, r.isActive)}
                >
                  {r.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <input
              type="text"
              placeholder="New Bay Name (e.g. Bay 3 - Wash Bay)"
              value={newBayName}
              onChange={(e) => setNewBayName(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-xs)',
              }}
            />
            <button
              type="button"
              onClick={handleCreateBay}
              disabled={actionLoading || !newBayName.trim()}
              style={{
                background: 'var(--gradient-gold)',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Bay
            </button>
          </div>
        </div>

        {/* ── 2. Operating Schedule (Business Hours) ── */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className={styles.cardTitle}>⏱ Operating Schedule</h2>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Click on any day to modify operating shifts or toggle studio closure.
          </p>

          <div className={styles.hoursList}>
            {[1, 2, 3, 4, 5, 6, 0].map((dIndex) => {
              const h = hours.find((hour) => hour.dayOfWeek === dIndex);
              const isEditing = editingDay === dIndex;

              return (
                <div key={dIndex} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.hourDay}>{days[dIndex]}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span className={h ? styles.hourTime : undefined} style={!h ? { color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' } : undefined}>
                        {h ? `${h.startTime} – ${h.endTime}` : 'Closed (Deep Cleaning)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditHour(dIndex)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-accent-text)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && (
                    <div style={{
                      marginTop: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-3)',
                      alignItems: 'center',
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={editIsClosed}
                          onChange={(e) => setEditIsClosed(e.target.checked)}
                        />
                        Mark Closed
                      </label>

                      {!editIsClosed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            style={{
                              backgroundColor: 'var(--color-bg-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text-primary)',
                              fontSize: '11px',
                              padding: '2px 6px',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>to</span>
                          <input
                            type="time"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            style={{
                              backgroundColor: 'var(--color-bg-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text-primary)',
                              fontSize: '11px',
                              padding: '2px 6px',
                            }}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveHours}
                        disabled={actionLoading}
                        style={{
                          marginLeft: 'auto',
                          background: 'var(--gradient-gold)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '3px 10px',
                          color: '#0A0A0A',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Blocked Dates Manager ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📅 Studio Blocked Dates & Holidays</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Block dates for national holidays, studio maintenance, or track events.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-xs)',
              }}
            />
            <input
              type="text"
              placeholder="Reason (e.g. Diwali Holiday)"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              style={{
                flex: 1,
                minWidth: '160px',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-xs)',
              }}
            />
            <button
              type="button"
              onClick={handleAddBlockedDate}
              disabled={actionLoading || !newBlockedDate}
              style={{
                background: 'var(--gradient-gold)',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Block Date
            </button>
          </div>

          <div style={{ marginTop: 'var(--space-2)', maxHeight: '180px', overflowY: 'auto' }}>
            {blockedDates.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                No dates currently blocked. All business days accept appointments.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {blockedDates.map((bd) => (
                  <div
                    key={bd.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--color-accent-text)' }}>{bd.date}</strong>
                      <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                        {bd.reason || 'Closed'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlockedDate(bd.date)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      ✕ Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Booking Engine Rules & Tolerances ── */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className={styles.cardTitle}>⚙️ Booking Rules & Tolerances</h2>
            {rulesSavedMsg && (
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold' }}>
                ✓ Rules Saved
              </span>
            )}
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Configure global buffer between jobs, minimum same-day lead times, and slot steps.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                Post-Service Buffer Time
              </span>
              <select
                value={rules.bufferMinutes}
                onChange={(e) => setRules({ ...rules, bufferMinutes: Number(e.target.value) })}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  padding: '4px 8px',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <option value={0}>0 mins (No buffer)</option>
                <option value={15}>15 mins (Standard)</option>
                <option value={30}>30 mins (Extended wash)</option>
                <option value={45}>45 mins (Deep sterilize)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                Min Same-Day Lead Time
              </span>
              <select
                value={rules.minLeadTimeHours}
                onChange={(e) => setRules({ ...rules, minLeadTimeHours: Number(e.target.value) })}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  padding: '4px 8px',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours (Standard)</option>
                <option value={4}>4 hours</option>
                <option value={24}>24 hours (Advance only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                Slot Granularity Step
              </span>
              <select
                value={rules.slotGranularityMinutes}
                onChange={(e) => setRules({ ...rules, slotGranularityMinutes: Number(e.target.value) })}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  padding: '4px 8px',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <option value={30}>Every 30 mins</option>
                <option value={60}>Every 60 mins (On the hour)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveRules}
              disabled={actionLoading}
              style={{
                marginTop: 'var(--space-2)',
                background: 'var(--gradient-gold)',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
            >
              Save Scheduling Rules
            </button>
          </div>
        </div>

        {/* ── 5. Studio Profile & Identity ── */}
        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <h2 className={styles.cardTitle}>🏢 Studio Profile & Identity</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Studio Name</span>
              <span className={styles.infoVal}>SMOKE M CUSTOMS</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Specialization</span>
              <span className={styles.infoVal}>Luxury Automotive Detailing & Paint Protection</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Studio Hotline</span>
              <span className={styles.infoVal}>+91 98765 43210</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>WhatsApp Concierge</span>
              <span className={styles.infoVal}>+91 98765 43210</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Official Email</span>
              <span className={styles.infoVal}>concierge@smokecustoms.com</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>GST Registration</span>
              <span className={styles.infoVal}>29AAACS1234F1Z5</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Location Address</span>
              <span className={styles.infoVal}>Plot 42, Industrial Area, Bangalore 560068, India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
