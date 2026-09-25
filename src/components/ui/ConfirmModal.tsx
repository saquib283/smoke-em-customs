'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './ui.module.css';

/* ─── Confirmation Modal ─── */

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Sync open state with dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the cancel button by default for safety
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    },
    [onCancel, loading],
  );

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current && !loading) {
        onCancel();
      }
    },
    [onCancel, loading],
  );

  if (!open) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return <Icon.Trash size={22} color="var(--color-error, #EF4444)" />;
      case 'warning':
        return <Icon.AlertTriangle size={22} color="var(--color-warning, #F59E0B)" />;
      default:
        return <Icon.Question size={22} color="var(--color-accent-primary, #E5A93C)" />;
    }
  };

  const btnClass =
    variant === 'danger'
      ? 'btn btn-danger'
      : variant === 'warning'
        ? 'btn btn-primary'
        : 'btn btn-primary';

  return (
    <dialog
      ref={dialogRef}
      className={styles.confirmDialog}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div className={styles.confirmContent}>
        <div className={`${styles.confirmIconCircle} ${styles[`confirmIcon${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}>
          {renderIcon()}
        </div>
        <h2 id="confirm-modal-title" className={styles.confirmTitle}>
          {title}
        </h2>
        {description && (
          <p id="confirm-modal-desc" className={styles.confirmDescription}>
            {description}
          </p>
        )}
        <div className={styles.confirmActions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={btnClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
