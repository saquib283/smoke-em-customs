'use client';

import React, { useState, useEffect } from 'react';
import styles from './calendar.module.css';

interface Resource {
  id: string;
  name: string;
  isActive: boolean;
}

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

interface CalendarClientProps {
  initialResources: Resource[];
  initialBlockedDates: string[];
  initialBookings: BookingItem[];
}

export function CalendarClient({
  initialResources,
  initialBlockedDates,
  initialBookings,
}: CalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [resources] = useState<Resource[]>(initialResources);
  const [blockedDates, setBlockedDates] = useState<string[]>(initialBlockedDates);
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [loading, setLoading] = useState(false);

  // Modal for blocking dates
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDateInput, setBlockDateInput] = useState(selectedDate);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data whenever selectedDate changes
  useEffect(() => {
    fetchCalendarData(selectedDate);
  }, [selectedDate]);

  const fetchCalendarData = async (dateStr: string) => {
    setLoading(true);
    try {
      const monthStr = dateStr.slice(0, 7); // YYYY-MM
      const res = await fetch(`/api/admin/calendar?month=${monthStr}&date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setBlockedDates(data.blockedDates || []);
        setBookings(data.bookings || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    if (viewMode === 'week') {
      d.setUTCDate(d.getUTCDate() - 7);
    } else if (viewMode === 'month') {
      d.setUTCMonth(d.getUTCMonth() - 1);
    } else {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    if (viewMode === 'week') {
      d.setUTCDate(d.getUTCDate() + 7);
    } else if (viewMode === 'month') {
      d.setUTCMonth(d.getUTCMonth() + 1);
    } else {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleBlockDate = async () => {
    if (!blockDateInput) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BLOCK_DATE',
          date: blockDateInput,
          reason: blockReasonInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedDates((prev) => [...prev, blockDateInput]);
        setShowBlockModal(false);
        setBlockReasonInput('');
      } else {
        alert(data.error || 'Failed to block date');
      }
    } catch {
      alert('Error blocking date');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockDate = async (date: string) => {
    if (!confirm(`Are you sure you want to unblock ${date}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNBLOCK_DATE',
          date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedDates((prev) => prev.filter((d) => d !== date));
      } else {
        alert(data.error || 'Failed to unblock date');
      }
    } catch {
      alert('Error unblocking date');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00Z`);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Week days helper (Monday to Sunday)
  const getWeekDates = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    const day = d.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setUTCDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setUTCDate(monday.getUTCDate() + i);
      const iso = cur.toISOString().split('T')[0];
      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = cur.getUTCDate();
      const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });
      weekDays.push({ iso, dayName, dayNum, monthShort });
    }
    return weekDays;
  };

  const isBlocked = blockedDates.includes(selectedDate);

  // Month grid helper
  const renderMonthDays = () => {
    const [year, month] = selectedDate.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells = [];
    // Blank padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`blank-${i}`} className={styles.dayCell} style={{ opacity: 0.2 }} />);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIsBlocked = blockedDates.includes(dStr);
      const dayBookings = bookings.filter((b) => b.startAt.startsWith(dStr));
      const isSelected = selectedDate === dStr;

      cells.push(
        <div
          key={dStr}
          className={`${styles.dayCell} ${isSelected ? styles.selectedDayCell : ''} ${
            dayIsBlocked ? styles.blockedDayCell : ''
          }`}
          onClick={() => {
            setSelectedDate(dStr);
            setViewMode('day');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className={styles.dayNumber}>{day}</span>
            {dayIsBlocked && <span className={styles.blockedTag}>BLOCKED</span>}
          </div>

          {dayBookings.length > 0 && (
            <span className={styles.dayBookingsPill}>
              {dayBookings.length} {dayBookings.length === 1 ? 'Job' : 'Jobs'}
            </span>
          )}
        </div>
      );
    }

    return cells;
  };

  const weekList = getWeekDates();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Studio Bay Calendar</h1>
          <p className={styles.headerSubtitle}>
            Real-time bay occupancy, slot collisions, and holiday blackout management.
          </p>
        </div>

        <button
          className={styles.blockBtn}
          onClick={() => {
            setBlockDateInput(selectedDate);
            setShowBlockModal(true);
          }}
        >
          🚫 Block Studio Date
        </button>
      </div>

      {/* Date Controls & Views Toolbar */}
      <div className={styles.controlsBar}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={handlePrev}>
            ← Prev
          </button>
          <button className={styles.navBtn} onClick={handleToday}>
            Today
          </button>
          <button className={styles.navBtn} onClick={handleNext}>
            Next →
          </button>
          <span className={styles.currentDateLabel}>
            {viewMode === 'day' && formatDisplayDate(selectedDate)}
            {viewMode === 'week' && `Week of ${weekList[0].dayNum} ${weekList[0].monthShort}`}
            {viewMode === 'month' &&
              new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
          </span>
          <input
            type="date"
            className={styles.formInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className={styles.viewTabs}>
          <button
            className={`${styles.tabBtn} ${viewMode === 'day' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('day')}
          >
            Bay Timeline (Day)
          </button>
          <button
            className={`${styles.tabBtn} ${viewMode === 'week' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('week')}
          >
            7-Day Week Lanes
          </button>
          <button
            className={`${styles.tabBtn} ${viewMode === 'month' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('month')}
          >
            Monthly Overview
          </button>
        </div>
      </div>

      {/* Blocked Date Banner */}
      {isBlocked && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
            ⚠️ This date ({selectedDate}) is blocked for studio operations. No public bookings are accepted.
          </span>
          <button
            className={styles.tabBtn}
            onClick={() => handleUnblockDate(selectedDate)}
            disabled={actionLoading}
          >
            Unblock This Date
          </button>
        </div>
      )}

      {/* DAY TIMELINE VIEW */}
      {viewMode === 'day' && (
        <div className={styles.baysContainer}>
          {resources.map((res) => {
            const bayBookings = bookings.filter((b) => b.resourceName === res.name);
            return (
              <div key={res.id} className={styles.bayCard}>
                <div className={styles.bayHeader}>
                  <div className={styles.bayTitle}>🏛 {res.name}</div>
                  <span className={styles.bayCount}>
                    {bayBookings.length} {bayBookings.length === 1 ? 'Job' : 'Jobs'} Scheduled
                  </span>
                </div>

                <div className={styles.slotList}>
                  {bayBookings.length === 0 ? (
                    <div className={styles.emptyBay}>
                      No appointments scheduled in {res.name} on this date.
                    </div>
                  ) : (
                    bayBookings.map((b) => {
                      const startTime = new Date(b.startAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTime = new Date(b.endAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div key={b.id} className={styles.bookingBlock}>
                          <div className={styles.bookingBlockHeader}>
                            <span className={styles.bookingTime}>
                              {startTime} – {endTime}
                            </span>
                            <span className={styles.bookingStatus}>{b.status.replace('_', ' ')}</span>
                          </div>
                          <div className={styles.bookingClient}>{b.customerName}</div>
                          <div className={styles.bookingMeta}>
                            🚗 {b.vehicleText || 'Vehicle TBD'} • {b.serviceName || b.packageName || 'Detailing'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7-DAY WEEK VIEW WITH RESOURCE LANES */}
      {viewMode === 'week' && (
        <div className={styles.weekGrid}>
          {weekList.map((wDay) => {
            const dayIsBlocked = blockedDates.includes(wDay.iso);
            const isToday = wDay.iso === new Date().toISOString().split('T')[0];

            return (
              <div key={wDay.iso} className={styles.weekCol}>
                <div
                  className={styles.weekColHeader}
                  onClick={() => {
                    setSelectedDate(wDay.iso);
                    setViewMode('day');
                  }}
                  title="Click to switch to Day Timeline"
                >
                  <div className={styles.weekDayTitle}>
                    {wDay.dayName} {isToday && '(Today)'}
                  </div>
                  <div className={styles.weekDateTitle}>
                    {wDay.dayNum} {wDay.monthShort}
                  </div>
                  {dayIsBlocked && <span className={styles.blockedTag}>BLOCKED</span>}
                </div>

                <div className={styles.weekColBody}>
                  {resources.map((res) => {
                    const laneBookings = bookings.filter(
                      (b) => b.resourceName === res.name && b.startAt.startsWith(wDay.iso)
                    );

                    return (
                      <div key={res.id} className={styles.weekBayLane}>
                        <div className={styles.weekBayTitle}>🏛 {res.name}</div>
                        {laneBookings.length === 0 ? (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            No bookings
                          </div>
                        ) : (
                          laneBookings.map((b) => {
                            const startTime = new Date(b.startAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            return (
                              <div key={b.id} className={styles.weekBookingCard}>
                                <div className={styles.weekBookingTime}>{startTime}</div>
                                <div className={styles.weekBookingCustomer}>{b.customerName}</div>
                                <div className={styles.weekBookingMeta}>
                                  {b.vehicleText || 'Car'} &bull;{' '}
                                  {b.serviceName || b.packageName || 'Detailing'}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div>
          <div className={styles.monthGrid}>
            <div className={styles.weekdayHeader}>Sun</div>
            <div className={styles.weekdayHeader}>Mon</div>
            <div className={styles.weekdayHeader}>Tue</div>
            <div className={styles.weekdayHeader}>Wed</div>
            <div className={styles.weekdayHeader}>Thu</div>
            <div className={styles.weekdayHeader}>Fri</div>
            <div className={styles.weekdayHeader}>Sat</div>
            {renderMonthDays()}
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBlockModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>Block Studio Date</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Blocking a date prevents any customers from booking online for that entire day.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Target Date</label>
              <input
                type="date"
                className={styles.formInput}
                value={blockDateInput}
                onChange={(e) => setBlockDateInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Reason (Optional)</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Studio Maintenance, Deep Clean, Diwali Holiday"
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.tabBtn}
                onClick={() => setShowBlockModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={styles.blockBtn}
                onClick={handleBlockDate}
                disabled={actionLoading || !blockDateInput}
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
