'use client';

import React from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './ui.module.css';

/* ─── Error State ─── */

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: 'page' | 'inline' | 'card';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  variant = 'inline',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`${styles.errorState} ${styles[`errorState${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}
      role="alert"
    >
      <div className={styles.errorStateIcon} aria-hidden="true">
        <Icon.AlertTriangle size={24} color="var(--color-error, #EF4444)" />
      </div>
      <div className={styles.errorStateContent}>
        <h3 className={styles.errorStateTitle}>{title}</h3>
        <p className={styles.errorStateMessage}>{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon.Refresh size={14} /> Retry
        </button>
      )}
    </div>
  );
}

/* ─── Inline Field Error ─── */

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}
