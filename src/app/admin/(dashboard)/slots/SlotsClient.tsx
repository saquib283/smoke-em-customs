'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/common/Icons';
import { Select } from '@/components/ui/Select';
import styles from './slots.module.css';

// ── Types ──
export interface ResourceItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BaySlotItem {
  slotStartIso: string;
  slotEndIso: string;
  timeLabel: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'BUFFER' | 'INACTIVE_BAY';
  booking?: {
    id: string;
    customerName: string;
    customerPhone: string;
    vehicleText: string | null;
    treatmentName: string;
    status: string;
    durationMinutes: number;
    startAt: string;
    endAt: string;
    isDropoff: boolean;
  };
  block?: {
    id: string;
    reason: string | null;
    startAt: string;
    endAt: string;
  };
}

export interface DaySlotGridResult {
  date: string;
  dayOfWeek: number;
  isDayClosed: boolean;
  businessHours: { open: string; close: string } | null;
  isDateBlocked: boolean;
  blockedDateReason: string | null;
  resources: Array<{ id: string; name: string; isActive: boolean }>;
  timelineIntervals: string[];
  baySlots: Record<string, BaySlotItem[]>;
  stats: {
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    utilizationPercent: number;
  };
}

export interface BusinessHoursItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed?: boolean;
}

export interface BlockedDateItem {
  id: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

export interface BlockedTimeRangeItem {
  id: string;
  resourceId: string | null;
  resourceName: string | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
}

interface SlotsClientProps {
  initialGrid: DaySlotGridResult;
  initialResources: ResourceItem[];
  initialBusinessHours: BusinessHoursItem[];
  initialBlockedDates: BlockedDateItem[];
  initialBlockedRanges: BlockedTimeRangeItem[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SlotsClient({
  initialGrid,
  initialResources,
  initialBusinessHours,
  initialBlockedDates,
  initialBlockedRanges,
}: SlotsClientProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'timeline' | 'bays' | 'schedule' | 'closures'>('timeline');

  // Notification Banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Tab 1: Timeline & Grid State ──
  const [selectedDate, setSelectedDate] = useState<string>(initialGrid.date);
  const [gridData, setGridData] = useState<DaySlotGridResult>(initialGrid);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(false);

  // Quick Lock Slot Modal State
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [lockBayId, setLockBayId] = useState<string>('');
  const [lockStartTime, setLockStartTime] = useState<string>('');
  const [lockEndTime, setLockEndTime] = useState<string>('');
  const [lockReason, setLockReason] = useState<string>('');
  const [lockSubmitting, setLockSubmitting] = useState<boolean>(false);

  // Quick Unlock Slot Modal State
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    blockId: string;
    bayName: string;
    timeLabel: string;
    reason: string | null;
  } | null>(null);
  const [unlockSubmitting, setUnlockSubmitting] = useState<boolean>(false);

  // Booking Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<BaySlotItem['booking'] | null>(null);

  // ── Tab 2: Detailing Bays State ──
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [showAddBayModal, setShowAddBayModal] = useState<boolean>(false);
  const [newBayName, setNewBayName] = useState<string>('');
  const [editingBay, setEditingBay] = useState<ResourceItem | null>(null);
  const [bayActionLoading, setBayActionLoading] = useState<boolean>(false);

  // ── Tab 3: Operating Schedule State ──
  // Normalize 7 days: 0..6
  const [schedule, setSchedule] = useState<Array<{ dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }>>(() => {
    const list = [];
    for (let d = 0; d < 7; d++) {
      const found = initialBusinessHours.find((h) => h.dayOfWeek === d);
      list.push({
        dayOfWeek: d,
        startTime: found ? found.startTime : '09:00',
        endTime: found ? found.endTime : '18:00',
        isClosed: found ? (found.isClosed ?? false) : d === 0, // default Sunday closed
      });
    }
    return list;
  });
  const [scheduleSaving, setScheduleSaving] = useState<boolean>(false);

  // ── Tab 4: Closures & Holds State ──
  const [blockedDates, setBlockedDates] = useState<BlockedDateItem[]>(initialBlockedDates);
  const [blockedRanges, setBlockedRanges] = useState<BlockedTimeRangeItem[]>(initialBlockedRanges);

  // New Full-day closure inputs
  const [newClosureDate, setNewClosureDate] = useState<string>('');
  const [newClosureReason, setNewClosureReason] = useState<string>('');
  const [closureSubmitting, setClosureSubmitting] = useState<boolean>(false);

  // New Bay Hold inputs
  const [newHoldBayId, setNewHoldBayId] = useState<string>('');
  const [newHoldDate, setNewHoldDate] = useState<string>(selectedDate);
  const [newHoldStartTime, setNewHoldStartTime] = useState<string>('12:00');
  const [newHoldEndTime, setNewHoldEndTime] = useState<string>('14:00');
  const [newHoldReason, setNewHoldReason] = useState<string>('Bay Equipment Maintenance');
  const [holdSubmitting, setHoldSubmitting] = useState<boolean>(false);

  // ─────────────────────────────────────────────────────────────
  // Fetch / Refresh Day Slot Grid
  // ─────────────────────────────────────────────────────────────
  const fetchGrid = async (dateStr: string) => {
    setLoadingGrid(true);
    try {
      const res = await fetch(`/api/admin/slots/grid?date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.grid) {
        setGridData(data.grid);
      } else {
        showToast(data.error || 'Failed to refresh slot grid', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching slot grid', 'error');
    } finally {
      setLoadingGrid(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchGrid(newDate);
  };

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    handleDateChange(newDateStr);
  };

  // ─────────────────────────────────────────────────────────────
  // Tab 1: Slot Interactions
  // ─────────────────────────────────────────────────────────────
  const handleSlotClick = (slot: BaySlotItem, resourceId: string) => {
    if (slot.status === 'AVAILABLE') {
      const startParts = slot.timeLabel.split(':');
      const startHour = parseInt(startParts[0], 10);
      const startMin = parseInt(startParts[1], 10);
      let endHour = startHour;
      let endMin = startMin + 30;
      if (endMin >= 60) {
        endHour += 1;
        endMin = 0;
      }
      const endStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      setLockBayId(resourceId);
      setLockStartTime(slot.timeLabel);
      setLockEndTime(endStr);
      setLockReason('Temporary Admin Hold / Detailing Buffer');
      setShowLockModal(true);
    } else if (slot.status === 'BLOCKED' && slot.block) {
      const res = resources.find((r) => r.id === resourceId);
      setUnlockTarget({
        blockId: slot.block.id,
        bayName: res ? res.name : 'Detailing Bay',
        timeLabel: slot.timeLabel,
        reason: slot.block.reason,
      });
      setShowUnlockModal(true);
    } else if (slot.status === 'BOOKED' && slot.booking) {
      setSelectedBooking(slot.booking);
    }
  };

  const handleConfirmLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockBayId || !lockStartTime || !lockEndTime) {
      showToast('Please specify bay, start time, and end time', 'error');
      return;
    }
    setLockSubmitting(true);
    try {
      const res = await fetch('/api/admin/slots/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          resourceId: lockBayId,
          startTime: lockStartTime,
          endTime: lockEndTime,
          reason: lockReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Slot locked and held successfully');
        setShowLockModal(false);
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to lock slot', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error locking slot', 'error');
    } finally {
      setLockSubmitting(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    setUnlockSubmitting(true);
    try {
      const res = await fetch('/api/admin/slots/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: unlockTarget.blockId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Slot released and reopened for bookings');
        setShowUnlockModal(false);
        setUnlockTarget(null);
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to release slot', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error releasing slot', 'error');
    } finally {
      setUnlockSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Tab 2: Bay Resource Management
  // ─────────────────────────────────────────────────────────────
  const refreshResources = async () => {
    try {
      const res = await fetch('/api/admin/slots/resources');
      const data = await res.json();
      if (data.success && data.resources) {
        setResources(data.resources);
      }
    } catch (err) {
      console.error('Error refreshing bays:', err);
    }
  };

  const handleToggleBayActive = async (bay: ResourceItem) => {
    setBayActionLoading(true);
    try {
      const res = await fetch('/api/admin/slots/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bay.id,
          isActive: !bay.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Bay ${bay.name} is now ${!bay.isActive ? 'Active' : 'Inactive'}`);
        await refreshResources();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to update bay status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating bay', 'error');
    } finally {
      setBayActionLoading(false);
    }
  };

  const handleCreateBay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBayName.trim()) {
      showToast('Bay name cannot be empty', 'error');
      return;
    }
    setBayActionLoading(true);
    try {
      const res = await fetch('/api/admin/slots/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBayName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Detailing Bay "${newBayName.trim()}" created successfully`);
        setNewBayName('');
        setShowAddBayModal(false);
        await refreshResources();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to create bay', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating bay', 'error');
    } finally {
      setBayActionLoading(false);
    }
  };

  const handleUpdateBayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBay || !editingBay.name.trim()) return;
    setBayActionLoading(true);
    try {
      const res = await fetch('/api/admin/slots/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBay.id,
          name: editingBay.name.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Bay name updated successfully');
        setEditingBay(null);
        await refreshResources();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to rename bay', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error renaming bay', 'error');
    } finally {
      setBayActionLoading(false);
    }
  };

  const handleDeleteBay = async (bay: ResourceItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${bay.name}"?\nIf this bay has prior booking history, please deactivate it instead.`)) {
      return;
    }
    setBayActionLoading(true);
    try {
      const res = await fetch(`/api/admin/slots/resources?id=${bay.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Bay "${bay.name}" deleted successfully`);
        await refreshResources();
        fetchGrid(selectedDate);
      } else {
        // Safe guardrail warning
        showToast(data.error || 'Cannot delete bay', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting bay', 'error');
    } finally {
      setBayActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Tab 3: Operating Schedule
  // ─────────────────────────────────────────────────────────────
  const handleScheduleChange = (dayIndex: number, field: 'startTime' | 'endTime' | 'isClosed', value: any) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === dayIndex ? { ...item, [field]: value } : item))
    );
  };

  const applyMondayToWeekdays = () => {
    const monday = schedule.find((s) => s.dayOfWeek === 1) || {
      startTime: '09:00',
      endTime: '18:00',
      isClosed: false,
    };
    setSchedule((prev) =>
      prev.map((item) => {
        // Days 1 to 5 (Mon to Fri)
        if (item.dayOfWeek >= 1 && item.dayOfWeek <= 5) {
          return {
            ...item,
            startTime: monday.startTime,
            endTime: monday.endTime,
            isClosed: monday.isClosed,
          };
        }
        return item;
      })
    );
    showToast('Monday operating hours copied to Tuesday - Friday');
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const res = await fetch('/api/admin/slots/business-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Studio operating schedule saved successfully');
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to save schedule', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving schedule', 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Tab 4: Closures & Holds Management
  // ─────────────────────────────────────────────────────────────
  const refreshClosuresAndHolds = async () => {
    try {
      const res = await fetch('/api/admin/slots/blocked-dates');
      const data = await res.json();
      if (data.success) {
        if (data.blockedDates) setBlockedDates(data.blockedDates);
        if (data.blockedRanges) setBlockedRanges(data.blockedRanges);
      }
    } catch (err) {
      console.error('Error refreshing closures:', err);
    }
  };

  const handleAddClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClosureDate) {
      showToast('Please select a closure date', 'error');
      return;
    }
    setClosureSubmitting(true);
    try {
      const res = await fetch('/api/admin/slots/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BLOCK_DATE',
          date: newClosureDate,
          reason: newClosureReason || 'Studio Blackout / Holiday',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Studio blackout scheduled for ${newClosureDate}`);
        setNewClosureDate('');
        setNewClosureReason('');
        await refreshClosuresAndHolds();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to add closure', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error adding closure', 'error');
    } finally {
      setClosureSubmitting(false);
    }
  };

  const handleRemoveClosure = async (dateStr: string) => {
    if (!confirm(`Are you sure you want to reopen the studio on ${dateStr}?`)) return;
    try {
      const res = await fetch('/api/admin/slots/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNBLOCK_DATE',
          date: dateStr,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Studio reopened on ${dateStr}`);
        await refreshClosuresAndHolds();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to remove closure', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing closure', 'error');
    }
  };

  const handleAddCustomHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoldDate || !newHoldStartTime || !newHoldEndTime) {
      showToast('Please specify date, start time, and end time', 'error');
      return;
    }
    setHoldSubmitting(true);
    try {
      const startAt = `${newHoldDate}T${newHoldStartTime}:00.000Z`;
      const endAt = `${newHoldDate}T${newHoldEndTime}:00.000Z`;

      const res = await fetch('/api/admin/slots/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BLOCK_RANGE',
          resourceId: newHoldBayId || null,
          startAt,
          endAt,
          reason: newHoldReason || 'Detailing Bay Maintenance',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Bay maintenance hold created successfully');
        await refreshClosuresAndHolds();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to create hold', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating hold', 'error');
    } finally {
      setHoldSubmitting(false);
    }
  };

  const handleDeleteCustomHold = async (holdId: string) => {
    if (!confirm('Are you sure you want to remove this maintenance hold?')) return;
    try {
      const res = await fetch(`/api/admin/slots/blocked-dates?id=${holdId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Maintenance hold deleted');
        await refreshClosuresAndHolds();
        fetchGrid(selectedDate);
      } else {
        showToast(data.error || 'Failed to delete hold', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting hold', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Formatted Date Labels
  // ─────────────────────────────────────────────────────────────
  const displayFormattedDate = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Bay Options for Select
  const baySelectOptions = [
    { label: 'All Detailing Bays (Entire Studio)', value: '' },
    ...resources.map((r) => ({ label: r.name, value: r.id })),
  ];

  return (
    <div className={styles.container}>
      {/* ── Top Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Studio Operations</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Slot & Bay Management Hub</span>
          </div>
          <h1 className={styles.title}>Slot & Bay Manager</h1>
          <p className={styles.subtitle}>
            Oversee detailing bay allocation, 30-minute booking slots, operating hours, and maintenance blackouts.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/calendar" className={styles.secondaryBtn}>
            <Icon.Calendar size={15} />
            <span>Bay Calendar &rarr;</span>
          </Link>
          <Link href="/admin/bookings" className={styles.secondaryBtn}>
            <Icon.Clipboard size={15} />
            <span>Bookings &rarr;</span>
          </Link>
        </div>
      </div>

      {/* ── Toast Feedback ── */}
      {toast && (
        <div className={`${styles.banner} ${toast.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className={styles.modalCloseBtn}>
            <Icon.Cross size={14} />
          </button>
        </div>
      )}

      {/* ── Operational KPI Cards Strip ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGold}`}>
            <Icon.Clock size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Day Slots</span>
            <span className={styles.kpiValue}>{gridData.stats.totalSlots}</span>
            <span className={styles.kpiSubtext}>Across {gridData.resources.length} detailing bays</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
            <Icon.Check size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Available Slots</span>
            <span className={styles.kpiValue}>{gridData.stats.availableSlots}</span>
            <span className={styles.kpiSubtext}>Ready for instant booking</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconBlue}`}>
            <Icon.Car size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Booked Treatments</span>
            <span className={styles.kpiValue}>{gridData.stats.bookedSlots}</span>
            <span className={styles.kpiSubtext}>Active studio appointments</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconAmber}`}>
            <Icon.Lock size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Holds & Maintenance</span>
            <span className={styles.kpiValue}>{gridData.stats.blockedSlots}</span>
            <span className={styles.kpiSubtext}>Reserved / offline slots</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'timeline' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Icon.Clock size={16} />
          <span>Live Bay Timeline</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'bays' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('bays')}
        >
          <Icon.Bay size={16} />
          <span>Detailing Bays ({resources.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'schedule' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Icon.Settings size={16} />
          <span>Operating Schedule</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'closures' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('closures')}
        >
          <Icon.Shield size={16} />
          <span>Closures & Holds ({blockedDates.length + blockedRanges.length})</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: LIVE BAY TIMELINE MATRIX
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div className={styles.tabContent}>
          {/* Date Navigator Bar */}
          <div className={styles.dateNavCard}>
            <div className={styles.dateNavLeft}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => shiftDate(-1)}
                title="Previous Day"
              >
                <Icon.ArrowLeft size={16} />
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              >
                Today
              </button>

              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => shiftDate(1)}
                title="Next Day"
              >
                <Icon.ArrowRight size={16} />
              </button>

              <span className={styles.dateTitle}>{displayFormattedDate()}</span>

              {/* Status Badges */}
              {gridData.isDateBlocked && (
                <span className={`${styles.dateTag} ${styles.dateTagBlocked}`}>
                  Blackout: {gridData.blockedDateReason || 'Studio Closed'}
                </span>
              )}
              {gridData.isDayClosed && !gridData.isDateBlocked && (
                <span className={`${styles.dateTag} ${styles.dateTagClosed}`}>Studio Closed (Regular Off)</span>
              )}
              {!gridData.isDayClosed && !gridData.isDateBlocked && gridData.businessHours && (
                <span className={styles.dateTag}>
                  Open: {gridData.businessHours.open} &ndash; {gridData.businessHours.close}
                </span>
              )}
            </div>

            <div className={styles.dateNavControls}>
              <input
                type="date"
                className={styles.dateInput}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => fetchGrid(selectedDate)}
                disabled={loadingGrid}
                title="Refresh Matrix"
              >
                <Icon.Refresh size={14} className={loadingGrid ? 'animate-spin' : ''} />
                <span>{loadingGrid ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Bay Slot Grid Matrix */}
          <div className={styles.gridWrapper}>
            {gridData.timelineIntervals.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon.Clock size={40} />
                <h3 className={styles.emptyStateTitle}>No Operating Slots for this Date</h3>
                <p className={styles.emptyStateText}>
                  {gridData.isDateBlocked
                    ? 'The studio has a scheduled holiday or emergency blackout on this date.'
                    : 'The studio is closed according to the weekly operating schedule.'}
                </p>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ marginTop: '1rem' }}
                  onClick={() => setActiveTab('schedule')}
                >
                  Adjust Operating Hours
                </button>
              </div>
            ) : (
              <table className={styles.gridTable}>
                <thead>
                  <tr className={styles.gridHeaderRow}>
                    <th className={styles.gridTimeCol}>Time Slot</th>
                    {gridData.resources.map((bay) => (
                      <th key={bay.id} className={styles.bayHeaderCell}>
                        <div className={styles.bayHeaderInfo}>
                          <span>{bay.name}</span>
                          <span
                            className={
                              bay.isActive ? styles.bayHeaderBadge : styles.bayHeaderBadgeInactive
                            }
                          >
                            {bay.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.timelineIntervals.map((interval, rowIdx) => (
                    <tr key={interval} className={styles.gridRow}>
                      <td className={styles.timeCell}>{interval}</td>
                      {gridData.resources.map((bay) => {
                        const slot = gridData.baySlots[bay.id]?.[rowIdx];
                        if (!slot) {
                          return <td key={bay.id}>&mdash;</td>;
                        }

                        // Determine render per status
                        if (slot.status === 'AVAILABLE') {
                          return (
                            <td key={bay.id}>
                              <button
                                type="button"
                                className={`${styles.slotCard} ${styles.slotAvailable}`}
                                onClick={() => handleSlotClick(slot, bay.id)}
                                title="Available Slot. Click to lock or hold."
                              >
                                <div className={styles.slotAvailableText}>
                                  <span>Available</span>
                                  <span className={styles.slotActionHint}>Click to Lock &rarr;</span>
                                </div>
                              </button>
                            </td>
                          );
                        }

                        if (slot.status === 'BOOKED' && slot.booking) {
                          return (
                            <td key={bay.id}>
                              <button
                                type="button"
                                className={`${styles.slotCard} ${styles.slotBooked}`}
                                onClick={() => handleSlotClick(slot, bay.id)}
                                title={`Booked: ${slot.booking.customerName} - ${slot.booking.treatmentName}`}
                              >
                                <div className={styles.bookingTopRow}>
                                  <span className={styles.bookingClient}>{slot.booking.customerName}</span>
                                  {slot.booking.isDropoff && (
                                    <span className={styles.dropoffBadge}>Drop-Off</span>
                                  )}
                                </div>
                                <div className={styles.bookingTreatment}>{slot.booking.treatmentName}</div>
                                {slot.booking.vehicleText && (
                                  <div className={styles.bookingVehicle}>{slot.booking.vehicleText}</div>
                                )}
                              </button>
                            </td>
                          );
                        }

                        if (slot.status === 'BLOCKED' && slot.block) {
                          return (
                            <td key={bay.id}>
                              <button
                                type="button"
                                className={`${styles.slotCard} ${styles.slotBlocked}`}
                                onClick={() => handleSlotClick(slot, bay.id)}
                                title="Locked / Maintenance Hold. Click to release."
                              >
                                <div className={styles.blockTitle}>
                                  <Icon.Lock size={12} />
                                  <span>Hold / Blocked</span>
                                </div>
                                <div className={styles.blockReason}>
                                  {slot.block.reason || 'Admin Reserved'}
                                </div>
                              </button>
                            </td>
                          );
                        }

                        if (slot.status === 'BUFFER') {
                          return (
                            <td key={bay.id}>
                              <div className={`${styles.slotCard} ${styles.slotBuffer}`}>
                                <div className={styles.bufferText}>
                                  <Icon.Refresh size={12} />
                                  <span>Turnover Buffer (30m)</span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={bay.id}>
                            <div className={`${styles.slotCard} ${styles.slotInactive}`}>
                              <span>Bay Inactive</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: DETAILING BAYS & CAPACITY
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'bays' && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <Icon.Bay size={20} color="#B45309" />
                <div>
                  <h3 className={styles.cardTitle}>Detailing Bays Configuration</h3>
                  <p className={styles.cardSubtitle}>
                    Manage detailing bays, paint protection studios, and wash bays. Deactivated bays cannot receive new appointments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setShowAddBayModal(true)}
              >
                <Icon.Plus size={15} />
                <span>Add Detailing Bay</span>
              </button>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.baysGrid}>
                {resources.map((bay) => (
                  <div key={bay.id} className={styles.bayCard}>
                    <div className={styles.bayCardHeader}>
                      <div>
                        <div className={styles.bayName}>{bay.name}</div>
                        <span
                          className={bay.isActive ? styles.bayHeaderBadge : styles.bayHeaderBadgeInactive}
                          style={{ marginTop: '4px', display: 'inline-block' }}
                        >
                          {bay.isActive ? 'Online & Bookable' : 'Offline / Inactive'}
                        </span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={bay.isActive}
                          onChange={() => handleToggleBayActive(bay)}
                          disabled={bayActionLoading}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>

                    <div className={styles.bayActionsRow}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => setEditingBay({ ...bay })}
                        disabled={bayActionLoading}
                      >
                        <Icon.Edit size={14} />
                        <span>Rename</span>
                      </button>

                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteBay(bay)}
                        disabled={bayActionLoading}
                      >
                        <Icon.Trash size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: OPERATING SCHEDULE
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <Icon.Settings size={20} color="#B45309" />
                <div>
                  <h3 className={styles.cardTitle}>Studio Operating Hours</h3>
                  <p className={styles.cardSubtitle}>
                    Set normal studio operating hours across all 7 days of the week. Times govern public and internal slot availability.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={applyMondayToWeekdays}
                >
                  <Icon.Repeat size={14} />
                  <span>Copy Mon &rarr; Tue-Fri</span>
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSaveSchedule}
                  disabled={scheduleSaving}
                >
                  <Icon.Check size={15} />
                  <span>{scheduleSaving ? 'Saving...' : 'Save Schedule Changes'}</span>
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <table className={styles.scheduleTable}>
                <tbody>
                  {schedule.map((entry, idx) => (
                    <tr key={entry.dayOfWeek} className={styles.scheduleRow}>
                      <td className={styles.scheduleDayName}>
                        {DAY_NAMES[entry.dayOfWeek]}
                      </td>
                      <td>
                        <div className={styles.scheduleControls}>
                          <label className={styles.switchLabel}>
                            <div className={styles.switch}>
                              <input
                                type="checkbox"
                                checked={entry.isClosed}
                                onChange={(e) => handleScheduleChange(idx, 'isClosed', e.target.checked)}
                              />
                              <span className={styles.slider} />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: entry.isClosed ? '#DC2626' : '#15803D', width: '110px' }}>
                              {entry.isClosed ? 'Closed All Day' : 'Operating'}
                            </span>
                          </label>

                          {!entry.isClosed && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Open:</span>
                                <input
                                  type="time"
                                  className={styles.timeInput}
                                  value={entry.startTime}
                                  onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                                />
                              </div>

                              <span style={{ color: '#94A3B8' }}>&ndash;</span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Close:</span>
                                <input
                                  type="time"
                                  className={styles.timeInput}
                                  value={entry.endTime}
                                  onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: CLOSURES & HOLDS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'closures' && (
        <div className={styles.tabContent}>
          {/* Section 1: Full-Day Blackouts */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <Icon.Shield size={20} color="#B45309" />
                <div>
                  <h3 className={styles.cardTitle}>Full-Day Studio Closures</h3>
                  <p className={styles.cardSubtitle}>
                    Designate holiday blackouts, public holidays, or whole-studio private events. No slots can be booked.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleAddClosure} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className={styles.formGroup} style={{ minWidth: '180px' }}>
                  <label className={styles.formLabel}>Closure Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={newClosureDate}
                    onChange={(e) => setNewClosureDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ flex: 1, minWidth: '240px' }}>
                  <label className={styles.formLabel}>Reason / Holiday Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Diwali Holiday, Studio Deep Cleaning, etc."
                    value={newClosureReason}
                    onChange={(e) => setNewClosureReason(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={closureSubmitting}
                >
                  <Icon.Plus size={15} />
                  <span>{closureSubmitting ? 'Adding...' : 'Add Studio Blackout'}</span>
                </button>
              </form>

              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Blackout Date</th>
                      <th>Reason / Note</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedDates.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                          No scheduled full-day studio closures.
                        </td>
                      </tr>
                    ) : (
                      blockedDates.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.date}</td>
                          <td>{item.reason || 'Studio Closed'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              onClick={() => handleRemoveClosure(item.date)}
                            >
                              <Icon.Trash size={13} />
                              <span>Reopen Date</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Bay Maintenance Holds */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <Icon.Lock size={20} color="#B45309" />
                <div>
                  <h3 className={styles.cardTitle}>Custom Bay Maintenance Holds</h3>
                  <p className={styles.cardSubtitle}>
                    Reserve specific bays for scheduled maintenance, machinery overhaul, or VIP buffer time.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleAddCustomHold} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className={styles.formGroup} style={{ minWidth: '220px' }}>
                  <label className={styles.formLabel}>Detailing Bay</label>
                  <Select
                    options={baySelectOptions}
                    value={newHoldBayId}
                    onChange={(val) => setNewHoldBayId(val || '')}
                    placeholder="All Detailing Bays"
                  />
                </div>

                <div className={styles.formGroup} style={{ minWidth: '150px' }}>
                  <label className={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={newHoldDate}
                    onChange={(e) => setNewHoldDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ minWidth: '110px' }}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={newHoldStartTime}
                    onChange={(e) => setNewHoldStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ minWidth: '110px' }}>
                  <label className={styles.formLabel}>End Time</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={newHoldEndTime}
                    onChange={(e) => setNewHoldEndTime(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                  <label className={styles.formLabel}>Maintenance Reason</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Scissor Lift Service"
                    value={newHoldReason}
                    onChange={(e) => setNewHoldReason(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={holdSubmitting}
                >
                  <Icon.Plus size={15} />
                  <span>{holdSubmitting ? 'Creating...' : 'Create Hold'}</span>
                </button>
              </form>

              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Target Bay</th>
                      <th>Window & Time</th>
                      <th>Reason / Note</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedRanges.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                          No active bay maintenance holds.
                        </td>
                      </tr>
                    ) : (
                      blockedRanges.map((range) => {
                        const start = new Date(range.startAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const end = new Date(range.endAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={range.id}>
                            <td style={{ fontWeight: 700 }}>
                              {range.resourceName || 'All Detailing Bays'}
                            </td>
                            <td>{`${start} – ${end}`}</td>
                            <td>{range.reason || 'Admin Maintenance Hold'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={() => handleDeleteCustomHold(range.id)}
                              >
                                <Icon.Trash size={13} />
                                <span>Release Hold</span>
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
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: QUICK LOCK SLOT
      ════════════════════════════════════════════════════════════ */}
      {showLockModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Quick Lock / Hold Detailing Slot</h3>
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className={styles.modalCloseBtn}
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmLock}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Bay</label>
                  <Select
                    options={resources.map((r) => ({ label: r.name, value: r.id }))}
                    value={lockBayId}
                    onChange={(val) => setLockBayId(val || '')}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Time</label>
                    <input
                      type="time"
                      className={styles.formInput}
                      value={lockStartTime}
                      onChange={(e) => setLockStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>End Time</label>
                    <input
                      type="time"
                      className={styles.formInput}
                      value={lockEndTime}
                      onChange={(e) => setLockEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hold Reason / Internal Note</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Walk-in consultation, Drying bay reserved, Equipment test"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    required
                  />
                  <span className={styles.formHint}>
                    This slot will be immediately blocked on the public website and internal calendar.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setShowLockModal(false)}
                  disabled={lockSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={lockSubmitting}
                >
                  <Icon.Lock size={14} />
                  <span>{lockSubmitting ? 'Locking...' : 'Lock Slot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: QUICK UNLOCK / RELEASE SLOT
      ════════════════════════════════════════════════════════════ */}
      {showUnlockModal && unlockTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Release Detailing Slot</h3>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className={styles.modalCloseBtn}
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
                Are you sure you want to release the hold on <strong>{unlockTarget.bayName}</strong> at <strong>{unlockTarget.timeLabel}</strong>?
              </p>
              {unlockTarget.reason && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', fontSize: '0.8125rem', color: '#9A3412' }}>
                  <strong>Current Reason:</strong> {unlockTarget.reason}
                </div>
              )}
              <span className={styles.formHint}>
                Releasing this hold will instantly return this slot to available inventory for public and admin bookings.
              </span>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowUnlockModal(false)}
                disabled={unlockSubmitting}
              >
                Keep Locked
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleConfirmUnlock}
                disabled={unlockSubmitting}
              >
                <Icon.Check size={14} />
                <span>{unlockSubmitting ? 'Releasing...' : 'Release & Reopen Slot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: BOOKING DETAIL VIEW
      ════════════════════════════════════════════════════════════ */}
      {selectedBooking && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Scheduled Treatment</h3>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className={styles.modalCloseBtn}
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{selectedBooking.customerName}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>{selectedBooking.customerPhone}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Treatment</span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#B45309' }}>{selectedBooking.treatmentName}</div>
                </div>

                {selectedBooking.vehicleText && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vehicle</span>
                    <div style={{ fontSize: '0.875rem', color: '#1E293B' }}>{selectedBooking.vehicleText}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Duration</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{selectedBooking.durationMinutes} mins</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#15803D' }}>{selectedBooking.status}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
              <Link
                href={`/admin/bookings?search=${encodeURIComponent(selectedBooking.customerName)}`}
                className={styles.primaryBtn}
                onClick={() => setSelectedBooking(null)}
              >
                <Icon.Clipboard size={14} />
                <span>View in Bookings List &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ADD NEW DETAILING BAY
      ════════════════════════════════════════════════════════════ */}
      {showAddBayModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Detailing Bay</h3>
              <button
                type="button"
                onClick={() => setShowAddBayModal(false)}
                className={styles.modalCloseBtn}
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBay}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bay Identifier / Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Bay 3 (PPF & Tinting Studio)"
                    value={newBayName}
                    onChange={(e) => setNewBayName(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className={styles.formHint}>
                    Creating a bay immediately adds an allocation column to the live grid and expands studio booking capacity.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setShowAddBayModal(false)}
                  disabled={bayActionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={bayActionLoading}
                >
                  <Icon.Plus size={14} />
                  <span>{bayActionLoading ? 'Creating...' : 'Create Bay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: RENAME DETAILING BAY
      ════════════════════════════════════════════════════════════ */}
      {editingBay && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Rename Detailing Bay</h3>
              <button
                type="button"
                onClick={() => setEditingBay(null)}
                className={styles.modalCloseBtn}
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateBayName}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bay Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editingBay.name}
                    onChange={(e) => setEditingBay({ ...editingBay, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setEditingBay(null)}
                  disabled={bayActionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={bayActionLoading}
                >
                  <Icon.Check size={14} />
                  <span>{bayActionLoading ? 'Saving...' : 'Save Name'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
