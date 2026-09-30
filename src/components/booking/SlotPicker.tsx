'use client';

import React, { useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './bookingComponents.module.css';

export interface TimeSlot {
  startAt: string;
  endAt: string;
  resourceId: string;
  resourceName: string;
  isAvailable: boolean;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  loading?: boolean;
  error?: string | null;
}

export function SlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  loading = false,
  error = null,
}: SlotPickerProps) {
  // Group slots into morning (before 13:00) and afternoon (13:00+)
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];

    for (const slot of slots) {
      const d = new Date(slot.startAt);
      const hours = d.getUTCHours(); // or local hours depending on ISO string
      // With ISO like "2026-10-15T10:00:00.000Z", hours is 10
      if (hours < 13) {
        morning.push(slot);
      } else {
        afternoon.push(slot);
      }
    }

    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    // Format based on UTC since slot generator outputs UTC strings
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHour}:${displayMin} ${ampm}`;
  };

  const formatSlotLabel = (slot: TimeSlot) => {
    const durationHrs = (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / (1000 * 60 * 60);
    if (durationHrs > 9) {
      const days = Math.max(2, Math.round(durationHrs / 8));
      return `Drop-off at ${formatSlotTime(slot.startAt)} • ~${days} Days Bay Hold`;
    }
    return `${formatSlotTime(slot.startAt)} – ${formatSlotTime(slot.endAt)}`;
  };

  if (loading) {
    return (
      <div className={styles.slotPickerContainer}>
        <span className={styles.datePickerLabel}>2. Checking Bay Occupancy & Slots...</span>
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className={styles.slotPickerContainer}>
        <span className={styles.datePickerLabel}>2. Available Detailing Bays</span>
        <div className={styles.emptySlotsNotice}>
          <div className={styles.emptyNoticeTitle}>No Bay Slots Available on This Date</div>
          <p>
            All positive-pressure detailing bays are currently allocated or this date is outside operational hours.
          </p>
          <p style={{ color: 'var(--color-gold)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Lightbulb size={14} color="var(--color-gold)" /> Try picking the next available working day, or reach out to our studio concierge directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slotPickerContainer}>
      <span className={styles.datePickerLabel}>2. Choose Available Detailing Bay & Time</span>

      {error && (
        <div style={{ color: '#EF4444', fontSize: 'var(--text-xs)', background: 'rgba(239, 68, 68, 0.1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {morningSlots.length > 0 && (
        <div className={styles.slotGroup}>
          <div className={styles.slotGroupTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Sunrise size={16} color="var(--color-gold)" /> Morning Detailing Slots
          </div>
          <div className={styles.slotGrid} role="radiogroup" aria-label="Morning slots">
            {morningSlots.map((slot) => {
              const isSelected =
                selectedSlot?.startAt === slot.startAt &&
                selectedSlot?.resourceId === slot.resourceId;
              const durationHrs = (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / (1000 * 60 * 60);
              const isMultiDay = durationHrs > 9;

              return (
                <button
                  key={`${slot.resourceId}-${slot.startAt}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slotCard} ${isSelected ? styles.slotCardSelected : ''}`}
                  onClick={() => onSelectSlot(slot)}
                >
                  <div className={styles.slotTimeRange}>
                    {formatSlotLabel(slot)}
                  </div>
                  <div className={styles.slotBayTag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Bay size={14} color="var(--color-gold)" /> {slot.resourceName}
                  </div>
                  <span className={styles.slotBadge}>
                    {isMultiDay ? 'Dedicated Multi-Day Bay Hold' : 'Bay Reserved for Treatment'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {afternoonSlots.length > 0 && (
        <div className={styles.slotGroup}>
          <div className={styles.slotGroupTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Sun size={16} color="var(--color-gold)" /> Afternoon & Evening Slots
          </div>
          <div className={styles.slotGrid} role="radiogroup" aria-label="Afternoon slots">
            {afternoonSlots.map((slot) => {
              const isSelected =
                selectedSlot?.startAt === slot.startAt &&
                selectedSlot?.resourceId === slot.resourceId;
              const durationHrs = (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / (1000 * 60 * 60);
              const isMultiDay = durationHrs > 9;

              return (
                <button
                  key={`${slot.resourceId}-${slot.startAt}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slotCard} ${isSelected ? styles.slotCardSelected : ''}`}
                  onClick={() => onSelectSlot(slot)}
                >
                  <div className={styles.slotTimeRange}>
                    {formatSlotLabel(slot)}
                  </div>
                  <div className={styles.slotBayTag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon.Bay size={14} color="var(--color-gold)" /> {slot.resourceName}
                  </div>
                  <span className={styles.slotBadge}>
                    {isMultiDay ? 'Dedicated Multi-Day Bay Hold' : 'Bay Reserved for Treatment'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
