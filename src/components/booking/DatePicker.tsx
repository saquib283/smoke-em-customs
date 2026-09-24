'use client';

import React, { useMemo } from 'react';
import styles from './bookingComponents.module.css';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  blockedDates?: string[];
  daysCount?: number;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  blockedDates = [],
  daysCount = 14,
}: DatePickerProps) {
  // Generate date list starting from today
  const dateOptions = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);

      const iso = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 = Sun
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      // Sundays are studio closed days
      const isSunday = dayOfWeek === 0;
      const isBlocked = blockedDates.includes(iso);
      const isToday = i === 0;
      const isTomorrow = i === 1;

      list.push({
        iso,
        dayName,
        dayNum,
        monthName,
        disabled: isSunday || isBlocked,
        isToday,
        isTomorrow,
        reason: isSunday ? 'Studio Closed (Sunday)' : isBlocked ? 'Studio Holiday / Blocked' : undefined,
      });
    }
    return list;
  }, [daysCount, blockedDates]);

  // Compute minimum date for the native input (today)
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.datePickerContainer}>
      <div className={styles.datePickerHeader}>
        <span className={styles.datePickerLabel}>1. Select Appointment Date</span>
        <input
          type="date"
          aria-label="Pick date"
          className={styles.datePickerDirectInput}
          min={todayIso}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(e.target.value);
            }
          }}
        />
      </div>

      <div className={styles.dateScroller} role="radiogroup" aria-label="Available dates">
        {dateOptions.map((opt) => {
          const isSelected = selectedDate === opt.iso;
          return (
            <button
              key={opt.iso}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={opt.disabled}
              title={opt.reason || opt.iso}
              className={`${styles.dateCard} ${isSelected ? styles.dateCardSelected : ''} ${
                opt.disabled ? styles.dateCardDisabled : ''
              }`}
              onClick={() => onDateChange(opt.iso)}
            >
              <span className={styles.dayName}>{opt.dayName}</span>
              <span className={styles.dayNumber}>{opt.dayNum}</span>
              <span className={styles.monthName}>{opt.monthName}</span>
              {opt.isToday && <span className={styles.todayBadge}>Today</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
