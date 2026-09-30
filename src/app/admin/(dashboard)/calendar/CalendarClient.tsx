'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/common/Icons';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
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
  const [, setLoading] = useState(false);

  // Modal for blocking dates
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDateInput, setBlockDateInput] = useState(selectedDate);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Helper: Week days helper (Monday to Sunday)
  const getWeekDates = (baseDate: string) => {
    const d = new Date(`${baseDate}T12:00:00Z`);
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

  const fetchCalendarData = async (dateStr: string, mode: 'day' | 'week' | 'month') => {
    setLoading(true);
    try {
      const monthStr = dateStr.slice(0, 7); // YYYY-MM
      let queryUrl = `/api/admin/calendar?month=${monthStr}&date=${dateStr}`;

      if (mode === 'week') {
        const week = getWeekDates(dateStr);
        const startDate = `${week[0].iso}T00:00:00.000Z`;
        const endDate = `${week[6].iso}T23:59:59.999Z`;
        queryUrl = `/api/admin/calendar?month=${monthStr}&startDate=${startDate}&endDate=${endDate}`;
      } else if (mode === 'month') {
        const [y, m] = dateStr.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const startDate = `${monthStr}-01T00:00:00.000Z`;
        const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
        queryUrl = `/api/admin/calendar?month=${monthStr}&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(queryUrl);
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

  // Fetch data whenever selectedDate or viewMode changes
  useEffect(() => {
    fetchCalendarData(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

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
    if (!confirm(`Are you sure you want to unblock ${date} for studio bookings?`)) return;
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

  // Helper: Display Date Format
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00Z`);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper: Format Time Slot
  const formatTimeSlot = (startIso: string, endIso: string) => {
    const start = new Date(startIso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = new Date(endIso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${start} – ${end}`;
  };

  // Helper: Format Duration (e.g. 8 hrs)
  const formatDuration = (mins: number) => {
    if (!mins) return '—';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs > 0 && remainder > 0) return `${hrs}h ${remainder}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // Helper: Client Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'C').toUpperCase();
  };

  // Helper: Status Formatter
  const formatStatus = (st: string) => {
    switch (st) {
      case 'PENDING_CONFIRMATION':
        return 'Pending Confirmation';
      case 'CONFIRMED':
        return 'Confirmed Slot';
      case 'IN_PROGRESS':
        return 'In Bay Progress';
      case 'COMPLETED':
        return 'Job Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  const getStatusBorderClass = (st: string) => {
    switch (st) {
      case 'PENDING_CONFIRMATION':
        return styles.borderPending;
      case 'CONFIRMED':
        return styles.borderConfirmed;
      case 'IN_PROGRESS':
        return styles.borderInProgress;
      case 'COMPLETED':
        return styles.borderCompleted;
      default:
        return styles.borderCancelled;
    }
  };

  const getStatusPillClass = (st: string) => {
    switch (st) {
      case 'PENDING_CONFIRMATION':
        return styles.statusPending;
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'COMPLETED':
        return styles.statusCompleted;
      default:
        return styles.statusCancelled;
    }
  };

  const weekList = getWeekDates(selectedDate);
  const isBlocked = blockedDates.includes(selectedDate);

  // ── Metrics Calculation for Active Selection ──
  const dailyBookings = useMemo(() => {
    return bookings.filter((b) => b.startAt.startsWith(selectedDate));
  }, [bookings, selectedDate]);

  const metrics = useMemo(() => {
    const totalDayJobs = dailyBookings.length;
    const occupiedBays = new Set(dailyBookings.map((b) => b.resourceName)).size;
    const pendingConfirmationCount = dailyBookings.filter(
      (b) => b.status === 'PENDING_CONFIRMATION'
    ).length;
    return {
      totalDayJobs,
      occupiedBays,
      totalBays: resources.length,
      pendingConfirmationCount,
    };
  }, [dailyBookings, resources]);

  // ── Month Grid View Helper ──
  const renderMonthDays = () => {
    const [year, month] = selectedDate.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const cells = [];
    // Blank padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div key={`blank-${i}`} className={styles.dayCell} style={{ opacity: 0.25, cursor: 'default' }} />
      );
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIsBlocked = blockedDates.includes(dStr);
      const dayBookings = bookings.filter((b) => b.startAt.startsWith(dStr));
      const isSelected = selectedDate === dStr;
      const isToday = dStr === todayStr;

      cells.push(
        <div
          key={dStr}
          className={`${styles.dayCell} ${isSelected ? styles.selectedDayCell : ''} ${
            isToday ? styles.todayDayCell : ''
          } ${dayIsBlocked ? styles.blockedDayCell : ''}`}
          onClick={() => {
            setSelectedDate(dStr);
            setViewMode('day');
          }}
        >
          <div className={styles.dayCellTop}>
            <span className={styles.dayNumber}>{day}</span>
            {dayIsBlocked && <span className={styles.blockedDayPill}>BLOCKED</span>}
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

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO OPERATIONS DISPATCH</span>
            <span className={styles.eyebrowDot} />
            <span>BAY SCHEDULE & OCCUPANCY</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Bay Calendar</h1>
          <p className={styles.pageSubtitle}>
            Real-time bay occupancy, slot collisions, and holiday blackout management.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/slots" className={styles.secondaryActionBtn}>
            <Icon.Bay size={15} />
            <span>Slot & Bay Manager &rarr;</span>
          </Link>
          <Link href="/admin/bookings" className={styles.secondaryActionBtn}>
            <Icon.Calendar size={15} />
            <span>Manage Bookings List &rarr;</span>
          </Link>
          <button
            type="button"
            className={styles.blockBtn}
            onClick={() => {
              setBlockDateInput(selectedDate);
              setShowBlockModal(true);
            }}
          >
            <Icon.Lock size={14} />
            <span>Block Studio Date</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Daily Bay Bookings</span>
            <span className={styles.metricValue}>{metrics.totalDayJobs}</span>
            <span className={styles.metricSubtext}>
              {metrics.totalDayJobs === 1 ? '1 active job scheduled' : `${metrics.totalDayJobs} active jobs scheduled`}
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Calendar size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Bay Capacity</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.occupiedBays} / {metrics.totalBays}
            </span>
            <span className={styles.metricSubtext}>Detailing rigs currently engaged</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Bay size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Operational Status</span>
            <span
              className={styles.metricValue}
              style={{
                color: isBlocked ? '#DC2626' : '#16A34A',
                fontSize: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              {isBlocked ? 'Date Blocked' : 'Studio Active'}
            </span>
            <span className={styles.metricSubtext}>
              {isBlocked ? 'Online customer booking halted' : 'Public booking intake online'}
            </span>
          </div>
          <div
            className={`${styles.metricIconWrap} ${
              isBlocked ? styles.metricIconBlocked : styles.metricIconOperational
            }`}
          >
            {isBlocked ? <Icon.Lock size={20} /> : <Icon.Check size={20} />}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Pending Intake</span>
            <span
              className={styles.metricValue}
              style={{
                color: metrics.pendingConfirmationCount > 0 ? '#B45309' : '#0F172A',
              }}
            >
              {metrics.pendingConfirmationCount}
            </span>
            <span className={styles.metricSubtext}>Awaiting studio intake approval</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconWarning}`}>
            <Icon.AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* ── Date Controls & Views Toolbar ── */}
      <div className={styles.controlsCard}>
        <div className={styles.navGroup}>
          <button type="button" className={styles.navBtn} onClick={handlePrev} title="Previous slot">
            &larr; Prev
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.todayBtn}`}
            onClick={handleToday}
            title="Jump to current day"
          >
            Today
          </button>
          <button type="button" className={styles.navBtn} onClick={handleNext} title="Next slot">
            Next &rarr;
          </button>

          <div className={styles.currentDateBadge}>
            <Icon.Calendar size={15} color="#B45309" />
            <span>
              {viewMode === 'day' && formatDisplayDate(selectedDate)}
              {viewMode === 'week' && `Week of ${weekList[0].dayNum} ${weekList[0].monthShort} – ${weekList[6].dayNum} ${weekList[6].monthShort}`}
              {viewMode === 'month' &&
                new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
            </span>
          </div>

          <div className={styles.datePickerWrap}>
            <input
              type="date"
              className={styles.formInputDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Jump to specific date"
            />
          </div>
        </div>

        <div className={styles.viewTabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${viewMode === 'day' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('day')}
          >
            Bay Timeline (Day)
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${viewMode === 'week' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('week')}
          >
            7-Day Week Lanes
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${viewMode === 'month' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('month')}
          >
            Monthly Overview
          </button>
        </div>
      </div>

      {/* ── Blocked Date Banner ── */}
      {isBlocked && (
        <div className={styles.blockedBanner}>
          <div className={styles.blockedBannerLeft}>
            <div className={styles.blockedBannerIcon}>
              <Icon.Lock size={16} />
            </div>
            <div>
              <div className={styles.blockedBannerTitle}>
                Date Blackout Active ({selectedDate})
              </div>
              <div className={styles.blockedBannerSub}>
                This date is blocked for studio operations. No public appointments or online intake slots are accepted.
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.unblockBtn}
            onClick={() => handleUnblockDate(selectedDate)}
            disabled={actionLoading}
          >
            {actionLoading ? 'Unblocking...' : 'Unblock This Date'}
          </button>
        </div>
      )}

      {/* ── DAY TIMELINE VIEW (Bays Grid) ── */}
      {viewMode === 'day' && (
        <div className={styles.baysContainer}>
          {resources.map((res) => {
            const bayBookings = bookings.filter(
              (b) => b.resourceName === res.name && b.startAt.startsWith(selectedDate)
            );
            const isOccupied = bayBookings.length > 0;

            return (
              <div key={res.id} className={styles.bayCard}>
                <div className={styles.bayHeader}>
                  <div className={styles.bayTitleWrap}>
                    <div className={styles.bayIconBadge}>
                      <Icon.Bay size={16} />
                    </div>
                    <div>
                      <div className={styles.bayTitle}>{res.name}</div>
                      <div className={styles.baySubtitle}>Dedicated Detailing & Ceramic Rig</div>
                    </div>
                  </div>

                  <span
                    className={`${styles.bayCountBadge} ${
                      isOccupied ? styles.bayCountBadgeOccupied : styles.bayCountBadgeEmpty
                    }`}
                  >
                    {bayBookings.length} {bayBookings.length === 1 ? 'Job' : 'Jobs'} Scheduled
                  </span>
                </div>

                <div className={styles.slotList}>
                  {bayBookings.length === 0 ? (
                    <div className={styles.emptyBay}>
                      <div className={styles.emptyBayIconWrap}>
                        <Icon.Bay size={24} />
                      </div>
                      <h4 className={styles.emptyBayTitle}>{res.name} Ready for Intake</h4>
                      <p className={styles.emptyBayDesc}>
                        No appointments scheduled in {res.name} on {formatDisplayDate(selectedDate)}.
                      </p>
                    </div>
                  ) : (
                    bayBookings.map((b) => {
                      const timeString = formatTimeSlot(b.startAt, b.endAt);
                      const borderClass = getStatusBorderClass(b.status);
                      const statusPillClass = getStatusPillClass(b.status);

                      return (
                        <div key={b.id} className={`${styles.bookingCard} ${borderClass}`}>
                          {/* Top Row: Time & Status */}
                          <div className={styles.bookingCardTop}>
                            <div className={styles.timeSlotWrap}>
                              <span className={styles.timeSlotBadge}>
                                <Icon.Clock size={12} />
                                <span>{timeString}</span>
                              </span>
                              <span className={styles.durationBadge}>
                                {formatDuration(b.durationMinutes)}
                              </span>
                            </div>

                            <span className={`${styles.statusPill} ${statusPillClass}`}>
                              <span className={styles.statusDot} />
                              <span>{formatStatus(b.status)}</span>
                            </span>
                          </div>

                          {/* Customer Row */}
                          <div className={styles.bookingCustomerRow}>
                            <div className={styles.customerAvatar}>
                              {getInitials(b.customerName)}
                            </div>
                            <div className={styles.customerMeta}>
                              <span className={styles.customerName}>{b.customerName}</span>
                              <span className={styles.customerPhone}>{b.customerPhone}</span>
                            </div>
                          </div>

                          {/* Treatment & Vehicle Row */}
                          <div className={styles.bookingTreatmentRow}>
                            <div className={styles.treatmentMeta}>
                              <span className={styles.treatmentBadge}>
                                <Icon.Car size={13} />
                                <span>{b.vehicleText || 'Unspecified Vehicle'}</span>
                              </span>
                              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.8125rem' }}>
                                {b.serviceName || b.packageName || 'Detailing Treatment'}
                              </span>
                            </div>

                            <div className={styles.bookingActionHub}>
                              <WhatsAppCTA
                                phone={b.customerPhone}
                                message={`Hello ${b.customerName}, Smoke M Customs checking in regarding your ${b.serviceName || 'detailing'} appointment on ${formatDisplayDate(b.startAt)}.`}
                                iconOnly
                                size="sm"
                                variant="icon"
                                ariaLabel={`WhatsApp ${b.customerName}`}
                                logCommunication={{
                                  customerId: b.id,
                                  summary: `Outbound WhatsApp chat opened regarding booking on ${formatDisplayDate(b.startAt)}`,
                                }}
                              />
                              <Link href={`/admin/bookings/${b.id}`} className={styles.manageSlotBtn}>
                                <span>Manage &rarr;</span>
                              </Link>
                            </div>
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

      {/* ── 7-DAY WEEK VIEW WITH RESOURCE LANES ── */}
      {viewMode === 'week' && (
        <div className={styles.weekGrid}>
          {weekList.map((wDay) => {
            const dayIsBlocked = blockedDates.includes(wDay.iso);
            const isToday = wDay.iso === new Date().toISOString().split('T')[0];

            return (
              <div
                key={wDay.iso}
                className={`${styles.weekCol} ${isToday ? styles.weekColToday : ''}`}
              >
                <div
                  className={styles.weekColHeader}
                  onClick={() => {
                    setSelectedDate(wDay.iso);
                    setViewMode('day');
                  }}
                  title="Click to jump to Day Timeline"
                >
                  <div className={styles.weekDayName}>{wDay.dayName}</div>
                  <div className={styles.weekDateRow}>
                    <span className={styles.weekDateNum}>{wDay.dayNum}</span>
                    <span className={styles.weekDateMonth}>{wDay.monthShort}</span>
                  </div>
                  {isToday && <span className={styles.todayTag}>Today</span>}
                  {dayIsBlocked && <span className={styles.weekBlockedBadge}>BLOCKED</span>}
                </div>

                <div className={styles.weekColBody}>
                  {resources.map((res) => {
                    const laneBookings = bookings.filter(
                      (b) => b.resourceName === res.name && b.startAt.startsWith(wDay.iso)
                    );

                    return (
                      <div key={res.id} className={styles.weekBayLane}>
                        <div className={styles.weekBayTitle}>
                          <Icon.Bay size={12} />
                          <span>{res.name}</span>
                        </div>

                        {laneBookings.length === 0 ? (
                          <div className={styles.weekEmptySlot}>No jobs</div>
                        ) : (
                          laneBookings.map((b) => {
                            const startTime = new Date(b.startAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            return (
                              <div
                                key={b.id}
                                className={styles.weekBookingCard}
                                onClick={() => {
                                  setSelectedDate(wDay.iso);
                                  setViewMode('day');
                                }}
                              >
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

      {/* ── MONTH GRID VIEW ── */}
      {viewMode === 'month' && (
        <div className={styles.monthCard}>
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

      {/* ── Block Date Modal ── */}
      {showBlockModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBlockModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalHeaderTitle}>Block Studio Date</h3>
                <p className={styles.modalHeaderSubtitle}>
                  Set a blackout date to halt online customer intake for studio maintenance or holidays.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowBlockModal(false)}
                title="Close"
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Target Blackout Date</label>
              <input
                type="date"
                className={styles.formInput}
                value={blockDateInput}
                onChange={(e) => setBlockDateInput(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Blackout Reason (Optional)</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Studio Deep Clean, Equipment Calibration, Diwali"
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
              />
            </div>

            <div className={styles.modalWarningNote}>
              <strong>Notice:</strong> Blocking this date will immediately disable customer intake on the public booking portal for this day.
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowBlockModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleBlockDate}
                disabled={actionLoading || !blockDateInput}
              >
                <Icon.Lock size={14} />
                <span>{actionLoading ? 'Blocking...' : 'Confirm Blackout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
