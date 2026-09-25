'use client';

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './ui.module.css';

/* ─── Toast Types ─── */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/* ─── Hook ─── */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback — component not wrapped in provider, return noop
    return {
      toast: (_: Omit<Toast, 'id'>) => {},
      success: (title: string, description?: string) => {},
      error: (title: string, description?: string) => {},
      warning: (title: string, description?: string) => {},
      info: (title: string, description?: string) => {},
    };
  }

  return {
    toast: ctx.addToast,
    success: (title: string, description?: string) =>
      ctx.addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      ctx.addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      ctx.addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      ctx.addToast({ type: 'info', title, description }),
  };
}

/* ─── Provider ─── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext>
  );
}

/* ─── Toast Item ─── */

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <Icon.Check size={16} />;
    case 'error':
      return <Icon.Cross size={16} />;
    case 'warning':
      return <Icon.AlertTriangle size={16} />;
    case 'info':
      return <Icon.Info size={16} />;
  }
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`${styles.toastItem} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]} ${exiting ? styles.toastExit : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastIcon} aria-hidden="true">
        {getToastIcon(toast.type)}
      </div>
      <div className={styles.toastContent}>
        <span className={styles.toastTitle}>{toast.title}</span>
        {toast.description && (
          <span className={styles.toastDescription}>{toast.description}</span>
        )}
      </div>
      <button
        className={styles.toastDismiss}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        type="button"
      >
        <Icon.Cross size={14} />
      </button>
      {/* Progress bar */}
      <div
        className={styles.toastProgress}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

/* ─── Container ─── */

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer} aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
