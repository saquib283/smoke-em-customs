'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import { Select, type SelectOption } from '@/components/ui';
import styles from './bookings.module.css';

type DatePreset = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

const BOOKING_SORT_OPTIONS: SelectOption<'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'BAY'>[] = [
  { value: 'DATE_DESC', label: 'Latest Slot First', icon: <Icon.Clock size={14} /> },
  { value: 'DATE_ASC', label: 'Earliest Slot First', icon: <Icon.Clock size={14} /> },
  { value: 'NAME_ASC', label: 'Client Name (A–Z)', icon: <Icon.User size={14} /> },
  { value: 'BAY', label: 'Assigned Bay', icon: <Icon.Bay size={14} /> },
];

export interface BookingItem {
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
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'BAY'>('DATE_DESC');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null);


  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
    const active = bookings.filter((b) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    return { total, pending, active, completed };
  }, [bookings]);

  // ── Filter Tabs ──
  const filterTabs = [
    { key: 'ALL', label: 'All Bookings', count: metrics.total },
    { key: 'PENDING_CONFIRMATION', label: 'Pending', count: metrics.pending, alert: true },
    { key: 'CONFIRMED', label: 'Confirmed', count: bookings.filter((b) => b.status === 'CONFIRMED').length },
    { key: 'IN_PROGRESS', label: 'In Progress', count: bookings.filter((b) => b.status === 'IN_PROGRESS').length },
    { key: 'RESCHEDULED', label: 'Rescheduled', count: bookings.filter((b) => b.status === 'RESCHEDULED').length },
    { key: 'COMPLETED', label: 'Completed', count: metrics.completed },
    { key: 'NO_SHOW', label: 'No-Show', count: bookings.filter((b) => b.status === 'NO_SHOW').length },
    { key: 'CANCELLED', label: 'Cancelled', count: bookings.filter((b) => b.status === 'CANCELLED').length },
  ];

  // ── Filtered Bookings ──
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;

      // Date preset filter
      if (datePreset !== 'ALL') {
        const bookingDate = new Date(b.startAt);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (datePreset === 'TODAY') {
          if (!b.startAt.startsWith(todayStr)) return false;
        } else if (datePreset === 'THIS_WEEK') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          if (bookingDate < weekStart || bookingDate >= weekEnd) return false;
        } else if (datePreset === 'THIS_MONTH') {
          const monthStr = now.toISOString().slice(0, 7);
          if (!b.startAt.startsWith(monthStr)) return false;
        }
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = b.customerName.toLowerCase().includes(q);
        const matchPhone = b.customerPhone.includes(q);
        const matchVehicle = b.vehicleText ? b.vehicleText.toLowerCase().includes(q) : false;
        const matchService = b.serviceName ? b.serviceName.toLowerCase().includes(q) : false;
        const matchPackage = b.packageName ? b.packageName.toLowerCase().includes(q) : false;
        const matchBay = b.resourceName ? b.resourceName.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchVehicle && !matchService && !matchPackage && !matchBay) return false;
      }
      return true;
    });
  }, [bookings, filterStatus, searchTerm, datePreset]);

  // ── Sorting ──
  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      if (sortBy === 'DATE_DESC') return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
      if (sortBy === 'DATE_ASC') return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      if (sortBy === 'NAME_ASC') return a.customerName.localeCompare(b.customerName);
      if (sortBy === 'BAY') return a.resourceName.localeCompare(b.resourceName);
      return 0;
    });
    return list;
  }, [filteredBookings, sortBy]);

  // ── Pagination ──
  const totalPages = Math.ceil(sortedBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBookings.slice(start, start + pageSize);
  }, [sortedBookings, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filterStatus, searchTerm, datePreset, sortBy]);

  // ── Quick Row Action Handler ──
  const handleQuickStatus = async (id: string, action: 'CONFIRM' | 'START_JOB' | 'COMPLETE_JOB') => {
    setRowActionLoading(id);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, action }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: data.booking.status } : b))
        );
      }
    } catch {
      //
    } finally {
      setRowActionLoading(null);
    }
  };

  // ── Bulk Actions ──
  const handleBulkAction = async (action: 'CONFIRM' | 'CANCEL' | 'NO_SHOW') => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch('/api/admin/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: id,
              action,
              reason: action === 'CANCEL' ? 'Cancelled via studio bulk operation' : undefined,
            }),
          })
        )
      );
      const targetStatus =
        action === 'CONFIRM' ? 'CONFIRMED' : action === 'CANCEL' ? 'CANCELLED' : 'NO_SHOW';
      setBookings((prev) =>
        prev.map((b) => (selectedIds.includes(b.id) ? { ...b, status: targetStatus } : b))
      );
      setSelectedIds([]);
    } catch {
      //
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedBookings.map((b) => b.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ── Client Initials Generator ──
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'C').toUpperCase();
  };

  // ── Duration Formatter (480 mins -> 8 hrs) ──
  const formatDuration = (mins: number) => {
    if (!mins) return '—';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs > 0 && remainder > 0) return `${hrs}h ${remainder}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // ── Status Label Formatter ──
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
      case 'RESCHEDULED':
        return 'Rescheduled';
      case 'NO_SHOW':
        return 'No-Show';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  // ── Date Formatter ──
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };



  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Vehicle', 'Service / Package', 'Assigned Bay', 'Date', 'Time', 'Duration (mins)', 'Status'];
    const rows = filteredBookings.map((b) => {
      const { date, time } = formatDateTime(b.startAt);
      return [
        `"#${b.id.slice(-6).toUpperCase()}"`,
        `"${b.customerName.replace(/"/g, '""')}"`,
        `"${b.customerPhone}"`,
        `"${(b.vehicleText || 'Unspecified').replace(/"/g, '""')}"`,
        `"${(b.serviceName || b.packageName || 'Detailing').replace(/"/g, '""')}"`,
        `"${b.resourceName}"`,
        `"${date}"`,
        `"${time}"`,
        b.durationMinutes,
        `"${b.status}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO OPERATIONS DISPATCH</span>
            <span className={styles.eyebrowDot} />
            <span>BAY SCHEDULE</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Bookings & Schedule</h1>
          <p className={styles.pageSubtitle}>
            Manage detailing bay assignments, customer check-ins, and job lifecycles.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/bookings/new" className={styles.primaryActionBtn}>
            <Icon.Plus size={15} />
            <span>New Booking</span>
          </Link>
          <button type="button" onClick={handleExportCSV} className={styles.exportBtn} title="Download CSV spreadsheet of current bookings">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <Link href="/admin/calendar" className={styles.secondaryActionBtn || styles.exportBtn}>
            <Icon.Calendar size={15} />
            <span>Bay Calendar</span>
          </Link>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Bookings</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>All scheduled bay sessions</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Calendar size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Pending Confirmation</span>
            <span className={styles.metricValue} style={{ color: metrics.pending > 0 ? '#B45309' : '#0F172A' }}>
              {metrics.pending}
            </span>
            <span className={styles.metricSubtext}>Awaiting studio approval</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconWarning}`}>
            <Icon.AlertTriangle size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Active in Bay</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.active}
            </span>
            <span className={styles.metricSubtext}>Confirmed & in progress</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Bay size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Jobs Completed</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.completed}
            </span>
            <span className={styles.metricSubtext}>Finished studio treatments</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconCompleted}`}>
            <Icon.Check size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Status Category Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
            {filterTabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              const hasAlert = tab.alert && tab.count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setFilterStatus(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`${styles.tabBadge} ${
                      isActive ? '' : hasAlert ? styles.tabBadgeAlert : styles.tabBadgeInactive
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Row */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon.Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by customer name, phone number, vehicle, service, bay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <Icon.Cross size={13} />
              </button>
            )}
          </div>

          <div className={styles.filterControlsRight}>
            {/* Date Quick-Filter Presets */}
            <div className={styles.datePresets}>
              {(['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`${styles.presetBtn} ${datePreset === preset ? styles.presetBtnActive : ''}`}
                  onClick={() => setDatePreset(preset)}
                >
                  {preset === 'ALL' ? 'All Dates' : preset === 'TODAY' ? 'Today' : preset === 'THIS_WEEK' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className={styles.sortWrapper}>
              <Select<'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'BAY'>
                size="sm"
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={BOOKING_SORT_OPTIONS}
              />
            </div>

            <div className={styles.filterMeta}>
              <span>
                Showing <strong>{filteredBookings.length}</strong> of {bookings.length} jobs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Floating Toolbar ── */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkInfo}>
            <span className={styles.bulkBadge}>{selectedIds.length}</span>
            <span>booking{selectedIds.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={`${styles.bulkBtn} ${styles.bulkBtnConfirm}`}
              disabled={bulkLoading}
              onClick={() => handleBulkAction('CONFIRM')}
            >
              {bulkLoading ? 'Processing...' : 'Confirm Bay Slots'}
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              disabled={bulkLoading}
              onClick={() => handleBulkAction('NO_SHOW')}
            >
              Mark No-Show
            </button>
            <button
              type="button"
              className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`}
              disabled={bulkLoading}
              onClick={() => handleBulkAction('CANCEL')}
            >
              Cancel Slots
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── Bookings Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', minWidth: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={paginatedBookings.length > 0 && selectedIds.length === paginatedBookings.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ width: '200px', minWidth: '180px' }}>Customer</th>
                <th style={{ width: '150px', minWidth: '130px' }}>Vehicle</th>
                <th style={{ width: '170px', minWidth: '150px' }}>Service / Treatment</th>
                <th style={{ width: '120px', minWidth: '110px' }}>Assigned Bay</th>
                <th style={{ width: '130px', minWidth: '120px' }}>Appointment Slot</th>
                <th style={{ width: '90px', minWidth: '80px' }}>Duration</th>
                <th style={{ width: '160px', minWidth: '150px' }}>Lifecycle Status</th>
                <th style={{ width: '280px', minWidth: '280px', textAlign: 'right' }}>Workflow & Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((b, idx) => {
                const isLast = idx === paginatedBookings.length - 1;
                const { date, time } = formatDateTime(b.startAt);
                const statusClass = `status${b.status}`;
                const isSelected = selectedIds.includes(b.id);

                return (
                  <tr
                    key={b.id}
                    className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}
                    style={{ backgroundColor: isSelected ? '#F0F9FF' : undefined }}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(b.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>

                    {/* 1. Customer */}
                    <td className={styles.customerCell}>
                      <Link href={`/admin/bookings/${b.id}`} className={styles.customerWrapper} style={{ textDecoration: 'none' }}>
                        <div className={styles.customerAvatar}>
                          {getInitials(b.customerName)}
                        </div>
                        <div className={styles.customerDetails}>
                          <span className={styles.customerName}>{b.customerName}</span>
                          <span className={styles.customerPhone}>{b.customerPhone}</span>
                        </div>
                      </Link>
                    </td>

                    {/* 2. Vehicle */}
                    <td className={styles.vehicleCell}>
                      {b.vehicleText ? (
                        <span className={styles.vehicleName}>{b.vehicleText}</span>
                      ) : (
                        <span className={styles.vehicleEmpty}>Unspecified Vehicle</span>
                      )}
                    </td>

                    {/* 3. Service / Package */}
                    <td className={styles.serviceCell}>
                      <span className={styles.serviceName}>
                        {b.serviceName || b.packageName || 'Detailing Job'}
                      </span>
                    </td>

                    {/* 4. Assigned Bay */}
                    <td className={styles.bayCell}>
                      <span className={styles.bayBadge}>
                        <Icon.Bay size={13} />
                        <span>{b.resourceName}</span>
                      </span>
                    </td>

                    {/* 5. Appointment Slot */}
                    <td className={styles.slotCell}>
                      <div className={styles.slotDate}>{date}</div>
                      <div className={styles.slotTime}>{time}</div>
                    </td>

                    {/* 6. Duration */}
                    <td className={styles.durationCell}>
                      <span className={styles.durationBadge}>
                        <Icon.Clock size={11} />
                        <span>{formatDuration(b.durationMinutes)}</span>
                      </span>
                    </td>

                    {/* 7. Status */}
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusPill} ${styles[statusClass] || styles.statusPENDING_CONFIRMATION}`}>
                        <span className={styles.statusDot} />
                        <span>{formatStatus(b.status)}</span>
                      </span>
                    </td>

                    {/* 8. Action Hub */}
                    <td className={styles.actionCell}>
                      <div className={styles.actionBtns}>
                        {/* Quick 1-Click Status Trigger */}
                        {b.status === 'PENDING_CONFIRMATION' && (
                          <button
                            type="button"
                            className={styles.quickActionBtn}
                            disabled={rowActionLoading === b.id}
                            onClick={() => handleQuickStatus(b.id, 'CONFIRM')}
                            title="Confirm bay reservation"
                          >
                            <Icon.Check size={11} />
                            <span>Confirm</span>
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className={`${styles.quickActionBtn} ${styles.quickActionBtnActive}`}
                            disabled={rowActionLoading === b.id}
                            onClick={() => handleQuickStatus(b.id, 'START_JOB')}
                            title="Check vehicle in and start bay treatment"
                          >
                            <Icon.Bay size={11} />
                            <span>Start</span>
                          </button>
                        )}
                        {b.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            className={styles.quickActionBtn}
                            disabled={rowActionLoading === b.id}
                            onClick={() => handleQuickStatus(b.id, 'COMPLETE_JOB')}
                            title="Mark treatment completed"
                          >
                            <Icon.Check size={11} />
                            <span>Done</span>
                          </button>
                        )}

                        <WhatsAppCTA
                          phone={b.customerPhone}
                          message={`Hello ${b.customerName}, Smoke M Customs checking in regarding your ${b.serviceName || 'detailing'} appointment on ${date} at ${time}.`}
                          iconOnly
                          size="sm"
                          variant="icon"
                          ariaLabel={`WhatsApp ${b.customerName}`}
                          logCommunication={{
                            customerId: b.id,
                            summary: `Outbound WhatsApp chat opened regarding booking on ${date}`,
                          }}
                        />

                        <a
                          href={`tel:${b.customerPhone}`}
                          className={styles.callBtn}
                          title={`Call ${b.customerName}`}
                        >
                          <Icon.Phone size={13} />
                        </a>

                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className={styles.manageBtn}
                        >
                          <span>Manage</span>
                          <Icon.ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Calendar size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching bookings found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, clear filters, or select a different status tab.
                      </p>
                      {(searchTerm || filterStatus !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('ALL');
                            setDatePreset('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Table Summary Footer */}
        <div className={styles.paginationFooter}>
          <span className={styles.paginationInfo}>
            Showing {paginatedBookings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, sortedBookings.length)} of {sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''}
          </span>

          {totalPages > 1 && (
            <div className={styles.paginationNav}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
