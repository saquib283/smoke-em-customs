'use client';

import React from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './ui.module.css';

/* ─── Empty State ─── */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const defaultIcon = <Icon.EmptyInbox size={isCompact ? 24 : 36} color="var(--color-text-muted, #71717A)" />;

  return (
    <div
      className={`${styles.emptyState} ${isCompact ? styles.emptyStateCompact : ''} ${className}`}
      role="status"
    >
      <div className={`${styles.emptyStateIcon} ${isCompact ? styles.emptyStateIconCompact : ''}`}>
        {icon || defaultIcon}
      </div>
      <h3 className={`${styles.emptyStateTitle} ${isCompact ? styles.emptyStateTitleCompact : ''}`}>
        {title}
      </h3>
      {description && (
        <p className={styles.emptyStateDescription}>{description}</p>
      )}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <a href={actionHref} className="btn btn-primary btn-sm">
            {actionLabel}
          </a>
        ) : (
          <button onClick={onAction} className="btn btn-primary btn-sm" type="button">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
